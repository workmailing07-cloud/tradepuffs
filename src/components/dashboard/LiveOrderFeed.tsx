"use client";

import { useEffect, useState } from "react";
import { Package, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const NAMES = ["James", "Maria", "Alex", "Chen", "Sarah", "Yuki", "Ahmed", "Elena", "Liam", "Sofia"];
const PRODUCTS = ["Luxury Watch", "iPhone 15 Pro", "Crypto Node", "Designer Bag", "Graphics Card", "Gaming Laptop", "Smart TV", "Dyson Airwrap"];

export function LiveOrderFeed() {
    const [activities, setActivities] = useState<any[]>([]);

    useEffect(() => {
        // Initial set
        const initials = Array.from({ length: 5 }).map((_, i) => ({
            id: i,
            name: NAMES[Math.floor(Math.random() * NAMES.length)],
            product: PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)],
            commission: (Math.random() * 5 + 1).toFixed(2),
            time: "Just now"
        }));
        setActivities(initials);

        const interval = setInterval(() => {
            const newActivity = {
                id: Date.now(),
                name: NAMES[Math.floor(Math.random() * NAMES.length)],
                product: PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)],
                commission: (Math.random() * 15 + 2).toFixed(2),
                time: "Just now"
            };
            setActivities(prev => [newActivity, ...prev.slice(0, 4)]);
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                    <TrendingUp size={14} className="text-emerald-500" /> Live Commission Feed
                </h3>
                <div className="flex items-center gap-1.5">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                   <span className="text-[10px] font-bold text-emerald-500 uppercase">Live</span>
                </div>
            </div>

            <div className="space-y-3">
                {activities.map((act) => (
                    <div key={act.id} className="p-3 bg-white dark:bg-zinc-900/50 rounded-2xl border border-black/5 flex items-center justify-between animate-in slide-in-from-left-2 duration-500">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                                <Package size={18} />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold">
                                    <span className="text-primary">{act.name}</span> grabbbed
                                </p>
                                <p className="text-[10px] text-secondary font-medium truncate max-w-[120px]">{act.product}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[11px] font-black text-emerald-500 tracking-tight">+${act.commission}</p>
                            <p className="text-[9px] text-zinc-400 font-bold uppercase">{act.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
