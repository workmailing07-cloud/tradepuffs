"use client";

import { Shield, User, Wallet, Bell, Lock, Palette } from "lucide-react";
import { signOut } from "next-auth/react";
import { ThemeTogglePill } from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

const COMING_SOON = [
    { name: "Account Profile", icon: User, description: "Manage your personal information and identity." },
    { name: "Security & Passwords", icon: Shield, description: "Update your login credentials and 2FA." },
    { name: "Wallet Preferences", icon: Wallet, description: "Configure your deposit and withdrawal methods." },
    { name: "Notifications", icon: Bell, description: "Choose what alerts you want to receive." },
];

const THEME_LABELS: Record<string, string> = {
    light: "Light mode — bright and clean.",
    dark: "Dark mode — easier on the eyes.",
    system: "Follows your device setting automatically.",
};

export default function SettingsPage() {
    const { theme } = useTheme();

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-3">Settings</h1>
                    <p className="text-secondary font-medium text-base max-w-lg">
                        Manage your preferences and account controls.
                    </p>
                </div>
            </div>

            {/* Appearance — fully functional */}
            <section className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 rounded-3xl p-6 md:p-8 space-y-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <Palette size={20} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="font-bold text-base">Appearance</h2>
                        <p className="text-xs text-secondary">Choose how The Trade looks for you.</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-white/5">
                    <div>
                        <p className="text-sm font-bold mb-0.5">Color Theme</p>
                        <p className="text-xs text-secondary">{THEME_LABELS[theme]}</p>
                    </div>
                    <ThemeTogglePill />
                </div>
            </section>

            {/* Coming-soon settings grid */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <p className="text-xs font-black uppercase tracking-widest text-secondary">Coming Soon</p>
                    <div className="flex-1 h-px bg-secondary/10" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-40 grayscale pointer-events-none select-none">
                    {COMING_SOON.map((cat, i) => (
                        <div key={i} className={cn(
                            "p-6 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-3xl flex gap-5 blur-[1.5px]"
                        )}>
                            <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center shrink-0">
                                <cat.icon size={22} className="text-secondary" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-base">{cat.name}</h3>
                                <p className="text-sm text-secondary leading-relaxed">{cat.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Sign out */}
            <section className="flex justify-start pt-2">
                <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-500/20 cursor-pointer"
                >
                    <Lock size={16} />
                    Sign Out
                </button>
            </section>
        </div>
    );
}
