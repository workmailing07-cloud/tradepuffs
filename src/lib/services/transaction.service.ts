import apiClient from "@/lib/api-client";

export const transactionService = {
    async createTransaction(
        type: "DEPOSIT" | "WITHDRAW",
        amount: number,
        depositAddress?: string,
        withdrawAddress?: string,
        withdrawNetwork?: string,
    ) {
        const response = await apiClient.post("/transactions", {
            type, amount, depositAddress, withdrawAddress, withdrawNetwork,
        });
        return response.data;
    },

    async getTransactions() {
        const response = await apiClient.get("/transactions");
        return response.data;
    },

    async getCurrentUser() {
        const response = await apiClient.get("/user/me");
        return response.data;
    },

    async getUnreadNotifications() {
        const response = await apiClient.get("/user/notifications");
        return response.data;
    },

    async markNotificationAsRead(id: string) {
        const response = await apiClient.post("/user/notifications", { id });
        return response.data;
    },
};
