"use client";

import { cn } from "@/lib/utils";

interface Stat {
    label: string;
    value: string;
    sub?: string;
    accent?: string;
}

interface ProfileStatsProps {
    balance: number;
    totalCommission: number;
    dailyTasksCompleted: number;
    maxDailyTasks: number;
    vipLevel: string;
}

export function ProfileStats({
    balance = 0, totalCommission = 0, dailyTasksCompleted = 0, maxDailyTasks = 25, vipLevel,
}: ProfileStatsProps) {
    const stats: Stat[] = [
        {
            label: "Balance",
            value: (balance ?? 0).toFixed(2),
            sub: "USDT",
            accent: "text-emerald-500",
        },
        {
            label: "VIP Level",
            value: vipLevel,
            sub: "Membership",
            accent: "text-amber-500",
        },
        {
            label: "Total Earned",
            value: (totalCommission ?? 0).toFixed(2),
            sub: "Commission",
            accent: "text-blue-500",
        },
        {
            label: "Tasks Today",
            value: `${dailyTasksCompleted}/${maxDailyTasks}`,
            sub: "Progress",
            accent: "text-primary",
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-3">
            {stats.map(({ label, value, sub, accent }) => (
                <div
                    key={label}
                    className="bg-secondary/5 border border-secondary/10 rounded-3xl p-4 space-y-1"
                >
                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary">{label}</p>
                    <p className={cn("text-xl font-black tabular-nums truncate", accent)}>{value}</p>
                    {sub && <p className="text-[10px] text-secondary font-medium">{sub}</p>}
                </div>
            ))}
        </div>
    );
}
