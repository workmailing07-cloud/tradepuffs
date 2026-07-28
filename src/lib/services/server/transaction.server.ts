import User from "@/lib/models/User";
import Transaction from "@/lib/models/Transaction";
import dbConnect from "@/lib/mongodb";
import { assertAdminPermission } from "@/lib/services/server/admin-auth.server";

/** Credit an approved deposit toward the user's pending combo order(s). */
async function applyDepositToPendingCombo(userId: string, depositAmount: number) {
    const GrabOrder = (await import("@/lib/models/GrabOrder")).default;
    const pendingCombos = await GrabOrder.find({
        userId,
        status: "PENDING",
        isCombo: true,
        isAdminAuthorized: false,
    }).sort({ createdAt: 1 });

    let remaining = Math.max(0, Number(depositAmount) || 0);
    for (const order of pendingCombos) {
        if (remaining <= 1e-6) break;

        const required = Math.max(0, Number(order.requiredDeposit) || 0);
        if (required <= 0) {
            order.isAdminAuthorized = true;
            await order.save();
            continue;
        }

        const current = Math.max(0, Number(order.depositedAmount) || 0);
        const room = Math.max(0, required - current);
        const applied = Math.min(room, remaining);
        if (applied <= 0) continue;

        order.depositedAmount = parseFloat((current + applied).toFixed(2));
        if (order.depositedAmount >= required - 1e-6) {
            order.isAdminAuthorized = true;
        }
        await order.save();
        remaining = parseFloat((remaining - applied).toFixed(2));
    }
}

export const transactionServerService = {
    async processTransaction(
        userId: string,
        type: "DEPOSIT" | "WITHDRAW",
        amount: number,
        depositAddress?: string,
        withdrawAddress?: string,
        withdrawNetwork?: string,
    ) {
        await dbConnect();

        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        const isAdmin = user.role === "ADMIN";

        // [1] Block regular-user withdrawals until daily tasks are complete
        if (!isAdmin && type === "WITHDRAW") {
            const completed = user.dailyTasksCompleted ?? 0;
            const total = user.maxDailyTasks ?? 25;
            if (completed < total) {
                throw new Error(
                    `You must complete all ${total} daily orders before withdrawing. ` +
                    `Currently ${completed}/${total} done.`
                );
            }
        }

        if (isAdmin) {
            if (type === "WITHDRAW" && user.balance < amount) throw new Error("Insufficient balance");
            const balanceChange = type === "DEPOSIT" ? amount : -amount;
            user.balance += balanceChange;
            await user.save();
            const transaction = await Transaction.create({ userId, type, amount, status: "COMPLETED" });
            if (type === "DEPOSIT") {
                await applyDepositToPendingCombo(user._id.toString(), amount);
            }
            return { balance: user.balance, transaction };
        }

        if (type === "WITHDRAW") {
            const balanceNum = Number(user.balance) || 0;
            if (amount > balanceNum) {
                throw new Error("Withdrawal amount cannot exceed your available balance.");
            }
            const pendingWithdraw = await Transaction.findOne({
                userId,
                type: "WITHDRAW",
                status: "PENDING",
            }).select("_id");
            if (pendingWithdraw) {
                throw new Error(
                    "Your withdrawal request has been received and is being processed. " +
                        "Please wait until it is completed before submitting another."
                );
            }
        }

        if (type === "DEPOSIT") {
            const pendingDeposit = await Transaction.findOne({
                userId,
                type: "DEPOSIT",
                status: "PENDING",
            }).select("_id");
            if (pendingDeposit) {
                throw new Error(
                    "Your deposit request has been received and is being processed. " +
                        "Please wait until it is completed before submitting another."
                );
            }
        }

        // Regular users: create a PENDING request
        let finalWithdrawAddress = withdrawAddress || "";
        let finalWithdrawNetwork = withdrawNetwork || "";
        if (type === "WITHDRAW") {
            const savedAddr = String(user.savedWithdrawAddress || "").trim();
            if (!savedAddr) {
                throw new Error("Set your withdrawal wallet in Wallet Management before withdrawing.");
            }
            finalWithdrawAddress = savedAddr;
            finalWithdrawNetwork = String(user.savedWithdrawNetwork || "").trim() || "Binance (TRC-20)";
        }

        const transaction = await Transaction.create({
            userId,
            type,
            amount,
            status: "PENDING",
            depositAddress: depositAddress || "",
            withdrawAddress: finalWithdrawAddress,
            withdrawNetwork: finalWithdrawNetwork,
        });
        return { balance: user.balance, transaction };
    },

    async getRecentTransactions(userId: string, limit = 10) {
        await dbConnect();
        return await Transaction.find({ userId }).sort({ createdAt: -1 }).limit(limit);
    },

    async getPendingTransactions() {
        await dbConnect();
        return await Transaction.find({ status: "PENDING" })
            .populate("userId", "name email balance")
            .sort({ createdAt: -1 });
    },

    async updateTransactionStatus(transactionId: string, status: "COMPLETED" | "REJECTED", adminUserId: string) {
        await dbConnect();

        await assertAdminPermission(adminUserId, "MANAGE_TRANSACTIONS");

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) throw new Error("Transaction not found");
        if (transaction.status !== "PENDING") throw new Error("Transaction already processed");

        if (status === "COMPLETED") {
            const user = await User.findById(transaction.userId);
            if (!user) throw new Error("User not found for transaction");

            if (transaction.type === "WITHDRAW") {
                if (user.balance < transaction.amount) {
                    transaction.status = "FAILED";
                    await transaction.save();
                    throw new Error("User has insufficient balance for this withdrawal");
                }
                user.balance -= transaction.amount;
            } else if (transaction.type === "DEPOSIT") {
                user.balance += transaction.amount;
            }
            await user.save();

            if (transaction.type === "DEPOSIT") {
                await applyDepositToPendingCombo(user._id.toString(), transaction.amount);
            }
        }

        transaction.status = status;
        await transaction.save();
        return transaction;
    },
};
