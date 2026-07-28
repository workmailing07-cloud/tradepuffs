"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { adminService } from "@/lib/services/admin.service";
import { ADMIN_PERMISSION_META } from "@/lib/permissions";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, X } from "lucide-react";

type RoleInput = { name: string; description: string; permissions: string[] };

export function RoleManagement() {
    const qc = useQueryClient();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);

    const rolesQuery = useQuery({
        queryKey: ["admin-roles"],
        queryFn: adminService.getRoles,
    });

    const saveMutation = useMutation({
        mutationFn: (payload: { id?: string; body: RoleInput }) =>
            payload.id ? adminService.updateRole(payload.id, payload.body) : adminService.createRole(payload.body),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["admin-roles"] });
            await qc.invalidateQueries({ queryKey: ["admin-users"] });
            toast.success("Role saved");
            setOpen(false);
            setEditing(null);
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const deleteMutation = useMutation({
        mutationFn: adminService.deleteRole,
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["admin-roles"] });
            await qc.invalidateQueries({ queryKey: ["admin-users"] });
            toast.success("Role deleted");
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const roles = useMemo(() => rolesQuery.data || [], [rolesQuery.data]);

    return (
        <div className="space-y-4 p-4 sm:p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black">Role & Permission Management</h3>
                    <p className="text-xs text-secondary mt-1">Create admin roles and choose what each role can manage.</p>
                </div>
                <button
                    onClick={() => {
                        setEditing(null);
                        setOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-bold text-sm"
                >
                    <Plus size={16} /> Create role
                </button>
            </div>

            {rolesQuery.isLoading ? (
                <div className="text-sm text-secondary py-8">Loading roles...</div>
            ) : roles.length === 0 ? (
                <div className="text-sm text-secondary py-8">No roles yet.</div>
            ) : (
                <div className="overflow-x-auto border border-secondary/10 rounded-2xl">
                    <table className="w-full text-left">
                        <thead className="bg-secondary/5">
                            <tr>
                                <th className="p-3 text-xs font-black text-secondary">Role</th>
                                <th className="p-3 text-xs font-black text-secondary">Permissions</th>
                                <th className="p-3 text-xs font-black text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map((r: any) => (
                                <tr key={r._id} className="border-t border-secondary/10">
                                    <td className="p-3">
                                        <div className="font-bold">{r.name}</div>
                                        <div className="text-xs text-secondary">{r.description || "—"}</div>
                                    </td>
                                    <td className="p-3 text-xs">{(r.permissions || []).join(", ") || "—"}</td>
                                    <td className="p-3 text-right space-x-2">
                                        <button
                                            onClick={() => {
                                                setEditing(r);
                                                setOpen(true);
                                            }}
                                            className="p-2 rounded-lg bg-secondary/10"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => deleteMutation.mutate(r._id)}
                                            className="p-2 rounded-lg bg-red-500/10 text-red-500"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {open ? (
                <RoleFormModal
                    initial={editing}
                    loading={saveMutation.isPending}
                    onClose={() => {
                        setOpen(false);
                        setEditing(null);
                    }}
                    onSubmit={(body) => saveMutation.mutate({ id: editing?._id, body })}
                />
            ) : null}
        </div>
    );
}

function RoleFormModal({
    initial,
    onClose,
    onSubmit,
    loading,
}: {
    initial?: any;
    onClose: () => void;
    onSubmit: (body: RoleInput) => void;
    loading: boolean;
}) {
    const [name, setName] = useState(String(initial?.name || ""));
    const [description, setDescription] = useState(String(initial?.description || ""));
    const [permissions, setPermissions] = useState<string[]>(Array.isArray(initial?.permissions) ? initial.permissions : []);

    const toggle = (id: string) => {
        setPermissions((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    return (
        <div className="fixed inset-0 z-125 flex items-end sm:items-center justify-center bg-black/50 p-4">
            <div className="bg-background border border-secondary/15 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-5 border-b border-secondary/10 flex items-center justify-between">
                    <h4 className="font-black">{initial?._id ? "Edit role" : "Create role"}</h4>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary/10">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Role name"
                        className="w-full px-3 py-2.5 rounded-xl border border-secondary/15 bg-secondary/5"
                    />
                    <input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description (optional)"
                        className="w-full px-3 py-2.5 rounded-xl border border-secondary/15 bg-secondary/5"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ADMIN_PERMISSION_META.map((p) => (
                            <label key={p.id} className="flex items-start gap-2 p-2 rounded-lg border border-secondary/10">
                                <input
                                    type="checkbox"
                                    checked={permissions.includes(p.id)}
                                    onChange={() => toggle(p.id)}
                                    className="mt-1"
                                />
                                <span className="text-xs">
                                    <span className="font-bold block">{p.id}</span>
                                    <span className="text-secondary">{p.label}</span>
                                </span>
                            </label>
                        ))}
                    </div>
                    <button
                        disabled={loading || !name.trim()}
                        onClick={() => onSubmit({ name: name.trim(), description: description.trim(), permissions })}
                        className="w-full py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Save role"}
                    </button>
                </div>
            </div>
        </div>
    );
}
