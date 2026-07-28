"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTrading } from "@/hooks/useTrading";
import type { LucideIcon } from "lucide-react";
import { LogOut, Menu as MenuIcon, X, Shield, Home, Headphones, ShoppingBag, Receipt, User } from "lucide-react";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { NotificationManager } from "@/components/dashboard/NotificationManager";
import { ThemeToggleIcon } from "@/components/ThemeToggle";
import Link from "next/link";
import { cn } from "@/lib/utils";

const MOBILE_NAV: {
    label: string;
    /** Optional second line under label (mobile bottom nav) */
    sublabel?: string;
    icon: LucideIcon;
    href: string;
}[] = [
    { label: "Home", icon: Home, href: "/dashboard/grab" },
    { label: "Service", icon: Headphones, href: "/dashboard/service" },
    { label: "Record", icon: ShoppingBag, href: "/dashboard/grab/records" },
    { label: "Transaction", sublabel: "History", icon: Receipt, href: "/dashboard/history" },
    { label: "Mine", icon: User, href: "/dashboard" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { role } = useTrading();
    const adminNotifications = useAdminNotifications();

    useEffect(() => {
        if (typeof window !== "undefined" && window.innerWidth >= 1024) setIsSidebarOpen(true);
    }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
                e.preventDefault();
                setIsSidebarOpen((p) => !p);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/auth/login");
    }, [status, router]);

    const isLoading = status === "loading";

    const sidebarNav = [
        ...MOBILE_NAV,
        ...(role === "ADMIN" ? [{ label: "Admin", icon: Shield, href: "/dashboard/admin" }] : []),
    ];

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row overflow-hidden pb-16 lg:pb-0">
            <NotificationManager />

            {/* Sidebar — desktop always visible, mobile slide-in */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-secondary/10 flex flex-col p-6 gap-8 transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 shrink-0",
                !isSidebarOpen ? "-translate-x-full lg:-ml-72" : "translate-x-0"
            )}>
                <div className="flex items-center justify-between mb-4">
                    <Link href="/dashboard" className="flex items-center gap-3 px-2 cursor-pointer transition-opacity hover:opacity-80">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20 text-lg">T</div>
                        <span className="text-xl font-bold tracking-tighter">The Trade</span>
                    </Link>
                    <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-secondary hover:bg-secondary/10 rounded-xl transition-colors cursor-pointer lg:hidden">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-hide">
                    <nav className="flex flex-col gap-2">
                        {isLoading ? [1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-secondary/5 animate-pulse">
                                <div className="w-5 h-5 rounded-lg bg-secondary/10" />
                                <div className="h-4 w-24 rounded bg-secondary/10" />
                            </div>
                        )) : sidebarNav.map((item) => (
                            <Link key={item.href} href={item.href}
                                className={cn("flex items-center justify-between px-4 py-3 rounded-2xl font-bold transition-all cursor-pointer",
                                    pathname === item.href ? "bg-primary/10 text-primary shadow-sm" : "text-secondary hover:bg-secondary/5"
                                )}>
                                <div className="flex items-center gap-4">
                                    <item.icon size={20} />
                                    <span>{item.sublabel ? `${item.label} ${item.sublabel}` : item.label}</span>
                                </div>
                                {item.label === "Admin" && adminNotifications.count > 0 && (
                                    <span className="min-w-[20px] h-5 px-1.5 text-[10px] font-black bg-red-500 text-white rounded-full flex items-center justify-center animate-pulse">
                                        {adminNotifications.count}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="pt-4 border-t border-secondary/5 space-y-2">
                    <div className="flex items-center justify-between px-4 py-2">
                        <span className="text-xs font-bold text-secondary uppercase tracking-widest">Appearance</span>
                        <ThemeToggleIcon />
                    </div>
                    <button onClick={() => signOut()}
                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-red-500 hover:bg-red-500/10 transition-all cursor-pointer group">
                        <div className="p-2 bg-red-500/10 rounded-xl group-hover:rotate-12 transition-transform">
                            <LogOut size={18} />
                        </div>
                        <span className="text-sm">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative transition-all duration-300">
                {!isSidebarOpen && (
                    <button onClick={() => setIsSidebarOpen(true)}
                        className="hidden lg:flex fixed top-6 left-6 z-40 p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all cursor-pointer">
                        <MenuIcon size={20} />
                    </button>
                )}
                <div className="p-5 md:p-12 max-w-7xl mx-auto min-h-full">
                    {isLoading ? (
                        <div className="space-y-8">
                            <div className="h-48 rounded-3xl bg-secondary/5 animate-pulse" />
                            <div className="grid grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-2xl bg-secondary/5 animate-pulse" />)}
                            </div>
                            <div className="h-64 rounded-3xl bg-secondary/5 animate-pulse" />
                        </div>
                    ) : children}
                </div>
            </main>

            {/* Mobile Bottom Nav — 5 tabs matching reference */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-secondary/10 px-1 py-2 z-40 flex items-center justify-around gap-0.5 overflow-x-auto scrollbar-hide">
                {isLoading ? [1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-xl bg-secondary/5 animate-pulse shrink-0" />
                )) : sidebarNav.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href}
                            className={cn("relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-[52px] shrink-0 flex-1",
                                isActive ? "text-primary" : "text-secondary"
                            )}>
                            <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                            <span className="text-[8px] font-black uppercase tracking-tight text-center leading-tight max-w-[56px]">
                                {item.sublabel ? (
                                    <>
                                        <span className="block">{item.label}</span>
                                        <span className="block">{item.sublabel}</span>
                                    </>
                                ) : (
                                    item.label
                                )}
                            </span>
                            {item.label === "Admin" && adminNotifications.count > 0 && (
                                <span className="absolute top-1 right-1 min-w-[14px] h-3.5 px-0.5 text-[8px] font-black bg-red-500 text-white rounded-full flex items-center justify-center">
                                    {adminNotifications.count > 9 ? "9+" : adminNotifications.count}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 lg:hidden cursor-pointer"
                    onClick={() => setIsSidebarOpen(false)} />
            )}
        </div>
    );
}
