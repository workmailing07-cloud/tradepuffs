import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import Transaction from "@/lib/models/Transaction";
import CSRequest from "@/lib/models/CSRequest";
import PasswordChangeRequest from "@/lib/models/PasswordChangeRequest";
import WithdrawWalletRequest from "@/lib/models/WithdrawWalletRequest";
import {
    resolveAdminAccessForUserId,
    adminHasPermission,
} from "@/lib/services/server/admin-auth.server";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await dbConnect();
        const userId = (session.user as any).id;
        const baseUser = await User.findById(userId);
        if (!baseUser || baseUser.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const access = await resolveAdminAccessForUserId(userId);
        if (!access.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        let transactions = 0;
        let csRequests = 0;
        let taskRequests = 0;
        let passwordRequests = 0;
        let withdrawWalletRequests = 0;

        const jobs: Promise<void>[] = [];
        if (adminHasPermission(access, "MANAGE_TRANSACTIONS")) {
            jobs.push(
                Transaction.countDocuments({ status: "PENDING" }).then((n) => {
                    transactions = n;
                })
            );
        }
        if (adminHasPermission(access, "MANAGE_CS")) {
            jobs.push(CSRequest.countDocuments({ status: "OPEN" }).then((n) => { csRequests = n; }));
        }
        if (adminHasPermission(access, "MANAGE_TASK_REQUESTS")) {
            jobs.push(
                User.countDocuments({ taskRequestStatus: "PENDING" }).then((n) => {
                    taskRequests = n;
                })
            );
        }
        if (adminHasPermission(access, "MANAGE_PASSWORD_REQUESTS")) {
            jobs.push(
                PasswordChangeRequest.countDocuments({ status: "PENDING" }).then((n) => {
                    passwordRequests = n;
                })
            );
        }
        if (adminHasPermission(access, "MANAGE_WITHDRAW_WALLET_REQUESTS")) {
            jobs.push(
                WithdrawWalletRequest.countDocuments({ status: "PENDING" }).then((n) => {
                    withdrawWalletRequests = n;
                })
            );
        }

        await Promise.all(jobs);

        return NextResponse.json({
            count: transactions + csRequests + taskRequests + passwordRequests + withdrawWalletRequests,
            transactions,
            csRequests,
            taskRequests,
            passwordRequests,
            withdrawWalletRequests,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
