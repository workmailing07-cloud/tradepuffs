"use client";

import { useTrading } from "@/hooks/useTrading";
import { cn } from "@/lib/utils";

export function GrabStats() {
    const { balance, dailyCommission, dailyTasksCompleted, status } = useTrading();

    const potentialProfit = balance > 0
        ? (balance * 0.01 < 0.01 ? (balance * 0.01).toFixed(4) : (balance * 0.01).toFixed(2))
        : "0.00";

    return (
        <div className="grid grid-cols-2 gap-y-6 gap-x-4 bg-white dark:bg-zinc-900 rounded-4xl p-7 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-2xl relative overflow-hidden group cursor-pointer">
            {/* Subtle amber glow — visible in both modes */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/8 blur-[60px] rounded-full pointer-events-none group-hover:bg-amber-500/15 transition-all duration-700" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/5 blur-[60px] rounded-full pointer-events-none" />

            <div className="space-y-1 relative z-10 text-center border-r border-zinc-100 dark:border-white/5">
                <p className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase tracking-widest font-black">Total Earnings</p>
                <p className="text-2xl font-black text-amber-500">
                    ${dailyCommission.toFixed(2)}
                </p>
            </div>

            <div className="space-y-1 relative z-10 text-center">
                <p className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase tracking-widest font-black">Wallet Balance</p>
                <p className="text-2xl font-black text-zinc-900 dark:text-white hover:scale-105 transition-transform">
                    ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
            </div>

            <div className="space-y-1 mt-4 relative z-10 text-center border-r border-zinc-100 dark:border-white/5">
                <p className="text-amber-500/70 text-[10px] uppercase tracking-widest font-black">Estimated Next</p>
                <p className="text-lg font-black text-amber-500 animate-pulse">
                    +${potentialProfit}
                </p>
            </div>

            <div className="space-y-1 mt-4 relative z-10 text-center">
                <p className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase tracking-widest font-black">Status</p>
                <div className="flex items-center justify-center gap-1.5">
                    <div className={cn(
                        "w-2 h-2 rounded-full animate-ping",
                        status === "ACTIVE" ? "bg-green-500" : "bg-amber-500"
                    )} />
                    <p className={cn(
                        "text-sm font-black tracking-tighter",
                        status === "ACTIVE" ? "text-green-500" : "text-amber-500"
                    )}>
                        {status === "PENDING_COMBO" ? "COMBO WAITING" : status || "ACTIVE"}
                    </p>
                </div>
            </div>
        </div>
    );
}
