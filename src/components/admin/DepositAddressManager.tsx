"use client";

import { useState } from "react";
import { Plus, Trash2, Globe, User, RefreshCw, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DepositAddressEntry {
    _id: string;
    address: string;
    network: string;
    userId: { _id: string; name: string; email: string } | null;
    isActive: boolean;
    createdAt: string;
}

interface DepositAddressManagerProps {
    addresses: DepositAddressEntry[];
    onRefresh: () => void;
    isLoading: boolean;
}

export function DepositAddressManager({ addresses, onRefresh, isLoading }: DepositAddressManagerProps) {
    const [newAddress, setNewAddress] = useState("");
    const [newNetwork, setNewNetwork] = useState("TRON (TRC-20)");
    const [userEmailFilter, setUserEmailFilter] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleSave = async () => {
        if (!newAddress.trim()) {
            toast.error("Please enter a wallet address");
            return;
        }
        setIsSaving(true);
        try {
            const res = await fetch("/api/admin/deposit-address", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    address: newAddress.trim(),
                    network: newNetwork,
                    userId: userEmailFilter.trim() || undefined,
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to save address");
            }
            toast.success("Deposit address updated successfully");
            setNewAddress("");
            setUserEmailFilter("");
            onRefresh();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await fetch(`/api/admin/deposit-address?id=${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to deactivate address");
            toast.success("Address deactivated");
            onRefresh();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="p-6 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Add new address form */}
            <div className="space-y-4">
                <h3 className="font-black text-sm uppercase tracking-widest text-secondary flex items-center gap-2">
                    <Plus size={16} className="text-primary" /> Set Deposit Address
                </h3>

                <div className="grid gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary">Wallet Address (USDT)</label>
                        <input
                            value={newAddress}
                            onChange={(e) => setNewAddress(e.target.value)}
                            placeholder="TL5zKr87nZT2RHTDQa6kY2P4C59orFdCTe"
                            className="w-full px-4 py-3 bg-secondary/5 border border-secondary/10 rounded-2xl text-sm font-mono focus:border-primary/50 outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-secondary">Network</label>
                            <select
                                value={newNetwork}
                                onChange={(e) => setNewNetwork(e.target.value)}
                                className="w-full px-4 py-3 bg-secondary/5 border border-secondary/10 rounded-2xl text-sm font-bold focus:border-primary/50 outline-none transition-all cursor-pointer"
                            >
                                <option>TRON (TRC-20)</option>
                                <option>Ethereum (ERC-20)</option>
                                <option>BNB Chain (BEP-20)</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-secondary">
                                User ID (optional — leave blank for global)
                            </label>
                            <input
                                value={userEmailFilter}
                                onChange={(e) => setUserEmailFilter(e.target.value)}
                                placeholder="MongoDB User _id"
                                className="w-full px-4 py-3 bg-secondary/5 border border-secondary/10 rounded-2xl text-xs font-mono focus:border-primary/50 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full sm:w-auto px-8 py-3.5 bg-primary text-white rounded-2xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                        <CheckCircle size={16} />
                        {isSaving ? "Saving..." : "Save Address"}
                    </button>
                </div>
            </div>

            {/* Active addresses list */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm uppercase tracking-widest text-secondary">Active Addresses</h3>
                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="p-2 text-secondary hover:text-primary transition-colors cursor-pointer"
                    >
                        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                    </button>
                </div>

                {addresses.length === 0 ? (
                    <div className="py-12 text-center text-secondary opacity-50">
                        <p className="text-sm font-medium">No active deposit addresses configured</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {addresses.map((entry) => (
                            <div
                                key={entry._id}
                                className="flex items-start gap-4 p-5 bg-secondary/5 border border-secondary/10 rounded-3xl"
                            >
                                <div className={cn(
                                    "p-2.5 rounded-xl shrink-0",
                                    entry.userId ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-500"
                                )}>
                                    {entry.userId ? <User size={16} /> : <Globe size={16} />}
                                </div>

                                <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                            entry.userId ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-500"
                                        )}>
                                            {entry.userId ? "Per-User" : "Global"}
                                        </span>
                                        <span className="text-[9px] text-secondary font-medium">{entry.network}</span>
                                    </div>

                                    {entry.userId && (
                                        <p className="text-xs text-secondary truncate">
                                            {entry.userId.name} · {entry.userId.email}
                                        </p>
                                    )}

                                    <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 truncate">
                                        {entry.address}
                                    </p>

                                    <p className="text-[10px] text-zinc-400">
                                        Set {new Date(entry.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleDelete(entry._id)}
                                    disabled={deletingId === entry._id}
                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer shrink-0"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
