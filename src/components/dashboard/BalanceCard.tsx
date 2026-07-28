"use client";

import { Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface BalanceCardProps {
    balance: number;
}

export function BalanceCard({ balance }: BalanceCardProps) {
    return (
        <div className="p-8 rounded-[2rem] bg-gradient-to-br from-primary to-blue-600 text-white shadow-2xl shadow-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Wallet size={120} />
            </div>

            <div className="relative">
                <p className="text-white/80 font-medium mb-2">Available Balance</p>
                <h2 className="text-5xl font-black tracking-tight mb-8">
                    ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h2>

                <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl text-sm font-bold">
                        <ArrowUpRight size={16} className="text-green-300" />
                        +12.5% Inc
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl text-sm font-bold">
                        <ArrowDownLeft size={16} className="text-blue-200" />
                        Withdrawal Ready
                    </div>
                </div>
            </div>
        </div>
    );
}
