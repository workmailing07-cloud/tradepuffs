"use client";

import { useState } from "react";
import { Package, CheckCircle2, AlertCircle, Wallet, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    comboNeedsDeposit,
    getComboAdminAmount,
    getComboOrdersAmount,
    getComboRemainingDeposit,
    getOrderCommission,
    getOrderSummaryTotal,
} from "@/lib/grab-display";

interface GrabRecordListProps {
    records: any[];
    /** Current wallet balance — used so combo orders stop showing “Deposit” after admin credits a deposit */
    balance?: number;
    onAction?: (order: any) => void;
    onDepositRequired?: (order: any) => void;
    onCancel?: (orderId: string) => void;
    isCancelling?: boolean;
}

export function GrabRecordList({ records, balance = 0, onAction, onDepositRequired, onCancel, isCancelling }: GrabRecordListProps) {
    const [activeTab, setActiveTab] = useState<"INCOMPLETE" | "COMPLETE">("INCOMPLETE");

    const incomplete = records.filter((r) => r.status === "PENDING" || r.status === "CANCELLED");
    const complete = records.filter((r) => r.status === "COMPLETED");
    const filteredRecords = activeTab === "COMPLETE" ? complete : incomplete;

    const incompleteCount = incomplete.filter(r => r.status === "PENDING").length;

    if (records.length === 0) {
        return (
            <div className="p-12 text-center space-y-4">
                <Package size={48} className="mx-auto opacity-10" />
                <p className="text-secondary font-medium italic">No orders found yet...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex border-b border-black/5 dark:border-white/5 px-2">
                {(["INCOMPLETE", "COMPLETE"] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={cn("flex-1 py-4 text-sm font-bold transition-all relative flex items-center justify-center gap-1.5",
                            activeTab === tab ? "text-primary" : "text-zinc-400")}>
                        {tab === "INCOMPLETE" ? "Incomplete" : "Complete"}
                        {tab === "INCOMPLETE" && incompleteCount > 0 && (
                            <span className="w-4 h-4 text-[9px] bg-red-500 text-white rounded-full flex items-center justify-center font-black">
                                {incompleteCount}
                            </span>
                        )}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-primary rounded-t-full animate-in fade-in zoom-in duration-300" />
                        )}
                    </button>
                ))}
            </div>

            <div className="space-y-6">
                {filteredRecords.length === 0 ? (
                    <div className="py-20 text-center opacity-40">
                        <Package size={36} className="mx-auto mb-3" />
                        <p className="text-sm font-medium">No {activeTab.toLowerCase()} orders</p>
                    </div>
                ) : filteredRecords.map((record) => {
                    const isCombo = record.isCombo;
                    const orderPrice = Number(record.price) || 0;
                    const adminRequiredDeposit = getComboAdminAmount({
                        isCombo,
                        requiredDeposit: record.requiredDeposit,
                        storedPrice: orderPrice,
                    });
                    const depositedTowardOrder = Math.max(0, Number(record.depositedAmount) || 0);
                    const remainingDeposit = getComboRemainingDeposit(adminRequiredDeposit, depositedTowardOrder);
                    const requiredDepositLine = isCombo ? remainingDeposit : 0;
                    const needsDeposit = comboNeedsDeposit({
                        isCombo,
                        isAdminAuthorized: record.isAdminAuthorized,
                        requiredDeposit: record.requiredDeposit,
                        storedPrice: orderPrice,
                        depositedAmount: depositedTowardOrder,
                    });
                    const ordersAmountLine = isCombo
                        ? getComboOrdersAmount(balance, requiredDepositLine)
                        : orderPrice;
                    const commission = getOrderCommission(ordersAmountLine, isCombo);
                    const summaryTotal = getOrderSummaryTotal(ordersAmountLine, commission);
                    const isCancelled = record.status === "CANCELLED";

                    return (
                        <div key={record._id} className={cn(
                            "bg-white dark:bg-zinc-950 rounded-4xl overflow-hidden shadow-sm border flex flex-col animate-in fade-in slide-in-from-bottom-2",
                            isCancelled ? "border-zinc-200 dark:border-zinc-800 opacity-60"
                                : needsDeposit ? "border-amber-400/50 ring-1 ring-amber-400/20"
                                : "border-black/5 dark:border-white/5"
                        )}>
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                                    #{record._id.slice(-10).toUpperCase()}
                                </p>
                                <div className="flex items-center gap-2">
                                    {isCancelled && (
                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                                            <XCircle size={10} className="text-zinc-400" />
                                            <span className="text-[9px] font-black text-zinc-400 uppercase">Cancelled</span>
                                        </div>
                                    )}
                                    {activeTab === "COMPLETE" && (
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-green-500">
                                            <CheckCircle2 size={10} /> Settled
                                        </div>
                                    )}
                                    {needsDeposit && !isCancelled && (
                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-400/10 rounded-full">
                                            <AlertCircle size={10} className="text-amber-500" />
                                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider">Deposit Required</span>
                                        </div>
                                    )}
                                    {/* Cancel button for pending orders */}
                                    {activeTab === "INCOMPLETE" && !isCancelled && onCancel && (
                                        <button onClick={() => onCancel(record._id)} disabled={isCancelling}
                                            className="w-6 h-6 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-zinc-400 hover:text-red-500 transition-all cursor-pointer disabled:opacity-40"
                                            title="Cancel order">
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 space-y-3">
                                {/* Items */}
                                <div className="space-y-3">
                                    {(record.items?.length > 0 ? record.items : [null]).map((item: any, idx: number) => (
                                        <div key={idx} className="flex gap-4">
                                            <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden shrink-0 border border-black/5 dark:border-white/5 flex items-center justify-center">
                                                {item?.image
                                                    ? <img src={item.image} alt={item?.name} className="w-full h-full object-cover" />
                                                    : <Package className="text-zinc-300" size={28} />}
                                            </div>
                                            <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-tight flex-1">
                                                        {item?.name ?? record.productName}
                                                    </p>
                                                    <p className="text-zinc-400 text-[12px] shrink-0">x{item?.quantity ?? 1}</p>
                                                </div>
                                                {!isCombo && (
                                                    <p className="text-[14px] font-bold text-primary mt-1">
                                                        {(item?.price ?? record.price).toFixed(2)} USDT
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Stats */}
                                <div className="pt-3 space-y-2 border-t border-black/5 dark:border-white/5">
                                    <StatRow label="Transaction time" value={new Date(record.createdAt).toISOString().replace("T", " ").slice(0, 19)} />
                                    <StatRow label="Your balance" value={`${balance.toFixed(2)} USDT`} mono error={isCombo && needsDeposit} />
                                    <StatRow
                                        label="Orders amount"
                                        value={`${ordersAmountLine.toFixed(2)} USDT`}
                                        mono
                                    />
                                    {isCombo && (
                                        <StatRow
                                            label="Required deposit"
                                            value={`${requiredDepositLine.toFixed(2)} USDT`}
                                            mono
                                            highlight={needsDeposit}
                                        />
                                    )}
                                    <StatRow label="Commission" value={`${commission.toFixed(2)} USDT`} mono />
                                    <div className="flex justify-between pt-2 border-t border-black/5 dark:border-white/5">
                                        <span className="text-zinc-400 text-[12px] font-medium">Expected amount</span>
                                        <span className="text-[15px] font-black text-amber-600 font-mono">
                                            {summaryTotal.toFixed(2)} USDT
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons */}
                            {activeTab === "INCOMPLETE" && !isCancelled && (
                                <div className="p-4 pt-0">
                                    {needsDeposit ? (
                                        <button onClick={() => onDepositRequired?.(record)}
                                            className="w-full py-4 flex items-center justify-center gap-2 bg-amber-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all hover:bg-amber-400 cursor-pointer">
                                            <Wallet size={16} /> Deposit to Submit Order
                                        </button>
                                    ) : (
                                        <button onClick={() => onAction?.(record)}
                                            className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 active:scale-[0.98] transition-all hover:opacity-90 cursor-pointer">
                                            Submit Order
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function StatRow({ label, value, mono, highlight, error }: { label: string; value: string; mono?: boolean; highlight?: boolean; error?: boolean }) {
    return (
        <div className="flex justify-between text-[12px]">
            <span className="text-zinc-400">{label}</span>
            <span className={cn("font-medium", mono && "font-mono", error ? "text-red-600 dark:text-red-500 font-bold" : highlight ? "text-amber-600 font-bold" : "text-zinc-600 dark:text-zinc-400")}>
                {value}
            </span>
        </div>
    );
}
