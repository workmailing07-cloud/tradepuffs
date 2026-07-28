"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionService } from "@/lib/services/transaction.service";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";
import { useSession } from "next-auth/react";

export function NotificationManager() {
    const { status } = useSession();
    const queryClient = useQueryClient();

    const enabled = status === "authenticated";

    // Polling Query for unread notifications
    const { data: notifications } = useQuery({
        queryKey: ["user-notifications"],
        queryFn: transactionService.getUnreadNotifications,
        enabled,
        refetchInterval: 10000, // Poll every 10 seconds
    });

    const markAsReadMutation = useMutation({
        mutationFn: transactionService.markNotificationAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
            queryClient.invalidateQueries({ queryKey: ["user-me"] }); // Refresh user state (status might have changed)
        }
    });

    useEffect(() => {
        if (notifications && notifications.length > 0) {
            notifications.forEach((notif: any) => {
                const isResolved = notif.status === "RESOLVED";
                const isCombo = notif.type === "COMBO_UNLOCK";

                toast(isResolved ? "CS Request Resolved!" : "CS Request Update", {
                    icon: isResolved ? <CheckCircle className="text-green-500" size={18} /> : <XCircle className="text-red-500" size={18} />,
                    description: isResolved 
                        ? (isCombo ? "💎 Exclusive Combo has been UNLOCKED. You can now complete the order!" : "Your request has been fulfilled.")
                        : "Your request was rejected. Please contact support or check your balance.",
                    duration: 10000,
                    onAutoClose: () => markAsReadMutation.mutate(notif._id),
                    onDismiss: () => markAsReadMutation.mutate(notif._id),
                });
            });
        }
    }, [notifications]);

    return null; // This component handles side effects only
}
