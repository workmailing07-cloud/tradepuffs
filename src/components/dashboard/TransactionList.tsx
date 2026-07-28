"use client";

export interface Transaction {
    _id: string;
    type: string;
    amount: number;
    createdAt: string;
    status: string;
}

interface TransactionListProps {
    transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
    if (transactions.length === 0) {
        return (
            <div className="p-12 text-center text-secondary bg-secondary/5 rounded-[2rem] border border-dashed border-secondary/20">
                No transactions yet. Start trading!
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold px-2">Recent Activity</h3>
            <div className="space-y-3 px-1 md:px-2">
                {transactions.map((tx) => (
                    <div
                        key={tx._id}
                        className="flex items-center justify-between p-4 md:p-6 bg-secondary/5 border border-secondary/10 rounded-2xl md:rounded-3xl hover:border-secondary/20 transition-all group cursor-pointer"
                    >
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center font-bold text-sm md:text-base ${tx.type === "DEPOSIT" ? "bg-green-500/10 text-green-500" : "bg-primary/10 text-primary"
                                }`}>
                                {tx.type === "DEPOSIT" ? "D" : "W"}
                            </div>
                            <div>
                                <p className="font-bold text-sm md:text-base">{tx.type}</p>
                                <p className="text-[10px] md:text-xs text-secondary">
                                    {new Date(tx.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`font-black text-base md:text-lg ${tx.type === "DEPOSIT" ? "text-green-500" : "text-primary"}`}>
                                {tx.type === "DEPOSIT" ? "+" : "-"}${tx.amount.toLocaleString()}
                            </p>
                            <p className={`text-[9px] md:text-[10px] font-bold tracking-widest uppercase ${
                                tx.status === 'COMPLETED' ? 'text-green-500/80' : 
                                tx.status === 'REJECTED' || tx.status === 'FAILED' ? 'text-red-500/80' : 
                                'text-yellow-500/80'
                            }`}>{tx.status}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
