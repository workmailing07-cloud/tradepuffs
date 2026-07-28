"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminService } from "@/lib/services/admin.service";

export function useAdmin(options?: { enabledPermissions?: string[]; isSuperAdmin?: boolean }) {
    const queryClient = useQueryClient();
    const hasPerm = (id: string) => Boolean(options?.isSuperAdmin || options?.enabledPermissions?.includes(id));
    const [invitationSearch, setInvitationSearch] = useState("");
    const [invitationRoleFilter, setInvitationRoleFilter] = useState<"ALL" | "ADMIN" | "USER">("ALL");
    const [selectedInviterId, setSelectedInviterId] = useState("");
    const [historySearch, setHistorySearch] = useState("");
    const [historyTypeFilter, setHistoryTypeFilter] = useState<"ALL" | "DEPOSIT" | "WITHDRAW" | "REGISTERED">("ALL");
    const passwordRequestsQuery = useQuery({
        queryKey: ["admin-password-requests"],
        queryFn: adminService.getPasswordRequests,
        enabled: hasPerm("MANAGE_PASSWORD_REQUESTS"),
    });

    const withdrawWalletRequestsQuery = useQuery({
        queryKey: ["admin-withdraw-wallet-requests"],
        queryFn: adminService.getWithdrawWalletRequests,
        enabled: hasPerm("MANAGE_WITHDRAW_WALLET_REQUESTS"),
    });

    const pendingTransactionsQuery = useQuery({
        queryKey: ["admin-pending-transactions"],
        queryFn: adminService.getPendingTransactions,
        enabled: hasPerm("MANAGE_TRANSACTIONS"),
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: "COMPLETED" | "REJECTED" }) =>
            adminService.updateTransactionStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-pending-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
            queryClient.invalidateQueries({ queryKey: ["admin-history"] });
        },
    });

    const csRequestsQuery = useQuery({
        queryKey: ["admin-cs-requests"],
        queryFn: adminService.getCSRequests,
        enabled: hasPerm("MANAGE_CS"),
    });

    const updateCSMutation = useMutation({
        mutationFn: ({ id, status, adminRemark }: { id: string; status: "RESOLVED" | "REJECTED"; adminRemark?: string }) =>
            adminService.updateCSStatus(id, { status, adminRemark }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-cs-requests"] });
            queryClient.invalidateQueries({ queryKey: ["admin-pending-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
        },
    });

    const taskRequestsQuery = useQuery({
        queryKey: ["admin-task-requests"],
        queryFn: adminService.getTaskRequests,
        enabled: hasPerm("MANAGE_TASK_REQUESTS"),
    });

    const taskSettingsQuery = useQuery({
        queryKey: ["admin-task-settings"],
        queryFn: adminService.getTaskSettings,
        enabled: hasPerm("MANAGE_TASK_REQUESTS"),
    });

    const approveTasksMutation = useMutation({
        mutationFn: ({ userId, comboConfig }: { userId: string, comboConfig: any[] }) =>
            adminService.approveTasks(userId, comboConfig),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-task-requests"] });
            queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
        },
    });

    const cancelTaskRequestMutation = useMutation({
        mutationFn: ({ userId }: { userId: string }) => adminService.cancelTaskRequest(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-task-requests"] });
            queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
        },
    });

    const updateTaskSettingsMutation = useMutation({
        mutationFn: ({ requestCooldownMinutes }: { requestCooldownMinutes: number }) =>
            adminService.updateTaskSettings({ requestCooldownMinutes }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-task-settings"] });
        },
    });

    const depositAddressesQuery = useQuery({
        queryKey: ["admin-deposit-addresses"],
        queryFn: async () => {
            const res = await fetch("/api/admin/deposit-address");
            if (!res.ok) throw new Error("Failed to load addresses");
            return res.json();
        },
        enabled: hasPerm("MANAGE_DEPOSIT_ADDRESSES"),
    });

    const invitationsQuery = useQuery({
        queryKey: ["admin-invitations", invitationSearch, invitationRoleFilter, selectedInviterId],
        queryFn: () =>
            adminService.getInvitationsFiltered({
                search: invitationSearch || undefined,
                role: invitationRoleFilter === "ALL" ? undefined : invitationRoleFilter,
                inviterId: selectedInviterId || undefined,
            }),
        enabled: hasPerm("MANAGE_INVITATIONS"),
    });

    const historyQuery = useQuery({
        queryKey: ["admin-history", historyTypeFilter, historySearch],
        queryFn: () =>
            adminService.getAdminHistory({
                type: historyTypeFilter,
                search: historySearch || undefined,
            }),
        enabled: hasPerm("VIEW_HISTORY"),
        staleTime: 0,
        refetchInterval: 10000,
    });

    const passwordRequestMutation = useMutation({
        mutationFn: ({ id, status, adminRemark }: { id: string; status: "APPROVED" | "REJECTED"; adminRemark?: string }) =>
            adminService.updatePasswordRequest(id, status, adminRemark),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-password-requests"] });
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
        },
    });

    const withdrawWalletRequestMutation = useMutation({
        mutationFn: ({ id, status, adminRemark }: { id: string; status: "APPROVED" | "REJECTED"; adminRemark?: string }) =>
            adminService.updateWithdrawWalletRequest(id, status, adminRemark),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-withdraw-wallet-requests"] });
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
        },
    });

    const isRefreshing =
        pendingTransactionsQuery.isFetching ||
        csRequestsQuery.isFetching ||
        taskRequestsQuery.isFetching ||
        taskSettingsQuery.isFetching ||
        invitationsQuery.isFetching ||
        historyQuery.isFetching ||
        passwordRequestsQuery.isFetching ||
        withdrawWalletRequestsQuery.isFetching ||
        depositAddressesQuery.isFetching;

    return {
        pendingTransactions: pendingTransactionsQuery.data || [],
        csRequests: csRequestsQuery.data || [],
        taskRequests: taskRequestsQuery.data || [],
        taskSettings: taskSettingsQuery.data || { requestCooldownMinutes: 20 },
        depositAddresses: depositAddressesQuery.data || [],
        invitations: invitationsQuery.data || [],
        adminHistory: historyQuery.data || [],
        passwordRequests: passwordRequestsQuery.data || [],
        withdrawWalletRequests: withdrawWalletRequestsQuery.data || [],
        invitationSearch,
        invitationRoleFilter,
        selectedInviterId,
        historySearch,
        historyTypeFilter,
        setInvitationSearch,
        setInvitationRoleFilter,
        setSelectedInviterId,
        setHistorySearch,
        setHistoryTypeFilter,
        isLoadingAddresses: depositAddressesQuery.isLoading,
        isLoading:
            pendingTransactionsQuery.isLoading ||
            csRequestsQuery.isLoading ||
            taskRequestsQuery.isLoading ||
            taskSettingsQuery.isLoading ||
            invitationsQuery.isLoading ||
            historyQuery.isLoading ||
            passwordRequestsQuery.isLoading ||
            withdrawWalletRequestsQuery.isLoading,
        error:
            taskRequestsQuery.error ||
            taskSettingsQuery.error ||
            csRequestsQuery.error ||
            pendingTransactionsQuery.error ||
            invitationsQuery.error ||
            historyQuery.error ||
            passwordRequestsQuery.error ||
            withdrawWalletRequestsQuery.error,
        isUpdating:
            updateStatusMutation.isPending ||
            updateCSMutation.isPending ||
            approveTasksMutation.isPending ||
            cancelTaskRequestMutation.isPending ||
            updateTaskSettingsMutation.isPending ||
            passwordRequestMutation.isPending ||
            withdrawWalletRequestMutation.isPending,
        updateStatus: updateStatusMutation.mutateAsync,
        updateCSStatus: updateCSMutation.mutateAsync,
        approveTasks: approveTasksMutation.mutateAsync,
        cancelTaskRequest: cancelTaskRequestMutation.mutateAsync,
        updateTaskSettings: updateTaskSettingsMutation.mutateAsync,
        updatePasswordRequest: passwordRequestMutation.mutateAsync,
        updateWithdrawWalletRequest: withdrawWalletRequestMutation.mutateAsync,
        refreshAddresses: () => depositAddressesQuery.refetch(),
        isRefreshing,
        refresh: async () => {
            await Promise.all([
                pendingTransactionsQuery.refetch(),
                csRequestsQuery.refetch(),
                taskRequestsQuery.refetch(),
                taskSettingsQuery.refetch(),
                depositAddressesQuery.refetch(),
                invitationsQuery.refetch(),
                historyQuery.refetch(),
                passwordRequestsQuery.refetch(),
                withdrawWalletRequestsQuery.refetch(),
                queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
                queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
                queryClient.invalidateQueries({ queryKey: ["admin-roles"] }),
            ]);
        },
    };
}
