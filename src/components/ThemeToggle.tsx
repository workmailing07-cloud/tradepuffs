"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type Theme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Theme; icon: React.ElementType; label: string }[] = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "system", icon: Monitor, label: "System" },
    { value: "dark", icon: Moon, label: "Dark" },
];

/** Compact icon-only toggle — cycles light → system → dark */
export function ThemeToggleIcon({ className }: { className?: string }) {
    const { theme, setTheme } = useTheme();

    function cycle() {
        const order: Theme[] = ["light", "system", "dark"];
        const next = order[(order.indexOf(theme) + 1) % order.length];
        setTheme(next);
    }

    const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[1];
    const Icon = current.icon;

    return (
        <button
            onClick={cycle}
            title={`Theme: ${current.label}`}
            aria-label="Toggle theme"
            className={cn(
                "p-2 rounded-xl hover:bg-white/10 dark:hover:bg-white/10 transition-colors cursor-pointer",
                className
            )}
        >
            <Icon size={18} />
        </button>
    );
}

/** Full segmented pill — shows all three options */
export function ThemeTogglePill({ className }: { className?: string }) {
    const { theme, setTheme } = useTheme();

    return (
        <div
            className={cn(
                "inline-flex items-center gap-1 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700",
                className
            )}
        >
            {OPTIONS.map(({ value, icon: Icon, label }) => {
                const active = theme === value;
                return (
                    <button
                        key={value}
                        onClick={() => setTheme(value)}
                        title={label}
                        aria-label={label}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                            active
                                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                        )}
                    >
                        <Icon size={13} />
                        <span>{label}</span>
                    </button>
                );
            })}
        </div>
    );
}
