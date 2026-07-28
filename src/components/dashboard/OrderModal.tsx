"use client";

import { useState } from "react";
import { Package, X, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    comboNeedsDeposit,
    getComboAdminAmount,
    getComboOrdersAmount,
    getComboRemainingDeposit,
    getOrderCommission,
    getOrderSummaryTotal,
} from "@/lib/grab-display";
import { DepositModal } from "./DepositModal";

interface OrderModalProps {
    order: any;
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    isProcessing: boolean;
    onContactCS?: () => void;
    error?: string | null;
    onDepositSubmit?: (amount: number, depositAddress: string) => Promise<void>;
    isDepositPending?: boolean;
    /** Wallet balance — combo orders show order amount as requiredDeposit + balance */
    balance?: number;
    /** Block opening a second deposit while one is PENDING */
    hasPendingDeposit?: boolean;
}

export function OrderModal({
    order,
    isOpen,
    onClose,
    onComplete,
    isProcessing,
    onContactCS,
    error,
    onDepositSubmit,
    isDepositPending,
    balance = 0,
    hasPendingDeposit = false,
}: OrderModalProps) {
    const [showDepositModal, setShowDepositModal] = useState(false);

    if (!isOpen || !order) return null;

    const items = order.items ?? [];
    const orderPrice = Number(order.price) || 0;
    const isCombo = !!order.isCombo;
    const adminRequiredDeposit = getComboAdminAmount({
        isCombo,
        requiredDeposit: order.requiredDeposit,
        storedPrice: orderPrice,
    });
    const depositedTowardOrder = Math.max(0, Number(order.depositedAmount) || 0);
    const needsDeposit = comboNeedsDeposit({
        isCombo,
        isAdminAuthorized: order.isAdminAuthorized,
        requiredDeposit: order.requiredDeposit,
        storedPrice: orderPrice,
        depositedAmount: depositedTowardOrder,
    });
    const remainingDeposit = getComboRemainingDeposit(adminRequiredDeposit, depositedTowardOrder);
    const requiredDepositLine = isCombo ? remainingDeposit : 0;
    const ordersAmountLine = isCombo ? getComboOrdersAmount(balance, requiredDepositLine) : orderPrice;
    const commission = getOrderCommission(ordersAmountLine, isCombo);
    const summaryTotal = getOrderSummaryTotal(ordersAmountLine, commission);

    return (
        <>
            <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="relative bg-[#f8f8f8] dark:bg-zinc-950 w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[85vh] flex flex-col rounded-t-[2.5rem] sm:rounded-4xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-500">

                    {/* Header */}
                    <div className="bg-white dark:bg-zinc-900 px-6 py-4 flex items-center justify-between border-b border-black/5">
                        <button onClick={onClose} className="p-2 -ml-2 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
                            <X size={24} />
                        </button>
                        <h2 className="text-lg font-bold">Order Details</h2>
                        <div className="w-10 h-10" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="space-y-3">
                            {items.length > 0 ? items.map((item: any, idx: number) => (
                                <div key={idx} className="bg-white dark:bg-zinc-900 p-3 rounded-2xl flex gap-3 shadow-sm border border-black/5">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-100 rounded-xl overflow-hidden shrink-0">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-xs sm:text-sm font-medium line-clamp-2 text-zinc-800 dark:text-zinc-200 flex-1">
                                                {item.name === "Combine Order" ? "" : item.name}
                                            </p>
                                            <p className="text-zinc-400 text-[10px] sm:text-xs shrink-0">x{item.quantity}</p>
                                        </div>
                                        {!order.isCombo && (
                                            <p className="text-primary font-bold text-sm sm:text-base mt-1">{item.price.toFixed(2)} USDT</p>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl text-center space-y-2">
                                    <Package className="mx-auto text-zinc-300" size={40} />
                                    <p className="text-zinc-500 font-medium">{order.productName}</p>
                                </div>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-4xl space-y-3 shadow-sm border border-black/5">
                            <div className="flex justify-between items-center text-xs sm:text-sm">
                                <span className="text-zinc-400 font-medium">Your balance</span>
                                <span className={cn("font-bold", isCombo && needsDeposit ? "text-red-600 dark:text-red-500" : "text-zinc-800 dark:text-zinc-200")}>
                                    {balance.toFixed(2)} USDT
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs sm:text-sm">
                                <span className="text-zinc-400 font-medium">Orders amount</span>
                                <span className="text-zinc-800 dark:text-zinc-200 font-bold">
                                    {ordersAmountLine.toFixed(2)} USDT
                                </span>
                            </div>
                            {isCombo && (
                                <div className="flex justify-between items-center text-xs sm:text-sm">
                                    <span className="text-zinc-400 font-medium">Required deposit</span>
                                    <span className="text-zinc-800 dark:text-zinc-200 font-bold">
                                        {requiredDepositLine.toFixed(2)} USDT
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-xs sm:text-sm">
                                <span className="text-zinc-400 font-medium">Commission</span>
                                <span className="text-zinc-800 dark:text-zinc-200 font-bold">{commission.toFixed(2)} USDT</span>
                            </div>
                            
                            <div className="flex justify-between items-center pt-3 mt-1 border-t border-black/5">
                                <span className="text-zinc-400 font-bold text-sm">Expected amount</span>
                                <span className="text-xl font-black text-amber-600">
                                    {summaryTotal.toFixed(2)} USDT
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-white dark:bg-zinc-900 border-t border-black/5 space-y-3">
                        {needsDeposit && onDepositSubmit ? (
                            <button
                                type="button"
                                disabled={hasPendingDeposit}
                                onClick={() => {
                                    if (hasPendingDeposit) return;
                                    setShowDepositModal(true);
                                }}
                                className="w-full py-4 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Wallet size={18} />
                                {hasPendingDeposit ? "Deposit pending…" : "Deposit to Submit Order"}
                            </button>
                        ) : (
                            <button
                                onClick={onComplete}
                                disabled={isProcessing || !!error || needsDeposit}
                                className={cn(
                                    "w-full py-4 rounded-2xl font-bold bg-[#6b5555] text-white hover:opacity-95 transition-all active:scale-[0.98] shadow-lg cursor-pointer",
                                    (isProcessing || !!error || needsDeposit) && "opacity-40 grayscale-[0.5] cursor-not-allowed"
                                )}
                            >
                                {isProcessing ? "Processing..." : "Submit order"}
                            </button>
                        )}

                        {error && (
                            <button
                                onClick={onContactCS}
                                className="w-full py-3.5 rounded-2xl font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-all border border-primary/10 active:scale-[0.98] cursor-pointer"
                            >
                                Request Instant Unlock
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <DepositModal
                isOpen={showDepositModal}
                onClose={() => setShowDepositModal(false)}
                requiredAmount={remainingDeposit > 0 ? remainingDeposit : undefined}
                hasPendingDeposit={hasPendingDeposit}
                onSubmitPending={onDepositSubmit}
                isPending={isDepositPending}
            />
        </>
    );
}
