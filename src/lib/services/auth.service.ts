import apiClient from "@/lib/api-client";

export const authService = {
    async signup(data: any) {
        const response = await apiClient.post("/auth/signup", data);
        return response.data;
    },
};
