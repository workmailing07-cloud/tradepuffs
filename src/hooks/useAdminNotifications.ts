"use client";

import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/lib/services/admin.service";
import { useTrading } from "./useTrading";

export function useAdminNotifications() {
    const { role } = useTrading();

    const notificationsQuery = useQuery({
        queryKey: ["admin-notifications"],
        queryFn: adminService.getNotificationCount,
        enabled: role === "ADMIN",
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    return {
        count: notificationsQuery.data?.count || 0,
        transactions: notificationsQuery.data?.transactions || 0,
        csRequests: notificationsQuery.data?.csRequests || 0,
        taskRequests: notificationsQuery.data?.taskRequests || 0,
        passwordRequests: notificationsQuery.data?.passwordRequests || 0,
        isLoading: notificationsQuery.isLoading
    };
}
