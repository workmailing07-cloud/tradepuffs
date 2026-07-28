"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { grabService } from "@/lib/services/grab.service";
import { toast } from "sonner";

export function useGrabOrder() {
    const queryClient = useQueryClient();

    const grabMutation = useMutation({
        mutationFn: grabService.grabOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["grab-records"] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to grab order");
        },
    });

    const completeMutation = useMutation({
        mutationFn: (orderId: string) => grabService.completeOrder(orderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-me"] });
            queryClient.invalidateQueries({ queryKey: ["grab-records"] });
            toast.success("Order completed successfully!");
        },
        onError: (error: any) => {
            const msg = error.message || "Failed to complete order";
            toast.error(msg, {
                duration: 5000,
                description: msg.includes("Combo") 
                    ? "Click 'Request Instant Unlock' to bypass this barrier immediately." 
                    : undefined
            });
        },
    });

    const cancelMutation = useMutation({
        mutationFn: (orderId: string) => grabService.cancelOrder(orderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["grab-records"] });
            queryClient.invalidateQueries({ queryKey: ["user-me"] });
            toast.success("Order cancelled");
        },
        onError: (error: any) => toast.error(error.message || "Failed to cancel order"),
    });

    const csMutation = useMutation({
        mutationFn: grabService.requestCS,
        onSuccess: () => {
            toast.success("Request sent to Customer Service");
        },
    });

    const { data: records, isLoading: isLoadingRecords, refetch: refetchRecords } = useQuery({
        queryKey: ["grab-records"],
        queryFn: grabService.getRecords,
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchInterval: (query) => {
            const list = query.state.data as Array<{ status?: string; isCombo?: boolean; isAdminAuthorized?: boolean }> | undefined;
            const hasOpenCombo = list?.some(
                (r) => r.status === "PENDING" && r.isCombo && !r.isAdminAuthorized
            );
            return hasOpenCombo ? 5000 : false;
        },
    });

    return {
        grabOrder: grabMutation.mutateAsync,
        completeOrder: completeMutation.mutateAsync,
        cancelOrder: cancelMutation.mutateAsync,
        requestCS: csMutation.mutateAsync,
        isGrabbing: grabMutation.isPending,
        isCompleting: completeMutation.isPending,
        isCancelling: cancelMutation.isPending,
        isRequesting: csMutation.isPending,
        currentOrder: grabMutation.data?.order,
        isCombo: grabMutation.data?.isCombo,
        records: records || [],
        isLoadingRecords,
        refetchRecords
    };
}
