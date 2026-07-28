import User from "@/lib/models/User";
import GrabOrder from "@/lib/models/GrabOrder";
import Product from "@/lib/models/Product";
import dbConnect from "@/lib/mongodb";
import { findComboSetting, normalizeComboConfig } from "@/lib/combo-config";
import { getOrderCommission, getComboOrdersAmount, getComboRemainingDeposit } from "@/lib/grab-display";

// Progressive commission rate: starts at 1%, grows ~4% per order (order 1→25 yields 1%→2.6%)
function getCommissionRate(orderIndex: number): number {
    return 0.01 * Math.pow(1.04, orderIndex - 1);
}

export const grabServerService = {
    async getRandomProductData(count: number = 1) {
        const products = await Product.find({ isActive: true }).select("name image").lean();
        if (!products.length) {
            throw new Error("No active products configured. Ask admin to add products.");
        }
        const selected = [];
        for (let i = 0; i < count; i++) {
            const item = products[Math.floor(Math.random() * products.length)] as any;
            selected.push({
                name: item.name,
                image: item.image,
            });
        }
        return selected;
    },

    async grabNewOrder(userId: string) {
        await dbConnect();
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        // Sanity checks — ensure numeric fields are valid, never reset progress
        let needsSave = false;
        if (typeof user.dailyTasksCompleted !== "number" || isNaN(user.dailyTasksCompleted)) { user.dailyTasksCompleted = 0; needsSave = true; }
        if (typeof user.dailyCommission !== "number" || isNaN(user.dailyCommission)) { user.dailyCommission = 0; needsSave = true; }
        if (typeof user.totalCommission !== "number" || isNaN(user.totalCommission)) { user.totalCommission = 0; needsSave = true; }
        if (!user.maxDailyTasks) { user.maxDailyTasks = 25; needsSave = true; }
        if (!user.taskRequestStatus) { user.taskRequestStatus = "NONE"; needsSave = true; }
        if (needsSave) await user.save();

        // ── Guards ──
        if (user.taskRequestStatus !== "APPROVED") {
            throw new Error(
                user.taskRequestStatus === "PENDING"
                    ? "Your task request is pending approval."
                    : "You need to request daily tasks first."
            );
        }

        if (user.dailyTasksCompleted >= user.maxDailyTasks) {
            throw new Error("Daily task limit reached (25/25)");
        }

        if (user.status === "PENDING_COMBO") {
            throw new Error("Please complete your pending combo order first");
        }

        // Return any existing pending order
        const pendingOrder = await GrabOrder.findOne({ userId, status: "PENDING" });
        if (pendingOrder) return { order: pendingOrder, message: "Continue with your pending order" };

        // ── Build new order ──
        const nextGrabIndex = user.dailyTasksCompleted + 1;
        const comboConfig = normalizeComboConfig(user.comboConfig);
        const comboSetting = findComboSetting(comboConfig, nextGrabIndex);
        const isCombo = !!comboSetting;
        const adminRequiredDeposit = isCombo
            ? Math.max(0, parseFloat((Number(comboSetting.requiredDeposit) || 0).toFixed(2)))
            : 0;

        const walletBalance = Math.max(0, Number(user.balance) || 0);
        const finalPrice = isCombo
            ? parseFloat((walletBalance + adminRequiredDeposit).toFixed(2))
            : Math.max(parseFloat((walletBalance * 0.8).toFixed(2)), 0.01);

        const commission = getOrderCommission(finalPrice, isCombo);
        const productCount = isCombo ? 4 : 1;
        const baseProducts = await this.getRandomProductData(productCount);
        const productName = isCombo ? baseProducts[0].name + " & others" : baseProducts[0].name;

        const items = baseProducts.map((prod) => ({
            name: prod.name,
            image: prod.image,
            price: parseFloat((finalPrice / productCount).toFixed(2)),
            quantity: 1,
        }));

        const newOrder = await GrabOrder.create({
            userId,
            productName,
            items,
            price: finalPrice,
            commission,
            isCombo,
            requiredDeposit: adminRequiredDeposit,
            depositedAmount: 0,
            isAdminAuthorized: adminRequiredDeposit <= 0,
            status: "PENDING",
        });

        if (isCombo) {
            user.status = "PENDING_COMBO";
            await user.save();
        }

        return { order: newOrder, isCombo };
    },

    async completeOrder(orderId: string, userId: string) {
        await dbConnect();
        const order = await GrabOrder.findById(orderId);
        if (!order || order.userId.toString() !== userId) throw new Error("Order not found");
        if (order.status !== "PENDING") throw new Error("Order is already processed");

        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        if (order.isCombo && !order.isAdminAuthorized) {
            const required = Math.max(0, Number(order.requiredDeposit) || 0);
            const deposited = Math.max(0, Number(order.depositedAmount) || 0);
            if (required > 0 && deposited < required - 1e-6) {
                const short = (required - deposited).toFixed(2);
                throw new Error(`Deposit ${short} USDT more to submit this combo order.`);
            }
        }

        if (typeof user.dailyTasksCompleted !== "number") user.dailyTasksCompleted = 0;
        if (typeof user.dailyCommission !== "number") user.dailyCommission = 0;
        if (typeof user.totalCommission !== "number") user.totalCommission = 0;

        const walletBalance = Math.max(0, Number(user.balance) || 0);
        const orderAmount = order.isCombo
            ? getComboOrdersAmount(
                walletBalance,
                getComboRemainingDeposit(
                    Number(order.requiredDeposit) || 0,
                    Number(order.depositedAmount) || 0
                )
            )
            : Math.max(0, Number(order.price) || 0);
        const payoutCommission = getOrderCommission(orderAmount, !!order.isCombo);
        order.commission = payoutCommission;

        user.balance = parseFloat((user.balance + payoutCommission).toFixed(4));
        user.totalCommission = parseFloat((user.totalCommission + payoutCommission).toFixed(4));
        user.dailyCommission = parseFloat((user.dailyCommission + payoutCommission).toFixed(4));
        user.dailyTasksCompleted += 1;
        user.status = "ACTIVE";
        if (user.dailyTasksCompleted >= (user.maxDailyTasks || 25)) {
            user.taskRequestStatus = "NONE";
            user.lastGrabDate = new Date();
        }
        await user.save();

        order.status = "COMPLETED";
        await order.save();

        return {
            order,
            newBalance: user.balance,
            dailyTasksCompleted: user.dailyTasksCompleted,
            dailyCommission: user.dailyCommission,
        };
    },

    async cancelOrder(orderId: string, userId: string) {
        await dbConnect();
        const order = await GrabOrder.findById(orderId);
        if (!order || order.userId.toString() !== userId) throw new Error("Order not found");
        if (order.status !== "PENDING") throw new Error("Only pending orders can be cancelled");

        order.status = "CANCELLED";
        await order.save();

        const user = await User.findById(userId);
        if (user && user.status === "PENDING_COMBO") {
            const stillPending = await GrabOrder.exists({
                userId,
                status: "PENDING",
                isCombo: true,
            });
            if (!stillPending) {
                user.status = "ACTIVE";
                await user.save();
            }
        }

        return { success: true };
    },

    async resetUserOrderBatch(userId: string) {
        await dbConnect();
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        const result = await GrabOrder.deleteMany({ userId });

        user.dailyTasksCompleted = 0;
        user.dailyCommission = 0;
        user.status = "ACTIVE";
        user.taskRequestStatus = "NONE";
        user.comboConfig = [];
        await user.save();

        return { deletedOrders: result.deletedCount ?? 0 };
    },

    /** @deprecated Use resetUserOrderBatch — cancels pending combos only. */
    async resetUserComboOrders(userId: string) {
        return this.resetUserOrderBatch(userId);
    },

};
