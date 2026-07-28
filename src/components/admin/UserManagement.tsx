"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/lib/services/admin.service";
import { useEffect, useState } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    Search,
    Eye,
    EyeOff,
    Copy,
    X,
    KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function UserManagement() {
    const qc = useQueryClient();
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<"" | "USER" | "ADMIN">("");
    const [detailId, setDetailId] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [hashVisible, setHashVisible] = useState(false);

    const usersQuery = useQuery({
        queryKey: ["admin-users", search, roleFilter],
        queryFn: () =>
            adminService.getUsers({
                search: search || undefined,
                role: roleFilter || undefined,
            }),
    });
    const rolesQuery = useQuery({
        queryKey: ["admin-roles"],
        queryFn: adminService.getRoles,
    });

    useEffect(() => {
        if (editId || showCreate) {
            void qc.refetchQueries({ queryKey: ["admin-roles"] });
        }
    }, [editId, showCreate, qc]);

    const detailQuery = useQuery({
        queryKey: ["admin-user", detailId],
        queryFn: () => adminService.getUserById(detailId!),
        enabled: !!detailId,
    });

    const editQuery = useQuery({
        queryKey: ["admin-user-edit", editId],
        queryFn: () => adminService.getUserById(editId!),
        enabled: !!editId,
    });

    const createMutation = useMutation({
        mutationFn: adminService.createAdminUser,
        onSuccess: async (data: any) => {
            toast.success(`User created. Temporary password shown below — copy now.`);
            await qc.invalidateQueries({ queryKey: ["admin-users"] });
            setShowCreate(false);
            if (data?.plainPasswordEcho) {
                toast.message(`Password: ${data.plainPasswordEcho}`, { duration: 20000 });
            }
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
            adminService.updateAdminUser(id, body),
        onSuccess: async (data: any, vars) => {
            await qc.invalidateQueries({ queryKey: ["admin-users"] });
            await qc.invalidateQueries({ queryKey: ["admin-user", vars.id] });
            await qc.invalidateQueries({ queryKey: ["admin-user-edit", vars.id] });
            setEditId(null);
            toast.success("User updated");
            if (data?.plainPasswordEcho) {
                toast.message(`New password (copy now): ${data.plainPasswordEcho}`, { duration: 30000 });
            }
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const deleteMutation = useMutation({
        mutationFn: adminService.deleteAdminUser,
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["admin-users"] });
            setDeleteConfirmId(null);
            setDetailId(null);
            toast.success("User deleted");
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const resetOrderBatchMutation = useMutation({
        mutationFn: (userId: string) => adminService.resetUserOrderBatch(userId),
        onSuccess: async (data: any, userId) => {
            await qc.invalidateQueries({ queryKey: ["admin-users"] });
            await qc.invalidateQueries({ queryKey: ["admin-user", userId] });
            toast.success(data?.message || "Orders reset — user can request 25 again");
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const resetAccountMutation = useMutation({
        mutationFn: (userId: string) => adminService.resetUserAccount(userId),
        onSuccess: async (data: any, userId) => {
            await qc.invalidateQueries({ queryKey: ["admin-users"] });
            await qc.invalidateQueries({ queryKey: ["admin-user", userId] });
            toast.success(data?.message || "User account reset");
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const copyText = async (label: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied`);
        } catch {
            toast.error("Copy failed");
        }
    };

    return (
        <div className="space-y-5 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name, email, invitation code..."
                            className="w-full pl-9 pr-3 py-2.5 bg-secondary/5 border border-secondary/10 rounded-xl outline-none focus:border-primary/40 text-sm"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as any)}
                        className="px-3 py-2.5 bg-secondary/5 border border-secondary/10 rounded-xl outline-none text-sm sm:w-40"
                    >
                        <option value="">All roles</option>
                        <option value="USER">Users</option>
                        <option value="ADMIN">Admins</option>
                    </select>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 cursor-pointer"
                >
                    <Plus size={18} /> Create user
                </button>
            </div>

            {usersQuery.isLoading ? (
                <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-14 rounded-xl bg-secondary/10 animate-pulse" />
                    ))}
                </div>
            ) : (usersQuery.data || []).length === 0 ? (
                <div className="text-center py-16 text-secondary font-medium">No users match your filters.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-secondary/10 bg-secondary/5">
                                <th className="p-3 text-xs font-bold text-secondary uppercase tracking-wider">User</th>
                                <th className="p-3 text-xs font-bold text-secondary uppercase tracking-wider">Role</th>
                                <th className="p-3 text-xs font-bold text-secondary uppercase tracking-wider">Permission role</th>
                                <th className="p-3 text-xs font-bold text-secondary uppercase tracking-wider">Balance</th>
                                <th className="p-3 text-xs font-bold text-secondary uppercase tracking-wider">Status</th>
                                <th className="p-3 text-xs font-bold text-secondary uppercase tracking-wider">Invite code</th>
                                <th className="p-3 text-xs font-bold text-secondary uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(usersQuery.data || []).map((u: any) => (
                                <tr key={u._id} className="border-b border-secondary/5 hover:bg-secondary/5">
                                    <td className="p-3">
                                        <div className="font-bold text-sm">{u.name}</div>
                                        <div className="text-xs text-secondary">{u.email}</div>
                                    </td>
                                    <td className="p-3">
                                        <span
                                            className={cn(
                                                "text-[10px] font-black px-2 py-1 rounded-full",
                                                u.role === "ADMIN" ? "bg-amber-500/15 text-amber-600" : "bg-blue-500/15 text-blue-600"
                                            )}
                                        >
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-3 text-xs">
                                        {u.role === "ADMIN" ? (
                                            u.staffRole?.name ? (
                                                <span className="px-2 py-1 rounded-full bg-violet-500/10 text-violet-500 font-bold">
                                                    {u.staffRole.name}
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold">
                                                    SUPER ADMIN
                                                </span>
                                            )
                                        ) : (
                                            <span className="text-secondary">—</span>
                                        )}
                                    </td>
                                    <td className="p-3 font-mono text-sm">{Number(u.balance || 0).toFixed(4)}</td>
                                    <td className="p-3 text-xs font-bold">{u.status}</td>
                                    <td className="p-3 font-mono text-xs">{u.invitationCode || "—"}</td>
                                    <td className="p-3 text-right space-x-1">
                                        <button
                                            onClick={() => {
                                                setDetailId(u._id);
                                                setHashVisible(false);
                                            }}
                                            className="p-2 rounded-lg bg-secondary/10 hover:bg-secondary/20 cursor-pointer"
                                            title="View details"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => setEditId(u._id)}
                                            className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                                            title="Edit"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirmId(u._id)}
                                            className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 cursor-pointer"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create */}
            {showCreate && (
                <UserFormModal
                    title="Create user"
                    subtitle="Invitation code links the new account to an inviter (optional)."
                    submitLabel={createMutation.isPending ? "Creating…" : "Create"}
                    loading={createMutation.isPending}
                    mode="create"
                    onClose={() => setShowCreate(false)}
                    onSubmit={(values) =>
                        createMutation.mutate({
                            name: values.name,
                            email: values.email,
                            password: values.password,
                            role: values.role,
                            staffRole: values.role === "ADMIN" ? values.staffRole || null : null,
                            balance: values.balance !== "" ? Number(values.balance) : undefined,
                            status: values.status,
                            inviterInvitationCode: values.inviterInvitationCode || undefined,
                        })
                    }
                    roles={rolesQuery.data || []}
                />
            )}

            {/* Detail */}
            {detailId && (
                <div className="fixed inset-0 z-120 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-background border border-secondary/15 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-secondary/10 flex items-center justify-between">
                            <h3 className="text-lg font-black">User details</h3>
                            <button onClick={() => setDetailId(null)} className="p-2 rounded-xl hover:bg-secondary/10 cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {detailQuery.isLoading ? (
                                <div className="h-32 bg-secondary/10 rounded-xl animate-pulse" />
                            ) : detailQuery.data ? (
                                <>
                                    <DetailRow label="Name" value={detailQuery.data.name} />
                                    <DetailRow label="Email" value={detailQuery.data.email} />
                                    <DetailRow label="Role" value={detailQuery.data.role} />
                                    <DetailRow
                                        label="Permission role"
                                        value={
                                            detailQuery.data.role === "ADMIN"
                                                ? detailQuery.data.staffRole?.name || "SUPER ADMIN"
                                                : "—"
                                        }
                                    />
                                    <DetailRow label="Balance" value={Number(detailQuery.data.balance || 0).toFixed(4)} mono />
                                    <DetailRow label="Status" value={detailQuery.data.status} />
                                    <DetailRow label="Invitation code" value={detailQuery.data.invitationCode || "—"} mono />
                                    <DetailRow label="Invited by code" value={detailQuery.data.invitedByCode || "—"} mono />
                                    <DetailRow label="Plain password" value={detailQuery.data.storedPlainPassword || "—"} mono />

                                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                                        <div className="flex items-center gap-2 font-bold text-sm">
                                            <KeyRound size={16} /> Password (login credential)
                                        </div>
                                        <p className="text-xs text-secondary leading-relaxed">
                                            Plain password is stored and shown below. Copy either plain password or hash for admin records.
                                        </p>
                                        <div className="flex items-start gap-2">
                                            <code className={cn(
                                                "flex-1 text-[10px] font-mono p-3 rounded-xl bg-black/5 dark:bg-white/10 break-all",
                                                !hashVisible && "blur-sm select-none"
                                            )}>
                                                {detailQuery.data.storedPasswordHash || "—"}
                                            </code>
                                            <button
                                                type="button"
                                                className="p-2 shrink-0 rounded-xl bg-secondary/15 hover:bg-secondary/25 cursor-pointer"
                                                title={hashVisible ? "Hide hash" : "Reveal hash"}
                                                onClick={() => setHashVisible((v) => !v)}
                                            >
                                                {hashVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                            <button
                                                type="button"
                                                className="p-2 shrink-0 rounded-xl bg-secondary/15 hover:bg-secondary/25 cursor-pointer"
                                                title="Copy hash"
                                                onClick={() => copyText("Hash", String(detailQuery.data.storedPasswordHash || ""))}
                                            >
                                                <Copy size={18} />
                                            </button>
                                            <button
                                                type="button"
                                                className="p-2 shrink-0 rounded-xl bg-secondary/15 hover:bg-secondary/25 cursor-pointer"
                                                title="Copy plain password"
                                                onClick={() => copyText("Password", String(detailQuery.data.storedPlainPassword || ""))}
                                            >
                                                <KeyRound size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                                        <p className="text-sm font-black text-amber-700 dark:text-amber-400">Reset orders</p>
                                        <p className="text-xs text-secondary leading-relaxed">
                                            Deletes all grab &amp; combo orders (pending, completed, cancelled) and clears task progress.
                                            User returns to <strong>Request 25 Orders</strong>. Balance and deposit history are kept.
                                        </p>
                                        <button
                                            type="button"
                                            className="w-full py-3 rounded-2xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-400 cursor-pointer disabled:opacity-50"
                                            disabled={resetOrderBatchMutation.isPending}
                                            onClick={() => {
                                                if (!detailQuery.data?._id) return;
                                                const ok = window.confirm(
                                                    "Remove all orders for this user?\n\n" +
                                                        "• All regular + combo orders deleted\n" +
                                                        "• Progress reset to 0/25\n" +
                                                        "• User must request 25 orders again\n\n" +
                                                        "Balance and transaction history will NOT be changed."
                                                );
                                                if (!ok) return;
                                                resetOrderBatchMutation.mutate(String(detailQuery.data._id));
                                            }}
                                        >
                                            {resetOrderBatchMutation.isPending ? "Resetting orders…" : "Reset orders & request batch"}
                                        </button>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-3">
                                        <p className="text-sm font-black text-red-600 dark:text-red-400">Full account reset</p>
                                        <p className="text-xs text-secondary leading-relaxed">
                                            Everything above, plus wipes balance, deposits, withdrawals, CS requests, and wallet settings.
                                            Keeps login credentials (name, email, password) and invitation code.
                                        </p>
                                        <button
                                            type="button"
                                            className="w-full py-3 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 cursor-pointer disabled:opacity-50"
                                            disabled={resetAccountMutation.isPending || detailQuery.data?.role === "ADMIN"}
                                            onClick={() => {
                                                if (!detailQuery.data?._id) return;
                                                if (detailQuery.data.role === "ADMIN") {
                                                    toast.error("Admin accounts cannot be fully reset here");
                                                    return;
                                                }
                                                const ok = window.confirm(
                                                    "Reset this user to a completely fresh state?\n\n" +
                                                        "• All orders removed\n" +
                                                        "• Balance set to 0\n" +
                                                        "• Deposit & withdrawal history deleted\n" +
                                                        "• User must request 25 orders again\n\n" +
                                                        "Login credentials will be kept."
                                                );
                                                if (!ok) return;
                                                resetAccountMutation.mutate(String(detailQuery.data._id));
                                            }}
                                        >
                                            {resetAccountMutation.isPending ? "Resetting account…" : "Full account reset"}
                                        </button>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            className="flex-1 py-3 rounded-2xl border border-secondary/15 font-bold text-sm hover:bg-secondary/10 cursor-pointer"
                                            onClick={() => {
                                                const uid = String(detailQuery.data._id);
                                                setDetailId(null);
                                                setEditId(uid);
                                            }}
                                        >
                                            Edit user
                                        </button>
                                        <button
                                            className="flex-1 py-3 rounded-2xl bg-red-500/10 text-red-500 font-bold text-sm hover:bg-red-500/20 cursor-pointer"
                                            onClick={() => setDeleteConfirmId(String(detailQuery.data._id))}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit */}
            {editId && editQuery.data && (
                <UserFormModal
                    key={editId}
                    title="Edit user"
                    subtitle='Leave password empty to keep the current credential. Saving a new password echoes it once in a toast.'
                    submitLabel={updateMutation.isPending ? "Saving…" : "Save changes"}
                    loading={updateMutation.isPending}
                    mode="edit"
                    initial={{
                        name: editQuery.data.name,
                        email: editQuery.data.email,
                        password: "",
                        role: editQuery.data.role,
                        staffRole:
                            editQuery.data.staffRole?._id != null
                                ? String(editQuery.data.staffRole._id)
                                : "",
                        balance: String(editQuery.data.balance ?? 0),
                        status: editQuery.data.status || "ACTIVE",
                        inviterInvitationCode: "",
                        maxDailyTasks: String(editQuery.data.maxDailyTasks ?? 25),
                        dailyTasksCompleted: String(editQuery.data.dailyTasksCompleted ?? 0),
                        taskRequestStatus: editQuery.data.taskRequestStatus || "NONE",
                    }}
                    onClose={() => setEditId(null)}
                    onSubmit={(values) => {
                        const body: Record<string, unknown> = {
                            name: values.name.trim(),
                            email: values.email.trim(),
                            role: values.role,
                            staffRole: values.role === "ADMIN" ? values.staffRole || null : null,
                            balance: Number(values.balance),
                            status: values.status,
                            maxDailyTasks: Number(values.maxDailyTasks),
                            dailyTasksCompleted: Number(values.dailyTasksCompleted),
                            taskRequestStatus: values.taskRequestStatus,
                        };
                        if (values.password.trim().length >= 6) {
                            body.password = values.password.trim();
                        }
                        updateMutation.mutate({ id: editId, body });
                    }}
                    roles={rolesQuery.data || []}
                />
            )}
            {editId && editQuery.isLoading ? (
                <div className="fixed inset-0 z-119 flex items-center justify-center bg-black/30">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : null}

            {/* Delete */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-130 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-background rounded-3xl border border-secondary/15 p-6 max-w-md w-full space-y-4">
                        <h4 className="font-black text-lg">Delete user?</h4>
                        <p className="text-sm text-secondary">
                            This permanently removes the user and their transactions, grab orders, and CS requests. This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 py-3 rounded-xl border border-secondary/15 font-bold cursor-pointer hover:bg-secondary/10"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={deleteMutation.isPending}
                                onClick={() => deleteMutation.mutate(deleteConfirmId)}
                                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold cursor-pointer disabled:opacity-50"
                            >
                                {deleteMutation.isPending ? "Deleting…" : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function DetailRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
    return (
        <div className="flex justify-between gap-4 text-sm">
            <span className="text-secondary font-bold">{label}</span>
            <span className={cn("text-right font-medium", mono && "font-mono text-xs")}>{value}</span>
        </div>
    );
}

type FormValues = {
    name: string;
    email: string;
    password: string;
    role: "USER" | "ADMIN";
    staffRole: string;
    balance: string;
    status: string;
    inviterInvitationCode: string;
    maxDailyTasks: string;
    dailyTasksCompleted: string;
    taskRequestStatus: string;
};

function combinedAccountRoleValue(role: string, staffRole: string) {
    if (role === "USER") return "USER";
    if (role === "ADMIN") {
        if (staffRole) return `ADMIN:${staffRole}`;
        return "ADMIN";
    }
    return "USER";
}

function parseAccountRoleSelect(raw: string): { role: "USER" | "ADMIN"; staffRole: string } {
    if (raw === "USER") return { role: "USER", staffRole: "" };
    if (raw === "ADMIN") return { role: "ADMIN", staffRole: "" };
    if (raw.startsWith("ADMIN:")) return { role: "ADMIN", staffRole: raw.slice(6) };
    return { role: "USER", staffRole: "" };
}

function UserFormModal({
    title,
    subtitle,
    mode,
    initial,
    onClose,
    onSubmit,
    submitLabel,
    loading,
    roles,
}: {
    title: string;
    subtitle: string;
    mode: "create" | "edit";
    initial?: Partial<FormValues>;
    onClose: () => void;
    onSubmit: (v: FormValues) => void;
    submitLabel: string;
    loading: boolean;
    roles: any[];
}) {
    const [values, setValues] = useState<FormValues>({
        name: initial?.name ?? "",
        email: initial?.email ?? "",
        password: initial?.password ?? "",
        role: (initial?.role as any) ?? "USER",
        staffRole: initial?.staffRole ?? "",
        balance: initial?.balance ?? "0",
        status: initial?.status ?? "ACTIVE",
        inviterInvitationCode: initial?.inviterInvitationCode ?? "",
        maxDailyTasks: initial?.maxDailyTasks ?? "25",
        dailyTasksCompleted: initial?.dailyTasksCompleted ?? "0",
        taskRequestStatus: initial?.taskRequestStatus ?? "NONE",
    });

    const set = (key: keyof FormValues, v: string) => setValues((p) => ({ ...p, [key]: v }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!values.name.trim() || !values.email.trim()) {
            toast.error("Name and email required");
            return;
        }
        if (mode === "create" && values.password.trim().length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        onSubmit(values);
    };

    return (
        <div className="fixed inset-0 z-125 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <form
                onSubmit={handleSubmit}
                className="bg-background border border-secondary/15 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col"
            >
                <div className="p-6 border-b border-secondary/10 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-lg font-black">{title}</h3>
                        <p className="text-xs text-secondary mt-1 leading-relaxed max-w-md">{subtitle}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-secondary/10 cursor-pointer">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-3 overflow-y-auto">
                    <Field label="Name" value={values.name} onChange={(v) => set("name", v)} />
                    <Field label="Email" type="email" value={values.email} onChange={(v) => set("email", v)} />
                    <Field
                        label={mode === "create" ? "Password" : "New password (optional)"}
                        type="password"
                        value={values.password}
                        onChange={(v) => set("password", v)}
                        placeholder={mode === "edit" ? "Leave empty to keep unchanged" : ""}
                    />
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-secondary">Role</label>
                        <select
                            value={combinedAccountRoleValue(values.role, values.staffRole)}
                            onChange={(e) => {
                                const parsed = parseAccountRoleSelect(e.target.value);
                                setValues((p) => ({
                                    ...p,
                                    role: parsed.role,
                                    staffRole: parsed.staffRole,
                                }));
                            }}
                            className="mt-1 w-full px-3 py-2.5 rounded-xl border border-secondary/15 bg-secondary/5 text-sm outline-none focus:border-primary/40"
                        >
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin (full access)</option>
                            {roles.map((r: any) => (
                                <option key={String(r._id)} value={`ADMIN:${String(r._id)}`}>
                                    Admin — {r.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Field label="Balance (USDT)" value={values.balance} onChange={(v) => set("balance", v)} type="number" step="any" />
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-secondary">Account status</label>
                        <select
                            value={values.status}
                            onChange={(e) => set("status", e.target.value)}
                            className="mt-1 w-full px-3 py-2.5 rounded-xl border border-secondary/15 bg-secondary/5 text-sm outline-none focus:border-primary/40"
                        >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="FROZEN">FROZEN</option>
                            <option value="PENDING_COMBO">PENDING_COMBO</option>
                        </select>
                    </div>
                    {mode === "edit" ? (
                        <>
                            <Field label="Max daily tasks" value={values.maxDailyTasks} onChange={(v) => set("maxDailyTasks", v)} type="number" />
                            <Field label="Daily tasks completed" value={values.dailyTasksCompleted} onChange={(v) => set("dailyTasksCompleted", v)} type="number" />
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-wider text-secondary">Task request status</label>
                                <select
                                    value={values.taskRequestStatus}
                                    onChange={(e) => set("taskRequestStatus", e.target.value)}
                                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-secondary/15 bg-secondary/5 text-sm outline-none focus:border-primary/40"
                                >
                                    <option value="NONE">NONE</option>
                                    <option value="PENDING">PENDING</option>
                                    <option value="APPROVED">APPROVED</option>
                                </select>
                            </div>
                        </>
                    ) : (
                        <Field
                            label="Inviter invitation code (optional)"
                            value={values.inviterInvitationCode}
                            onChange={(v) => set("inviterInvitationCode", v.toUpperCase())}
                            placeholder="Link new user under an inviter"
                        />
                    )}
                </div>
                <div className="p-6 pt-0 flex gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 rounded-2xl border border-secondary/15 font-bold hover:bg-secondary/10 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold disabled:opacity-50 cursor-pointer"
                    >
                        {submitLabel}
                    </button>
                </div>
            </form>
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    step,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    placeholder?: string;
    step?: string;
}) {
    return (
        <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-secondary">{label}</label>
            <input
                type={type}
                step={step}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-secondary/15 bg-secondary/5 text-sm outline-none focus:border-primary/40"
            />
        </div>
    );
}
