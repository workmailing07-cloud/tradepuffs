"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useTrading } from "@/hooks/useTrading";
import { ProfileStats } from "@/components/dashboard/ProfileStats";
import { ArrowLeft, Pencil, Check, Eye, EyeOff, Lock, Mail, CalendarDays, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function getVipLevel(balance: number) {
    if (balance >= 10000) return "VIP 4";
    if (balance >= 5000) return "VIP 3";
    if (balance >= 1000) return "VIP 2";
    return "VIP 1";
}

export default function ProfilePage() {
    const router = useRouter();
    const { data: session } = useSession();
    const queryClient = useQueryClient();
    const { user, balance = 0, totalCommission = 0, dailyTasksCompleted = 0, maxDailyTasks = 25 } = useTrading();

    const [name, setName] = useState((session?.user?.name ?? "") as string);
    const [isEditingName, setIsEditingName] = useState(false);
    const [isSavingName, setIsSavingName] = useState(false);

    const [curPwd, setCurPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [isSavingPwd, setIsSavingPwd] = useState(false);

    const initials = (session?.user?.name ?? "U").slice(0, 2).toUpperCase();
    const inviteCode = (user as any)?.invitationCode || "------";
    const memberSince = (user as any)?.createdAt
        ? new Date((user as any).createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : "—";
    const status = (user as any)?.status ?? "ACTIVE";

    const handleSaveName = async () => {
        if (!name.trim()) { toast.error("Name cannot be empty"); return; }
        setIsSavingName(true);
        try {
            const res = await fetch("/api/user/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            queryClient.invalidateQueries({ queryKey: ["user-me"] });
            toast.success("Name updated!");
            setIsEditingName(false);
        } catch (e: any) { toast.error(e.message); }
        finally { setIsSavingName(false); }
    };

    const handleChangePassword = async () => {
        if (newPwd !== confirmPwd) { toast.error("Passwords do not match"); return; }
        if (newPwd.length < 6) { toast.error("Password must be at least 6 characters"); return; }
        setIsSavingPwd(true);
        try {
            const res = await fetch("/api/user/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: curPwd, newPassword: newPwd }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(data.message || "Password change request sent to admin!");
            setCurPwd(""); setNewPwd(""); setConfirmPwd("");
        } catch (e: any) { toast.error(e.message); }
        finally { setIsSavingPwd(false); }
    };

    return (
        <div className="max-w-lg mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="p-3 bg-secondary/10 hover:bg-secondary/20 rounded-full text-secondary transition-all cursor-pointer">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-black tracking-tight">Profile</h1>
            </div>

            {/* Avatar + identity */}
            <div className="flex flex-col items-center gap-4 py-8 mb-6">
                <div className="w-24 h-24 rounded-full bg-linear-to-b from-[#7a2222] to-[#561616] flex items-center justify-center text-white text-3xl font-black shadow-xl border-4 border-background">
                    {initials}
                </div>
                <div className="text-center space-y-1">
                    <div className="flex items-center gap-2 justify-center">
                        {isEditingName ? (
                            <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                                className="text-xl font-black text-center bg-transparent border-b-2 border-primary outline-none w-48 pb-0.5" />
                        ) : (
                            <span className="text-xl font-black">{name}</span>
                        )}
                        <button onClick={() => isEditingName ? handleSaveName() : setIsEditingName(true)}
                            disabled={isSavingName}
                            className="p-1.5 bg-secondary/10 hover:bg-primary/10 hover:text-primary rounded-lg transition-all cursor-pointer">
                            {isEditingName ? <Check size={14} /> : <Pencil size={14} />}
                        </button>
                    </div>
                    <p className="text-secondary text-sm">{session?.user?.email}</p>
                    <span className="inline-block px-3 py-0.5 bg-amber-400/10 text-amber-500 border border-amber-400/20 text-[10px] font-black rounded-full tracking-wider">
                        {getVipLevel(balance)}
                    </span>
                </div>
            </div>

            {/* Stats */}
            <ProfileStats
                balance={balance}
                totalCommission={totalCommission}
                dailyTasksCompleted={dailyTasksCompleted}
                maxDailyTasks={maxDailyTasks}
                vipLevel={getVipLevel(balance)}
            />

            {/* Account info */}
            <div className="mt-6 bg-secondary/5 border border-secondary/10 rounded-3xl divide-y divide-secondary/5">
                {[
                    { icon: Mail, label: "Email", value: session?.user?.email ?? "—" },
                    { icon: CalendarDays, label: "Member since", value: memberSince },
                    { icon: ShieldCheck, label: "Account status", value: status, badge: status === "ACTIVE" ? "emerald" : status === "PENDING_COMBO" ? "amber" : "red" },
                    { icon: Lock, label: "Invitation code", value: inviteCode },
                ].map(({ icon: Icon, label, value, badge }) => (
                    <div key={label} className="flex items-center gap-4 px-5 py-4">
                        <div className="w-8 h-8 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary shrink-0">
                            <Icon size={16} />
                        </div>
                        <span className="flex-1 text-xs text-secondary font-bold">{label}</span>
                        {badge ? (
                            <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full",
                                badge === "emerald" ? "bg-emerald-500/10 text-emerald-500" :
                                badge === "amber" ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500")}>
                                {value}
                            </span>
                        ) : (
                            <span className="text-xs font-bold">{value}</span>
                        )}
                    </div>
                ))}
            </div>

            {/* Change Password */}
            <div className="mt-6 bg-secondary/5 border border-secondary/10 rounded-3xl p-6 space-y-4">
                <h3 className="font-black text-sm flex items-center gap-2">
                    <Lock size={16} className="text-primary" /> Change Password
                </h3>
                {[
                    { label: "Current Password", value: curPwd, set: setCurPwd },
                    { label: "New Password", value: newPwd, set: setNewPwd },
                    { label: "Confirm New Password", value: confirmPwd, set: setConfirmPwd },
                ].map(({ label, value, set }) => (
                    <div key={label} className="relative">
                        <input type={showPwd ? "text" : "password"} placeholder={label} value={value}
                            onChange={(e) => set(e.target.value)}
                            className="w-full pr-12 pl-4 py-3.5 bg-background border border-secondary/10 rounded-2xl text-sm font-medium focus:border-primary/50 outline-none transition-all" />
                        <button type="button" onClick={() => setShowPwd((p) => !p)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-foreground transition-colors cursor-pointer">
                            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                ))}
                <button onClick={handleChangePassword} disabled={isSavingPwd || !curPwd || !newPwd || !confirmPwd}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 cursor-pointer">
                    {isSavingPwd ? "Updating..." : "Update Password"}
                </button>
            </div>
        </div>
    );
}
