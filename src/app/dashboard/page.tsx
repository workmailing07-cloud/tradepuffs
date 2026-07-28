"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTrading } from "@/hooks/useTrading";
import { ProfileHeader } from "@/components/dashboard/ProfileHeader";
import { DepositModal } from "@/components/dashboard/DepositModal";
import { Users, ClipboardList, TrendingUp, Mail, UserCircle, ArrowDownCircle, ArrowUpCircle, Settings, Shield, ChevronRight, X, Wallet } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
    { label: "Teams", icon: Users, bg: "bg-amber-500", href: "/dashboard/invite" },
    { label: "Record", icon: ClipboardList, bg: "bg-emerald-500", href: "/dashboard/grab/records" },
    { label: "Wallet", icon: TrendingUp, bg: "bg-rose-500", href: "/dashboard/history" },
    { label: "Invite", icon: Mail, bg: "bg-teal-500", href: "/dashboard/invite" },
];

function WithdrawModal({ isOpen, onClose, balance, dailyTasksCompleted, maxDailyTasks, hasPendingWithdraw, savedWithdrawAddress, hasPendingWithdrawWalletChange, isAdminUser, onWithdraw, isPending }: {
    isOpen: boolean; onClose: () => void; balance: number;
    dailyTasksCompleted: number; maxDailyTasks: number;
    hasPendingWithdraw: boolean;
    savedWithdrawAddress: string;
    hasPendingWithdrawWalletChange: boolean;
    /** Admins use instant withdraw server-side; no saved wallet required. */
    isAdminUser: boolean;
    onWithdraw: (amount: number, withdrawAddress?: string, withdrawNetwork?: string) => Promise<void>;
    isPending: boolean;
}) {
    const [amount, setAmount] = useState("");
    const [adminAddress, setAdminAddress] = useState("");
    const tasksComplete = dailyTasksCompleted >= maxDailyTasks;
    const hasWallet = Boolean(savedWithdrawAddress?.trim());
    const walletGateOk = isAdminUser || hasWallet;
    const canSubmitWithdraw = tasksComplete && !hasPendingWithdraw && walletGateOk;

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (hasPendingWithdraw) {
            toast.info(
                "Your withdrawal request has been received and is being processed. Please wait until it is completed."
            );
            return;
        }
        if (!isAdminUser && !hasWallet) {
            toast.error("Set your withdrawal wallet in Wallet management first.");
            return;
        }
        if (!tasksComplete) { toast.error(`Complete all ${maxDailyTasks} orders first`); return; }
        const val = Number(amount);
        if (!val || val <= 0) { toast.error("Enter a valid amount"); return; }
        if (val > balance) { toast.error("Withdrawal amount cannot exceed your available balance."); return; }
        try {
            if (isAdminUser) {
                await onWithdraw(val, adminAddress.trim() || undefined, "Binance (TRC-20)");
            } else {
                await onWithdraw(val);
            }
            onClose();
            setAmount("");
            setAdminAddress("");
        }
        catch (e: any) { toast.error(e.message); }
    };

    return (
        <div className="fixed inset-0 z-110 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-950 w-full max-w-sm rounded-t-[2.5rem] sm:rounded-4xl p-8 space-y-5 animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-500">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black">Withdrawal</h3>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-xl transition-colors cursor-pointer"><X size={20} /></button>
                </div>

                {/* Tasks gate */}
                {hasPendingWithdraw && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl text-center space-y-1">
                        <p className="text-sm font-black text-blue-700 dark:text-blue-300">Withdrawal in progress</p>
                        <p className="text-xs text-blue-700/90 dark:text-blue-300/90 leading-relaxed">
                            Your request has been received and is being processed. You cannot submit another until this one is completed.
                        </p>
                    </div>
                )}
                {!tasksComplete && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl text-center space-y-1">
                        <p className="text-sm font-black text-amber-600 dark:text-amber-400">Orders Required</p>
                        <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
                            Complete all {maxDailyTasks} daily orders to unlock withdrawal.
                        </p>
                        <p className="text-lg font-black text-amber-500 mt-1">{dailyTasksCompleted} / {maxDailyTasks}</p>
                    </div>
                )}

                {!isAdminUser && !hasWallet && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl space-y-2">
                        <p className="text-sm font-black text-rose-700 dark:text-rose-300">Withdrawal wallet not set</p>
                        <p className="text-xs text-rose-700/90 dark:text-rose-300/90 leading-relaxed">
                            Save your USDT withdrawal address once in Wallet management (with your login password) before you can withdraw.
                        </p>
                        <Link
                            href="/dashboard/wallet"
                            onClick={onClose}
                            className="inline-flex items-center gap-2 text-sm font-bold text-primary underline underline-offset-2"
                        >
                            Open Wallet management
                        </Link>
                    </div>
                )}
                {!isAdminUser && hasWallet && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Saved withdrawal address</p>
                        <div className="px-4 py-3 bg-secondary/5 border border-secondary/10 rounded-2xl font-mono text-xs break-all text-foreground">
                            {savedWithdrawAddress}
                        </div>
                        <Link href="/dashboard/wallet" onClick={onClose} className="text-xs font-bold text-primary">
                            Change address (requires admin approval) →
                        </Link>
                    </div>
                )}
                {!isAdminUser && hasPendingWithdrawWalletChange && hasWallet && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        A wallet change is pending approval. Withdrawals still use the address above until approved.
                    </p>
                )}
                {isAdminUser && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Withdrawal address (optional)</p>
                        <input
                            value={adminAddress}
                            onChange={(e) => setAdminAddress(e.target.value)}
                            disabled={!tasksComplete || hasPendingWithdraw}
                            className="w-full px-4 py-3 bg-secondary/5 border border-secondary/10 rounded-2xl font-mono text-sm focus:border-primary/50 outline-none transition-all disabled:opacity-40"
                            placeholder="TRC-20 address (optional for admin)"
                        />
                    </div>
                )}
                <div className="space-y-3">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1.5">Network</p>
                        <div className="px-4 py-3 bg-secondary/5 border border-secondary/10 rounded-2xl font-bold text-sm text-foreground">
                            Binance (TRC-20)
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1.5">
                            Amount <span className="text-zinc-400 normal-case font-medium">({balance.toFixed(2)} USDT available)</span>
                        </p>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-bold text-sm">$</span>
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={!tasksComplete || (!isAdminUser && !hasWallet) || hasPendingWithdraw}
                                className="w-full pl-9 pr-4 py-3 bg-secondary/5 border border-secondary/10 rounded-2xl font-bold text-base focus:border-primary/50 outline-none transition-all disabled:opacity-40"
                                placeholder="0.00" />
                        </div>
                    </div>
                </div>

                <button onClick={handleSubmit} disabled={isPending || !canSubmitWithdraw}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 cursor-pointer">
                    {isPending ? "Submitting..." : "Submit Withdrawal Request"}
                </button>
            </div>
        </div>
    );
}

export default function MinePage() {
    const { data: session } = useSession();
    const {
        user,
        balance,
        dailyTasksCompleted,
        maxDailyTasks,
        hasPendingWithdraw,
        hasPendingDeposit,
        savedWithdrawAddress,
        hasPendingWithdrawWalletChange,
        isProcessing,
        createTransaction,
    } = useTrading();
    const [showDeposit, setShowDeposit] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);

    const name = session?.user?.name ?? "User";

    const menuItems = [
        { label: "Profile", icon: UserCircle, href: "/dashboard/profile" },
        { label: "Wallet management", icon: Wallet, href: "/dashboard/wallet" },
        { label: "Deposit records", icon: ArrowDownCircle, href: "/dashboard/history?type=DEPOSIT" },
        { label: "Withdrawal records", icon: ArrowUpCircle, href: "/dashboard/history?type=WITHDRAW" },
        { label: "Setting", icon: Settings, href: "/dashboard/settings" },
        ...((user as any)?.role === "ADMIN"
            ? [{ label: "Admin Panel", icon: Shield, href: "/dashboard/admin" }]
            : []),
    ];

    return (
        <div className="pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ProfileHeader
                name={name}
                balance={balance}
                invitationCode={(user as any)?.invitationCode}
                onDeposit={() => setShowDeposit(true)}
                onWithdraw={() => setShowWithdraw(true)}
            />

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-2 px-2 py-6">
                {QUICK_ACTIONS.map(({ label, icon: Icon, bg, href }) => {
                    const content = (
                        <div className="flex flex-col items-center gap-2 py-4 cursor-pointer group">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md group-active:scale-90 transition-transform", bg)}>
                                <Icon size={22} />
                            </div>
                            <span className="text-[11px] font-bold text-secondary text-center leading-tight">{label}</span>
                        </div>
                    );
                    return href ? (
                        <Link key={label} href={href}>{content}</Link>
                    ) : (
                        <div key={label} onClick={() => toast.info(`${label} coming soon!`)}>{content}</div>
                    );
                })}
            </div>

            <div className="h-2 bg-secondary/5" />

            {/* Menu List */}
            <div className="divide-y divide-secondary/5">
                {menuItems.map(({ label, icon: Icon, href }) => (
                    <Link
                        key={label}
                        href={href}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/5 active:bg-secondary/10 transition-colors cursor-pointer group"
                    >
                        <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <Icon size={18} />
                        </div>
                        <span className="flex-1 text-sm font-bold">{label}</span>
                        <ChevronRight size={16} className="text-secondary/50" />
                    </Link>
                ))}
            </div>

            <DepositModal
                isOpen={showDeposit}
                onClose={() => setShowDeposit(false)}
                hasPendingDeposit={hasPendingDeposit}
                onSubmitPending={async (amount, depositAddress) => {
                    await createTransaction({ type: "DEPOSIT", amount, depositAddress });
                }}
                isPending={isProcessing}
            />

            <WithdrawModal
                isOpen={showWithdraw}
                onClose={() => setShowWithdraw(false)}
                balance={balance}
                dailyTasksCompleted={dailyTasksCompleted}
                maxDailyTasks={maxDailyTasks}
                hasPendingWithdraw={hasPendingWithdraw}
                savedWithdrawAddress={savedWithdrawAddress}
                hasPendingWithdrawWalletChange={hasPendingWithdrawWalletChange}
                isAdminUser={(user as { role?: string } | undefined)?.role === "ADMIN"}
                onWithdraw={async (amount, withdrawAddress, withdrawNetwork) => {
                    await createTransaction({
                        type: "WITHDRAW",
                        amount,
                        withdrawAddress: withdrawAddress ?? "",
                        withdrawNetwork: withdrawNetwork ?? "",
                    });
                    toast.success("Withdrawal request submitted! Admin will review shortly.");
                }}
                isPending={isProcessing}
            />
        </div>
    );
}
