import apiClient from "@/lib/api-client";

export const grabService = {
    async grabOrder() {
        const res = await apiClient.post("/grab", {});
        return res.data;
    },

    async completeOrder(orderId: string) {
        const res = await apiClient.post("/grab/complete", { orderId });
        return res.data;
    },

    async requestCS(data: { orderId?: string; message: string; type?: string }) {
        const res = await apiClient.post("/cs/request", data);
        return res.data;
    },

    async getRecords() {
        const res = await apiClient.get("/grab/records");
        return res.data;
    },

    async cancelOrder(orderId: string) {
        const res = await apiClient.post("/grab/cancel", { orderId });
        return res.data;
    },

    async getSpinnerProducts() {
        const res = await apiClient.get("/grab/products");
        return res.data;
    },
};
