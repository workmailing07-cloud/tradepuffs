"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/lib/services/admin.service";
import { ArrowLeft, Copy, UserPlus2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminDirectInvitesPage() {
    const searchParams = useSearchParams();
    const inviterId = searchParams.get("inviterId") || "";
    const inviterName = searchParams.get("name") || "User";

    const invitesQuery = useQuery({
        queryKey: ["admin-direct-invites-page", inviterId],
        queryFn: () => adminService.getInvitationsFiltered({ inviterId }),
        enabled: !!inviterId,
    });

    const handleCopy = async (value?: string) => {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(value);
            toast.success(`Copied: ${value}`);
        } catch {
            toast.error("Could not copy");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Direct Invites</h1>
                    <p className="text-sm text-secondary mt-1">
                        Users invited directly by <span className="font-bold text-foreground">{inviterName}</span>.
                    </p>
                </div>
                <Link href="/dashboard/admin" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/10 hover:bg-secondary/20 font-bold text-sm transition-colors">
                    <ArrowLeft size={16} />
                    Back to Admin
                </Link>
            </div>

            {!inviterId ? (
                <div className="p-8 rounded-3xl border border-secondary/10 bg-secondary/5 text-center text-secondary">
                    Missing inviter id. Open this page from the Invitations table.
                </div>
            ) : invitesQuery.isLoading ? (
                <div className="p-8 rounded-3xl border border-secondary/10 bg-secondary/5">
                    <div className="h-10 rounded-xl bg-secondary/10 animate-pulse" />
                </div>
            ) : (invitesQuery.data || []).length === 0 ? (
                <div className="p-8 rounded-3xl border border-secondary/10 bg-secondary/5 text-center space-y-2">
                    <UserPlus2 size={30} className="mx-auto opacity-30" />
                    <p className="font-bold">No direct invites found</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-3xl border border-secondary/10">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-secondary/10 bg-secondary/5">
                                <th className="p-4 font-bold text-secondary text-xs uppercase tracking-wider">User</th>
                                <th className="p-4 font-bold text-secondary text-xs uppercase tracking-wider">Invitation Code</th>
                                <th className="p-4 font-bold text-secondary text-xs uppercase tracking-wider">Role</th>
                                <th className="p-4 font-bold text-secondary text-xs uppercase tracking-wider">Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(invitesQuery.data || []).map((u: any) => (
                                <tr key={u._id} className="border-b border-secondary/5 hover:bg-secondary/5 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold">{u.name}</div>
                                        <div className="text-xs text-secondary">{u.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="inline-flex items-center gap-2">
                                            <span className="font-mono text-xs bg-secondary/10 px-2 py-1 rounded-lg">{u.invitationCode || "—"}</span>
                                            {!!u.invitationCode && (
                                                <button onClick={() => handleCopy(u.invitationCode)} className="p-1.5 rounded-lg bg-secondary/10 hover:bg-secondary/20 cursor-pointer" title="Copy code">
                                                    <Copy size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500">{u.role}</span>
                                    </td>
                                    <td className="p-4 text-xs text-secondary">
                                        {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
