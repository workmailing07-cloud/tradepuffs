"use client";

import { useMemo } from "react";
import { useTrading } from "@/hooks/useTrading";
import { toast } from "sonner";
import { Copy, Share2, Users, Link as LinkIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function InvitePage() {
    const { user } = useTrading();
    const invitationCode = (user as any)?.invitationCode || "------";
    const invitesQuery = useQuery({
        queryKey: ["user-invites"],
        queryFn: async () => {
            const res = await fetch("/api/user/invites");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to load invites");
            return data;
        },
    });

    const inviteMessage = useMemo(() => {
        return `Join The Trade with my invitation code: ${invitationCode}`;
    }, [invitationCode]);

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(invitationCode);
            toast.success("Invitation code copied");
        } catch {
            toast.error("Failed to copy invitation code");
        }
    };

    const handleCopyMessage = async () => {
        try {
            await navigator.clipboard.writeText(inviteMessage);
            toast.success("Invite message copied");
        } catch {
            toast.error("Failed to copy invite message");
        }
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: "Join The Trade",
                    text: inviteMessage,
                });
                return;
            }
            await navigator.clipboard.writeText(inviteMessage);
            toast.success("Share not supported, message copied instead");
        } catch {
            toast.error("Share cancelled");
        }
    };

    return (
        <div className="max-w-lg mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div>
                <h1 className="text-3xl font-black tracking-tight">Invite Friends</h1>
                <p className="text-secondary text-sm mt-1">
                    Share your invitation code and grow your team.
                </p>
            </div>

            <div className="bg-secondary/5 border border-secondary/10 rounded-3xl p-6 space-y-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-500 flex items-center justify-center">
                        <Users size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-secondary font-bold uppercase tracking-wider">Your Invitation Code</p>
                        <p className="font-mono text-2xl font-black tracking-widest">{invitationCode}</p>
                    </div>
                </div>

                <button
                    onClick={handleCopyCode}
                    className="w-full py-3 rounded-2xl bg-primary text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                >
                    <Copy size={16} />
                    Copy Code
                </button>
            </div>

            <div className="bg-secondary/5 border border-secondary/10 rounded-3xl p-6 space-y-4">
                <p className="text-xs text-secondary font-bold uppercase tracking-wider">Invite Message</p>
                <div className="text-sm bg-background border border-secondary/10 rounded-2xl p-4 wrap-break-word">
                    {inviteMessage}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={handleCopyMessage}
                        className="py-3 rounded-2xl border border-secondary/15 font-bold text-sm flex items-center justify-center gap-2 hover:bg-secondary/10 transition-colors cursor-pointer"
                    >
                        <LinkIcon size={16} />
                        Copy Message
                    </button>
                    <button
                        onClick={handleShare}
                        className="py-3 rounded-2xl bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                    >
                        <Share2 size={16} />
                        Share
                    </button>
                </div>
            </div>

            <div className="bg-secondary/5 border border-secondary/10 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-xs text-secondary font-bold uppercase tracking-wider">Invite Tracking</p>
                    <span className="text-xs font-black px-2 py-1 rounded-full bg-primary/10 text-primary">
                        Total: {invitesQuery.data?.totalInvites ?? 0}
                    </span>
                </div>

                {invitesQuery.isLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-12 rounded-xl bg-secondary/10 animate-pulse" />
                        ))}
                    </div>
                ) : (invitesQuery.data?.invites || []).length === 0 ? (
                    <div className="text-sm text-secondary text-center py-6">
                        No users joined with your invitation code yet.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {(invitesQuery.data?.invites || []).map((item: any) => (
                            <div key={item._id} className="p-3 bg-background border border-secondary/10 rounded-xl">
                                <div className="font-bold text-sm">{item.name}</div>
                                <div className="text-xs text-secondary">{item.email}</div>
                                <div className="text-[11px] text-secondary mt-1">
                                    Joined: {new Date(item.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
