import apiClient from "@/lib/api-client";

export const adminService = {
    async getPendingTransactions() {
        const response = await apiClient.get("/admin/transactions");
        return response.data;
    },

    async updateTransactionStatus(id: string, status: "COMPLETED" | "REJECTED") {
        const response = await apiClient.put(`/admin/transactions/${id}`, { status });
        return response.data;
    },

    async getCSRequests() {
        const response = await apiClient.get("/admin/cs");
        return response.data;
    },

    async updateCSStatus(id: string, data: { status: "RESOLVED" | "REJECTED"; adminRemark?: string }) {
        const response = await apiClient.patch("/admin/cs", { id, ...data });
        return response.data;
    },

    async getNotificationCount() {
        const response = await apiClient.get("/admin/notifications");
        return response.data;
    },

    async getTaskRequests() {
        const response = await apiClient.get("/admin/tasks/requests");
        return response.data;
    },

    async approveTasks(userId: string, comboConfig: any[]) {
        const response = await apiClient.post("/admin/tasks/approve", { userId, comboConfig });
        return response.data;
    },

    async getTaskSettings() {
        const response = await apiClient.get("/admin/tasks/settings");
        return response.data;
    },

    async updateTaskSettings(body: { requestCooldownMinutes: number }) {
        const response = await apiClient.patch("/admin/tasks/settings", body);
        return response.data;
    },

    async cancelTaskRequest(userId: string) {
        const response = await apiClient.patch("/admin/tasks/requests", { userId });
        return response.data;
    },

    async getInvitations() {
        const response = await apiClient.get("/admin/invitations");
        return response.data;
    },

    async getInvitationsFiltered(params?: { search?: string; role?: string; inviterId?: string }) {
        const response = await apiClient.get("/admin/invitations", { params });
        return response.data;
    },

    async getAdminHistory(params?: { type?: string; search?: string }) {
        const response = await apiClient.get("/admin/history", { params });
        return response.data;
    },

    async getUsers(params?: { search?: string; role?: string; limit?: number }) {
        const response = await apiClient.get("/admin/users", { params });
        return response.data;
    },

    async getUserById(id: string) {
        const response = await apiClient.get(`/admin/users/${id}`);
        return response.data;
    },

    async createAdminUser(body: Record<string, unknown>) {
        const response = await apiClient.post("/admin/users", body);
        return response.data;
    },

    async updateAdminUser(id: string, body: Record<string, unknown>) {
        const response = await apiClient.patch(`/admin/users/${id}`, body);
        return response.data;
    },

    async resetUserComboOrders(id: string, clearConfig = false) {
        void clearConfig;
        const response = await apiClient.post(`/admin/users/${id}/actions`, { action: "reset-orders" });
        return response.data;
    },

    async resetUserOrderBatch(id: string) {
        const response = await apiClient.post(`/admin/users/${id}/actions`, { action: "reset-orders" });
        return response.data;
    },

    async resetUserAccount(id: string) {
        const response = await apiClient.post(`/admin/users/${id}/actions`, { action: "reset-account" });
        return response.data;
    },

    async deleteAdminUser(id: string) {
        const response = await apiClient.delete(`/admin/users/${id}`);
        return response.data;
    },

    async getProducts(params?: { search?: string }) {
        const response = await apiClient.get("/admin/products", { params });
        return response.data;
    },

    async createProduct(body: { name: string; image: string; isActive?: boolean }) {
        const response = await apiClient.post("/admin/products", body);
        return response.data;
    },

    async updateProduct(id: string, body: Record<string, unknown>) {
        const response = await apiClient.patch(`/admin/products/${id}`, body);
        return response.data;
    },

    async deleteProduct(id: string) {
        const response = await apiClient.delete(`/admin/products/${id}`);
        return response.data;
    },

    async getPasswordRequests() {
        const response = await apiClient.get("/admin/password-requests");
        return response.data;
    },

    async updatePasswordRequest(id: string, status: "APPROVED" | "REJECTED", adminRemark?: string) {
        const response = await apiClient.patch("/admin/password-requests", { id, status, adminRemark });
        return response.data;
    },

    async getWithdrawWalletRequests() {
        const response = await apiClient.get("/admin/withdraw-wallet-requests");
        return response.data;
    },

    async updateWithdrawWalletRequest(id: string, status: "APPROVED" | "REJECTED", adminRemark?: string) {
        const response = await apiClient.patch("/admin/withdraw-wallet-requests", { id, status, adminRemark });
        return response.data;
    },

    async getRoles() {
        const response = await apiClient.get("/admin/roles");
        return response.data;
    },

    async createRole(body: { name: string; description?: string; permissions: string[] }) {
        const response = await apiClient.post("/admin/roles", body);
        return response.data;
    },

    async updateRole(id: string, body: { name?: string; description?: string; permissions?: string[] }) {
        const response = await apiClient.patch(`/admin/roles/${id}`, body);
        return response.data;
    },

    async deleteRole(id: string) {
        const response = await apiClient.delete(`/admin/roles/${id}`);
        return response.data;
    },

    async getSupportContact() {
        const response = await apiClient.get("/admin/support/contact");
        return response.data;
    },

    async updateSupportContact(body: { telegramUsername: string }) {
        const response = await apiClient.patch("/admin/support/contact", body);
        return response.data;
    },

    async deleteSupportContact() {
        const response = await apiClient.delete("/admin/support/contact");
        return response.data;
    },
};
