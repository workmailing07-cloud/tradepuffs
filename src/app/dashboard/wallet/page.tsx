"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTrading } from "@/hooks/useTrading";

const DEFAULT_NETWORK = "Binance (TRC-20)";

export default function WalletManagementPage() {
    const router = useRouter();
    const { savedWithdrawAddress, savedWithdrawNetwork, hasPendingWithdrawWalletChange, refresh, loading } = useTrading();

    const [setupPassword, setSetupPassword] = useState("");
    const [setupAddress, setSetupAddress] = useState("");
    const [changePassword, setChangePassword] = useState("");
    const [changeAddress, setChangeAddress] = useState("");
    const [submittingSetup, setSubmittingSetup] = useState(false);
    const [submittingChange, setSubmittingChange] = useState(false);

    const hasSaved = Boolean(savedWithdrawAddress?.trim());

    const submitSetup = async () => {
        setSubmittingSetup(true);
        try {
            const res = await fetch("/api/user/withdraw-wallet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "setup",
                    password: setupPassword,
                    address: setupAddress,
                    network: DEFAULT_NETWORK,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save");
            toast.success("Withdrawal wallet saved");
            setSetupPassword("");
            setSetupAddress("");
            refresh();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Failed");
        } finally {
            setSubmittingSetup(false);
        }
    };

    const submitChangeRequest = async () => {
        setSubmittingChange(true);
        try {
            const res = await fetch("/api/user/withdraw-wallet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "request_change",
                    password: changePassword,
                    address: changeAddress,
                    network: DEFAULT_NETWORK,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Request failed");
            toast.success(data.message || "Request submitted for admin approval");
            setChangePassword("");
            setChangeAddress("");
            refresh();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Failed");
        } finally {
            setSubmittingChange(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="p-3 bg-secondary/10 hover:bg-secondary/20 rounded-full text-secondary transition-all cursor-pointer"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Wallet className="text-primary" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Wallet management</h1>
                        <p className="text-secondary text-xs font-medium">Withdrawal address & security</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : !hasSaved ? (
                <div className="p-5 bg-secondary/5 border border-secondary/10 rounded-3xl space-y-4">
                    <p className="text-sm font-bold">Save your withdrawal wallet</p>
                    <p className="text-xs text-secondary leading-relaxed">
                        Enter your <strong>login password</strong> to confirm, and the USDT TRC-20 address where you want to receive withdrawals. This is saved once — you will not enter it on every withdrawal.
                    </p>
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Wallet password (your login password)</p>
                        <input
                            type="password"
                            value={setupPassword}
                            onChange={(e) => setSetupPassword(e.target.value)}
                            autoComplete="current-password"
                            className="w-full px-4 py-3 bg-background border border-secondary/10 rounded-2xl text-sm focus:border-primary/50 outline-none"
                            placeholder="Enter login password"
                        />
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Wallet address (USDT TRC-20)</p>
                        <input
                            value={setupAddress}
                            onChange={(e) => setSetupAddress(e.target.value)}
                            className="w-full px-4 py-3 bg-background border border-secondary/10 rounded-2xl font-mono text-sm focus:border-primary/50 outline-none"
                            placeholder="Paste withdrawal address"
                        />
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Network</p>
                        <div className="px-4 py-3 bg-secondary/5 border border-secondary/10 rounded-2xl text-sm font-bold">{DEFAULT_NETWORK}</div>
                    </div>
                    <button
                        type="button"
                        disabled={submittingSetup}
                        onClick={() => void submitSetup()}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold disabled:opacity-50 cursor-pointer"
                    >
                        {submittingSetup ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Save withdrawal wallet"}
                    </button>
                </div>
            ) : (
                <>
                    <div className="p-5 bg-secondary/5 border border-secondary/10 rounded-3xl space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Saved withdrawal address</p>
                        <p className="font-mono text-xs break-all font-bold">{savedWithdrawAddress}</p>
                        <p className="text-xs text-secondary">
                            Network: <span className="font-bold text-foreground">{savedWithdrawNetwork || DEFAULT_NETWORK}</span>
                        </p>
                    </div>

                    {hasPendingWithdrawWalletChange ? (
                        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200 text-sm font-medium">
                            A request to change your withdrawal address is pending admin approval. Withdrawals still use your current address above until the change is approved.
                        </div>
                    ) : (
                        <div className="p-5 bg-secondary/5 border border-secondary/10 rounded-3xl space-y-4">
                            <p className="text-sm font-bold">Request address change</p>
                            <p className="text-xs text-secondary leading-relaxed">
                                To change your saved address, enter your <strong>login password</strong> and the new wallet address. An admin must approve before it takes effect.
                            </p>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Wallet password (login password)</p>
                                <input
                                    type="password"
                                    value={changePassword}
                                    onChange={(e) => setChangePassword(e.target.value)}
                                    autoComplete="current-password"
                                    className="w-full px-4 py-3 bg-background border border-secondary/10 rounded-2xl text-sm focus:border-primary/50 outline-none"
                                    placeholder="Enter login password"
                                />
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-secondary">New wallet address</p>
                                <input
                                    value={changeAddress}
                                    onChange={(e) => setChangeAddress(e.target.value)}
                                    className="w-full px-4 py-3 bg-background border border-secondary/10 rounded-2xl font-mono text-sm focus:border-primary/50 outline-none"
                                    placeholder="New USDT TRC-20 address"
                                />
                            </div>
                            <button
                                type="button"
                                disabled={submittingChange}
                                onClick={() => void submitChangeRequest()}
                                className="w-full py-4 bg-secondary/15 border border-secondary/20 rounded-2xl font-bold disabled:opacity-50 cursor-pointer"
                            >
                                {submittingChange ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Submit change request"}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
