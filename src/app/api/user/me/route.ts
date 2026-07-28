import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
/** Ensures Mongoose registers StaffRole before populate("staffRole"). */
import "@/lib/models/StaffRole";
import { verifyPassword } from "@/lib/password";
import { generateUniqueInviteCode } from "@/lib/invitation";
import { ALL_ADMIN_PERMISSION_IDS } from "@/lib/permissions";
import {
    resolveAdminAccessForUserId,
    adminHasPermission as checkPerm,
} from "@/lib/services/server/admin-auth.server";
import PasswordChangeRequest from "@/lib/models/PasswordChangeRequest";
import Transaction from "@/lib/models/Transaction";
import WithdrawWalletRequest from "@/lib/models/WithdrawWalletRequest";
import { isSuperAdminEmail } from "@/lib/super-admin";
import { taskSettingsServer } from "@/lib/services/server/task-settings.server";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;
        let user = await User.findById(userId).select("-password").populate("staffRole", "name permissions");

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Ensure legacy accounts have invitation codes so they can invite others.
        if (!user.invitationCode) {
            const inviteCode = await generateUniqueInviteCode(
                async (code) => !!(await User.exists({ invitationCode: code }))
            );
            await User.findByIdAndUpdate(userId, { $set: { invitationCode: inviteCode } });
            user = await User.findById(userId).select("-password").populate("staffRole", "name permissions");
        }

        // BRUTE FORCE: If fields are missing in the object, update the DB directly
        const needsInitialization = 
            user.dailyTasksCompleted === undefined || 
            user.dailyCommission === undefined ||
            user.maxDailyTasks === undefined;

        if (needsInitialization) {
            await User.findByIdAndUpdate(userId, {
                $set: {
                    dailyTasksCompleted: user.dailyTasksCompleted ?? 0,
                    dailyCommission: user.dailyCommission ?? 0,
                    maxDailyTasks: user.maxDailyTasks ?? 25,
                    totalCommission: user.totalCommission ?? 0,
                    lastGrabDate: user.lastGrabDate ?? new Date(),
                    status: user.status ?? "ACTIVE",
                    taskRequestStatus: user.taskRequestStatus ?? "NONE",
                    comboConfig: user.comboConfig ?? []
                }
            }, { new: true });
            
            // Refetch fresh document
            user = await User.findById(userId).select("-password").populate("staffRole", "name permissions");
        }

        const emailNorm = String(user.email || "").trim().toLowerCase();
        if (user.role === "ADMIN" && isSuperAdminEmail(emailNorm) && user.staffRole != null) {
            await User.findByIdAndUpdate(userId, { $set: { staffRole: null } });
            user = await User.findById(userId).select("-password").populate("staffRole", "name permissions");
        }

        const access = await resolveAdminAccessForUserId(userId);
        const isSuperAdmin = access.ok && access.isSuperAdmin;
        const adminPermissions =
            access.ok && !access.isSuperAdmin
                ? ALL_ADMIN_PERMISSION_IDS.filter((id) => checkPerm(access, id))
                : access.ok
                  ? [...ALL_ADMIN_PERMISSION_IDS]
                  : [];

        const hasPendingWithdraw = Boolean(
            await Transaction.exists({ userId, type: "WITHDRAW", status: "PENDING" })
        );
        const hasPendingDeposit = Boolean(
            await Transaction.exists({ userId, type: "DEPOSIT", status: "PENDING" })
        );
        const hasPendingWithdrawWalletChange = Boolean(
            await WithdrawWalletRequest.exists({ userId, status: "PENDING" })
        );
        const taskSettings = await taskSettingsServer.getSettings();
        const completedTasks = Number(user.dailyTasksCompleted || 0);
        const maxTasks = Number(user.maxDailyTasks || 25);
        const cooldownMs = taskSettings.requestCooldownMinutes * 60 * 1000;
        const completedAt = user.lastGrabDate ? new Date(user.lastGrabDate).getTime() : 0;
        const nextTaskRequestAt =
            completedTasks >= maxTasks && cooldownMs > 0 && completedAt > 0
                ? new Date(completedAt + cooldownMs).toISOString()
                : null;
        const canRequestTasks =
            (user.taskRequestStatus || "NONE") === "NONE" &&
            (completedTasks < maxTasks || !nextTaskRequestAt || Date.now() >= new Date(nextTaskRequestAt).getTime());

        // Return a clean object to ensure all fields are visible to frontend
        const base = user.toObject();
        return NextResponse.json({
            ...base,
            dailyTasksCompleted: user.dailyTasksCompleted || 0,
            dailyCommission: user.dailyCommission || 0,
            maxDailyTasks: user.maxDailyTasks || 25,
            totalCommission: user.totalCommission || 0,
            status: user.status || "ACTIVE",
            taskRequestStatus: user.taskRequestStatus || "NONE",
            comboConfig: user.comboConfig || [],
            isSuperAdmin: Boolean(isSuperAdmin),
            adminPermissions,
            hasPendingWithdraw,
            hasPendingDeposit,
            hasPendingWithdrawWalletChange,
            taskRequestCooldownMinutes: taskSettings.requestCooldownMinutes,
            nextTaskRequestAt,
            canRequestTasks,
            savedWithdrawAddress: String((user as { savedWithdrawAddress?: string }).savedWithdrawAddress || "").trim(),
            savedWithdrawNetwork: String((user as { savedWithdrawNetwork?: string }).savedWithdrawNetwork || "Binance (TRC-20)").trim() || "Binance (TRC-20)",
        });
    } catch (error) {
        console.error("[GET /api/user/me]", error);
        const msg = error instanceof Error ? error.message : "Server error";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

// PATCH /api/user/me — update name and/or password
export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any).id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, currentPassword, newPassword } = await req.json();
        await dbConnect();

        const user = await User.findById((session.user as any).id);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        if (name?.trim()) user.name = name.trim();

        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: "Current password is required" }, { status: 400 });
            }
            const isMatch = await verifyPassword(currentPassword, user.password);
            if (!isMatch) {
                return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
            }
            if (newPassword.length < 6) {
                return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
            }

            const pending = await PasswordChangeRequest.findOne({
                userId: user._id,
                status: "PENDING",
            });
            if (pending) {
                return NextResponse.json(
                    { error: "You already have a pending password change request" },
                    { status: 400 }
                );
            }

            await PasswordChangeRequest.create({
                userId: user._id,
                newPassword,
                status: "PENDING",
            });

            await user.save();
            return NextResponse.json({
                success: true,
                name: user.name,
                message: "Password change request submitted to admin",
            });
        }

        await user.save();
        return NextResponse.json({ success: true, name: user.name });
    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
