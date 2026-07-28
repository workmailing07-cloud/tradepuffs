"use client";

import { useTrading } from "@/hooks/useTrading";
import { TransactionList, Transaction } from "@/components/dashboard/TransactionList";
import { History as HistoryIcon, Download } from "lucide-react";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function HistoryPage() {
    const { transactions, loading } = useTrading();
    const searchParams = useSearchParams();
    const initialType = (searchParams.get("type") as "ALL" | "DEPOSIT" | "WITHDRAW") ?? "ALL";
    const [filter, setFilter] = useState<"ALL" | "DEPOSIT" | "WITHDRAW">(initialType);

    const filteredTransactions = useMemo(() => {
        if (filter === "ALL") return transactions;
        return transactions.filter((tx: Transaction) => tx.type === filter);
    }, [transactions, filter]);

    const handleExport = () => {
        if (transactions.length === 0) {
            toast.error("No transactions to export");
            return;
        }

        const headers = ["ID", "Type", "Amount", "Status", "Date"];
        const rows = transactions.map((tx: Transaction) => [
            tx._id,
            tx.type,
            tx.amount.toString(),
            tx.status,
            new Date(tx.createdAt).toLocaleString()
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", `transaction_history_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Statement exported as CSV");
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 md:space-y-10">
            <header className="flex flex-col gap-6 md:flex-row md:items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-2 flex items-center gap-3 md:gap-4">
                        <HistoryIcon className="text-primary w-6 h-6 md:w-9 md:h-9" />
                        Transaction History
                    </h1>
                    <p className="text-secondary text-base md:text-lg">Review and manage your complete records.</p>
                </div>

                <button
                    onClick={handleExport}
                    className="w-full md:w-auto flex items-center justify-center gap-3 px-6 py-4 bg-primary/10 text-primary hover:bg-primary/20 rounded-2xl font-bold transition-all text-sm"
                >
                    <Download size={18} />
                    Export Statement
                </button>
            </header>

                <div className="bg-secondary/5 border border-secondary/10 rounded-3xl md:rounded-[2.5rem] p-5 md:p-12">
                <div className="mb-8 md:mb-10 flex overflow-x-auto pb-2 gap-3 scrollbar-hide">
                    {[
                        { id: "ALL", label: "All Transactions" },
                        { id: "DEPOSIT", label: "Deposits" },
                        { id: "WITHDRAW", label: "Withdrawals" }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id as any)}
                            className={cn(
                                "whitespace-nowrap px-6 py-2.5 rounded-full text-xs md:text-sm font-bold transition-all shrink-0",
                                filter === tab.id
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-secondary hover:bg-secondary/10"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <TransactionList transactions={filteredTransactions} />
            </div>
        </div>
    );
}
