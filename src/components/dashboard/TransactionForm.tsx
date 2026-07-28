"use client";

import { useState } from "react";
import { PlusCircle, MinusCircle } from "lucide-react";
import { DepositModal } from "./DepositModal";
import { useTrading } from "@/hooks/useTrading";

interface TransactionFormProps {
    onAction: (type: "DEPOSIT" | "WITHDRAW", amount: number, depositAddress?: string) => Promise<unknown>;
    isPending: boolean;
    balance: number;
}

export function TransactionForm({ onAction, isPending, balance }: TransactionFormProps) {
    const { hasPendingDeposit } = useTrading();
    const [amount, setAmount] = useState("");
    const [error, setError] = useState("");
    const [showDepositModal, setShowDepositModal] = useState(false);

    const handleWithdraw = async () => {
        const numericAmount = Number(amount);
        if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
            setError("Please enter a valid amount");
            return;
        }
        if (numericAmount > balance) {
            setError("Insufficient balance for this withdrawal");
            return;
        }
        setError("");
        try {
            await onAction("WITHDRAW", numericAmount);
            setAmount("");
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDepositSubmit = async (depositAmount: number, depositAddress: string) => {
        await onAction("DEPOSIT", depositAmount, depositAddress);
    };

    return (
        <>
            <div className="p-8 rounded-4xl bg-secondary/5 border border-secondary/10">
                <h3 className="text-xl font-bold mb-6">Quick Actions</h3>

                {error && (
                    <div className="p-3 bg-red-500/10 text-red-500 text-xs rounded-xl mb-4 text-center border border-red-500/20">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-bold">$</span>
                        <input
                            type="number"
                            className="w-full pl-10 pr-6 py-4 bg-background border border-secondary/10 rounded-2xl focus:border-primary/50 outline-none transition-all font-bold text-lg"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setShowDepositModal(true)}
                            disabled={isPending}
                            className="flex items-center justify-center gap-2 py-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl font-bold hover:bg-green-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            <PlusCircle size={20} />
                            Deposit
                        </button>
                        <button
                            onClick={handleWithdraw}
                            disabled={isPending}
                            className="flex items-center justify-center gap-2 py-4 bg-primary/10 border border-primary/20 text-primary rounded-2xl font-bold hover:bg-primary/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            <MinusCircle size={20} />
                            {isPending ? "..." : "Withdraw"}
                        </button>
                    </div>
                </div>
            </div>

            <DepositModal
                isOpen={showDepositModal}
                onClose={() => setShowDepositModal(false)}
                hasPendingDeposit={hasPendingDeposit}
                onSubmitPending={handleDepositSubmit}
                isPending={isPending}
            />
        </>
    );
}
