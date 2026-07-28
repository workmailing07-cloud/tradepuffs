import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "@/lib/models/User";
import StaffRole from "@/lib/models/StaffRole";
import Transaction from "@/lib/models/Transaction";
import GrabOrder from "@/lib/models/GrabOrder";
import CSRequest from "@/lib/models/CSRequest";
import DepositAddress from "@/lib/models/DepositAddress";
import PasswordChangeRequest from "@/lib/models/PasswordChangeRequest";
import WithdrawWalletRequest from "@/lib/models/WithdrawWalletRequest";
import dbConnect from "@/lib/mongodb";
import { generateUniqueInviteCode } from "@/lib/invitation";
import {
    assertAdminPermission,
    resolveAdminAccessForUserId,
} from "@/lib/services/server/admin-auth.server";
import { grabServerService } from "@/lib/services/server/grab.server";

function toPublicUser(doc: any) {
    const o = doc.toObject ? doc.toObject() : { ...doc };
    delete o.password;
    return o;
}

async function parseStaffRoleForAdmin(data: {
    role?: "USER" | "ADMIN";
    staffRole?: string | null;
    actorIsSuperAdmin: boolean;
    requireWhenAdmin: boolean;
}): Promise<mongoose.Types.ObjectId | null | undefined> {
    if (data.role !== "ADMIN") return undefined;
    const raw = data.staffRole;
    if (raw === undefined && !data.requireWhenAdmin) return undefined;
    if (raw === null || raw === "") {
        if (!data.actorIsSuperAdmin) {
            throw new Error("Only a full administrator can assign unrestricted admin access (no role)");
        }
        return null;
    }
    if (raw === undefined && data.requireWhenAdmin) {
        throw new Error("Staff role is required for new admin accounts");
    }
    if (raw === undefined) return undefined;
    const oid = new mongoose.Types.ObjectId(String(raw));
    const exists = await StaffRole.findById(oid);
    if (!exists) throw new Error("Invalid staff role");
    return oid;
}

export const adminUsersServer = {
    async assertManageUsers(adminUserId: string) {
        return assertAdminPermission(adminUserId, "MANAGE_USERS");
    },

    async list(search?: string, role?: string, limit = 200) {
        await dbConnect();
        const query: Record<string, unknown> = {};
        if (role === "ADMIN" || role === "USER") query.role = role;
        if (search?.trim()) {
            const s = search.trim();
            query.$or = [
                { name: { $regex: s, $options: "i" } },
                { email: { $regex: s, $options: "i" } },
                { invitationCode: { $regex: s, $options: "i" } },
            ];
        }
        return User.find(query)
            .select("-password")
            .populate("staffRole", "name permissions")
            .sort({ createdAt: -1 })
            .limit(Math.min(limit, 500))
            .lean();
    },

    async getById(id: string) {
        await dbConnect();
        const user = await User.findById(id).populate("staffRole", "name permissions description");
        if (!user) return null;
        const publicFields = toPublicUser(user);
        return {
            ...publicFields,
            /** Stored bcrypt digest. */
            storedPasswordHash: user.password,
            storedPlainPassword: user.plainPassword || "",
        };
    },

    async create(
        actorId: string,
        data: {
            name: string;
            email: string;
            password: string;
            role?: "USER" | "ADMIN";
            staffRole?: string | null;
            balance?: number;
            status?: string;
            inviterInvitationCode?: string;
        }
    ) {
        await assertAdminPermission(actorId, "MANAGE_USERS");
        const actor = await resolveAdminAccessForUserId(actorId);
        if (!actor.ok) throw new Error("Forbidden");

        await dbConnect();
        const email = String(data.email || "").trim().toLowerCase();
        const name = String(data.name || "").trim();
        const password = String(data.password || "");
        if (!name || !email || password.length < 6) {
            throw new Error("Name, email, and password (min 6 chars) are required");
        }
        const exists = await User.exists({ email });
        if (exists) throw new Error("Email already registered");

        const isAdmin = data.role === "ADMIN";
        const staffOid = await parseStaffRoleForAdmin({
            role: isAdmin ? "ADMIN" : "USER",
            staffRole: data.staffRole,
            actorIsSuperAdmin: actor.isSuperAdmin,
            requireWhenAdmin: isAdmin && !actor.isSuperAdmin,
        });

        let invitedBy: mongoose.Types.ObjectId | undefined;
        let invitedByCode = "";
        let inviterIdForCount: mongoose.Types.ObjectId | undefined;
        const inviterCode = String(data.inviterInvitationCode || "").trim().toUpperCase();
        if (inviterCode) {
            const inviter = await User.findOne({ invitationCode: inviterCode });
            if (inviter) {
                invitedBy = inviter._id as mongoose.Types.ObjectId;
                inviterIdForCount = inviter._id as mongoose.Types.ObjectId;
                invitedByCode = inviterCode;
            }
        }

        const hashed = await bcrypt.hash(password, 12);
        const invitationCode = await generateUniqueInviteCode(async (code) =>
            !!(await User.exists({ invitationCode: code }))
        );

        const user = await User.create({
            name,
            email,
            password: hashed,
            plainPassword: password,
            role: isAdmin ? "ADMIN" : "USER",
            staffRole: isAdmin ? (staffOid === undefined ? null : staffOid) : null,
            balance: typeof data.balance === "number" ? data.balance : 0,
            status: data.status || "ACTIVE",
            invitationCode,
            invitedBy,
            invitedByCode: invitedByCode || undefined,
        });

        if (inviterIdForCount) {
            await User.findByIdAndUpdate(inviterIdForCount, { $inc: { totalInvites: 1 } });
        }

        const populated = await User.findById(user._id)
            .select("-password")
            .populate("staffRole", "name permissions");
        const pub = populated ? toPublicUser(populated) : toPublicUser(user);
        return {
            user: pub,
            plainPasswordEcho: password,
        };
    },

    async update(
        id: string,
        adminUserId: string,
        data: {
            name?: string;
            email?: string;
            password?: string;
            role?: "USER" | "ADMIN";
            staffRole?: string | null;
            balance?: number;
            status?: string;
            maxDailyTasks?: number;
            dailyTasksCompleted?: number;
            taskRequestStatus?: string;
        }
    ) {
        await assertAdminPermission(adminUserId, "MANAGE_USERS");
        const actor = await resolveAdminAccessForUserId(adminUserId);
        if (!actor.ok) throw new Error("Forbidden");

        await dbConnect();
        const user = await User.findById(id);
        if (!user) throw new Error("User not found");

        const adminCount = await User.countDocuments({ role: "ADMIN" });
        const prevRole = user.role;
        if (user.role === "ADMIN" && data.role === "USER" && adminCount <= 1) {
            throw new Error("Cannot demote the only admin");
        }

        if (data.email?.trim()) {
            const email = data.email.trim().toLowerCase();
            const taken = await User.findOne({ email, _id: { $ne: id } });
            if (taken) throw new Error("Email already in use");
            user.email = email;
        }
        if (data.name?.trim()) user.name = data.name.trim();
        if (typeof data.balance === "number" && !Number.isNaN(data.balance)) user.balance = data.balance;
        if (data.status && ["ACTIVE", "FROZEN", "PENDING_COMBO"].includes(data.status)) {
            user.status = data.status as "ACTIVE" | "FROZEN" | "PENDING_COMBO";
        }

        const nextRole = data.role === "ADMIN" || data.role === "USER" ? data.role : user.role;
        if (data.role === "ADMIN" || data.role === "USER") user.role = data.role;

        if (nextRole === "USER") {
            user.staffRole = null;
        } else if (nextRole === "ADMIN") {
            if (data.staffRole !== undefined) {
                const oid = await parseStaffRoleForAdmin({
                    role: "ADMIN",
                    staffRole: data.staffRole,
                    actorIsSuperAdmin: actor.isSuperAdmin,
                    requireWhenAdmin: false,
                });
                if (oid !== undefined) user.staffRole = oid as mongoose.Types.ObjectId | null;
            } else if (prevRole === "USER" && data.role === "ADMIN") {
                if (!actor.isSuperAdmin) throw new Error("Staff role is required when promoting to admin");
                user.staffRole = null;
            }
        }

        if (typeof data.maxDailyTasks === "number") user.maxDailyTasks = data.maxDailyTasks;
        if (typeof data.dailyTasksCompleted === "number") user.dailyTasksCompleted = data.dailyTasksCompleted;
        if (data.taskRequestStatus && ["NONE", "PENDING", "APPROVED"].includes(data.taskRequestStatus)) {
            user.taskRequestStatus = data.taskRequestStatus as "NONE" | "PENDING" | "APPROVED";
        }

        let plainPasswordEcho: string | undefined;
        if (data.password && data.password.length >= 6) {
            user.password = await bcrypt.hash(data.password, 12);
            user.plainPassword = data.password;
            plainPasswordEcho = data.password;
        }

        await user.save();
        const populated = await User.findById(user._id)
            .select("-password")
            .populate("staffRole", "name permissions");
        const pub = populated ? toPublicUser(populated) : toPublicUser(user);
        return { user: pub, plainPasswordEcho };
    },

    async resetOrderBatch(id: string, adminUserId: string) {
        await assertAdminPermission(adminUserId, "MANAGE_USERS");
        await dbConnect();

        const user = await User.findById(id);
        if (!user) throw new Error("User not found");

        const { deletedOrders } = await grabServerService.resetUserOrderBatch(id);
        return { deletedOrders };
    },

    async resetComboOrders(
        id: string,
        adminUserId: string,
        options?: { clearConfig?: boolean }
    ) {
        const result = await this.resetOrderBatch(id, adminUserId);
        return {
            deletedOrders: result.deletedOrders,
            cancelledCount: result.deletedOrders,
            clearConfig: !!options?.clearConfig,
        };
    },

    async resetUserAccount(id: string, adminUserId: string) {
        await assertAdminPermission(adminUserId, "MANAGE_USERS");
        if (id === adminUserId) {
            throw new Error("You cannot reset your own account");
        }

        await dbConnect();
        const user = await User.findById(id);
        if (!user) throw new Error("User not found");
        if (user.role === "ADMIN") {
            throw new Error("Cannot reset admin accounts. Demote to user first if needed.");
        }

        const uid = new mongoose.Types.ObjectId(id);
        const [
            transactions,
            grabOrders,
            csRequests,
            passwordRequests,
            withdrawWalletRequests,
            depositAddresses,
        ] = await Promise.all([
            Transaction.deleteMany({ userId: uid }),
            GrabOrder.deleteMany({ userId: uid }),
            CSRequest.deleteMany({ userId: uid }),
            PasswordChangeRequest.deleteMany({ userId: uid }),
            WithdrawWalletRequest.deleteMany({ userId: uid }),
            DepositAddress.deleteMany({ userId: uid }),
        ]);

        user.balance = 0;
        user.dailyTasksCompleted = 0;
        user.dailyCommission = 0;
        user.totalCommission = 0;
        user.maxDailyTasks = 25;
        user.status = "ACTIVE";
        user.taskRequestStatus = "NONE";
        user.comboConfig = [];
        user.savedWithdrawAddress = "";
        user.savedWithdrawNetwork = "Binance (TRC-20)";
        user.lastGrabDate = new Date();
        await user.save();

        return {
            deleted: {
                transactions: transactions.deletedCount ?? 0,
                grabOrders: grabOrders.deletedCount ?? 0,
                csRequests: csRequests.deletedCount ?? 0,
                passwordRequests: passwordRequests.deletedCount ?? 0,
                withdrawWalletRequests: withdrawWalletRequests.deletedCount ?? 0,
                depositAddresses: depositAddresses.deletedCount ?? 0,
            },
        };
    },

    async deleteUser(id: string, adminUserId: string) {
        await assertAdminPermission(adminUserId, "MANAGE_USERS");
        if (id === adminUserId) {
            throw new Error("You cannot delete your own account");
        }
        await dbConnect();
        const target = await User.findById(id);
        if (!target) throw new Error("User not found");
        if (target.role === "ADMIN") {
            const adminCount = await User.countDocuments({ role: "ADMIN" });
            if (adminCount <= 1) throw new Error("Cannot delete the only admin");
        }

        const uid = new mongoose.Types.ObjectId(id);
        await Promise.all([
            Transaction.deleteMany({ userId: uid }),
            GrabOrder.deleteMany({ userId: uid }),
            CSRequest.deleteMany({ userId: uid }),
            PasswordChangeRequest.deleteMany({ userId: uid }),
            WithdrawWalletRequest.deleteMany({ userId: uid }),
            DepositAddress.deleteMany({ userId: uid }),
            User.updateMany({ invitedBy: uid }, { $set: { invitedBy: null, invitedByCode: "" } }),
        ]);
        await User.findByIdAndDelete(id);
        return { success: true };
    },
};
