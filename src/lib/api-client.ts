import axios from "axios";

const apiClient = axios.create({
    baseURL: "/api",
    headers: {
        "Content-Type": "application/json",
    },
});



// Interceptor for global error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.error || "An unexpected error occurred";
        return Promise.reject(new Error(message));
    }
);

export default apiClient;

