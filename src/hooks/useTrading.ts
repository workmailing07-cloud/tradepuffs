"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { transactionService } from "@/lib/services/transaction.service";

export function useTrading() {
    const queryClient = useQueryClient();
    const { data: session } = useSession();

    // Fetch User Data — poll while deposits/withdrawals/combos are in flight
    const userQuery = useQuery({
        queryKey: ["user-me"],
        queryFn: transactionService.getCurrentUser,
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        refetchInterval: (query) => {
            const data = query.state.data as {
                hasPendingDeposit?: boolean;
                hasPendingWithdraw?: boolean;
                status?: string;
            } | undefined;
            if (!data) return false;
            if (data.hasPendingDeposit || data.hasPendingWithdraw || data.status === "PENDING_COMBO") {
                return 5000;
            }
            return 15000;
        },
    });

    // Fetch Transactions with caching
    const transactionsQuery = useQuery({
        queryKey: ["transactions"],
        queryFn: transactionService.getTransactions,
    });

    // Mutation for creating transactions
    const transactionMutation = useMutation({
        mutationFn: ({ type, amount, depositAddress, withdrawAddress, withdrawNetwork }: {
            type: "DEPOSIT" | "WITHDRAW"; amount: number;
            depositAddress?: string; withdrawAddress?: string; withdrawNetwork?: string;
        }) => transactionService.createTransaction(type, amount, depositAddress, withdrawAddress, withdrawNetwork),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-me"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["grab-records"] });
        },
    });

    return {
        user: userQuery.data,
        balance: userQuery.data?.balance || 0,
        dailyTasksCompleted: userQuery.data?.dailyTasksCompleted || 0,
        maxDailyTasks: userQuery.data?.maxDailyTasks || 25,
        dailyCommission: userQuery.data?.dailyCommission || 0,
        totalCommission: userQuery.data?.totalCommission || 0,
        status: userQuery.data?.status || "ACTIVE",
        taskRequestStatus: userQuery.data?.taskRequestStatus || "NONE",
        taskRequestCooldownMinutes: Number((userQuery.data as { taskRequestCooldownMinutes?: number } | undefined)?.taskRequestCooldownMinutes || 20),
        nextTaskRequestAt: ((userQuery.data as { nextTaskRequestAt?: string | null } | undefined)?.nextTaskRequestAt || null) as string | null,
        canRequestTasks: Boolean((userQuery.data as { canRequestTasks?: boolean } | undefined)?.canRequestTasks ?? true),
        role: (() => {
            const apiRole = userQuery.data?.role || "USER";
            const sessionRole = (session?.user as { role?: string } | undefined)?.role;
            return apiRole === "ADMIN" || sessionRole === "ADMIN" ? "ADMIN" : apiRole;
        })(),
        isSuperAdmin: Boolean(userQuery.data?.isSuperAdmin),
        adminPermissions: (userQuery.data?.adminPermissions || []) as string[],
        hasPendingWithdraw: Boolean((userQuery.data as { hasPendingWithdraw?: boolean } | undefined)?.hasPendingWithdraw),
        hasPendingDeposit: Boolean((userQuery.data as { hasPendingDeposit?: boolean } | undefined)?.hasPendingDeposit),
        savedWithdrawAddress: String((userQuery.data as { savedWithdrawAddress?: string } | undefined)?.savedWithdrawAddress || "").trim(),
        savedWithdrawNetwork: String((userQuery.data as { savedWithdrawNetwork?: string } | undefined)?.savedWithdrawNetwork || "Binance (TRC-20)").trim() || "Binance (TRC-20)",
        hasPendingWithdrawWalletChange: Boolean(
            (userQuery.data as { hasPendingWithdrawWalletChange?: boolean } | undefined)?.hasPendingWithdrawWalletChange
        ),
        transactions: transactionsQuery.data || [],
        loading: userQuery.isLoading || transactionsQuery.isLoading,
        isProcessing: transactionMutation.isPending,
        createTransaction: transactionMutation.mutateAsync,
        refresh: useCallback(() => {
            void queryClient.invalidateQueries({ queryKey: ["user-me"] });
            void queryClient.invalidateQueries({ queryKey: ["transactions"] });
        }, [queryClient]),
    };
}
