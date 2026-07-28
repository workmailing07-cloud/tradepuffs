"use client";

import { Wallet, ArrowDownUp, MessageCircle } from "lucide-react";
import Link from "next/link";

interface ProfileHeaderProps {
    name: string;
    balance: number;
    invitationCode?: string;
    onDeposit: () => void;
    onWithdraw: () => void;
}

function getVipLevel(balance: number): string {
    if (balance >= 10000) return "VIP 4";
    if (balance >= 5000) return "VIP 3";
    if (balance >= 1000) return "VIP 2";
    return "VIP 1";
}

export function ProfileHeader({ name, balance, invitationCode, onDeposit, onWithdraw }: ProfileHeaderProps) {
    const initials = name.slice(0, 2).toUpperCase();
    const inviteCode = invitationCode || "------";
    const vipLevel = getVipLevel(balance);

    return (
        <div className="-mx-5 -mt-5 md:-mx-12 md:-mt-12 bg-linear-to-b from-[#7a2222] via-[#6b1e1e] to-[#561616] text-white px-6 pt-10 pb-8 rounded-b-[2.5rem]">
            {/* Top row */}
            <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-2xl font-black shadow-xl">
                        {initials}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-black tracking-tight">{name}</span>
                            <span className="px-2 py-0.5 bg-amber-400 text-black text-[10px] font-black rounded-full tracking-wider shadow-sm">
                                {vipLevel}
                            </span>
                        </div>
                        <p className="text-white/60 text-xs font-medium">
                            Invitation code: <span className="text-white/80 font-bold">{inviteCode}</span>
                        </p>
                    </div>
                </div>

                <Link
                    href="/dashboard/service"
                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-90"
                >
                    <MessageCircle size={20} />
                </Link>
            </div>

            {/* Balance */}
            <div className="mb-7">
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">My Account</p>
                <p className="text-3xl font-black tracking-tight">
                    USDT{" "}
                    <span className="tabular-nums">{balance.toFixed(4)}</span>
                </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
                <button
                    onClick={onDeposit}
                    className="flex-1 flex flex-col items-center gap-2 py-4 bg-white/10 hover:bg-white/20 active:scale-95 rounded-2xl transition-all cursor-pointer"
                >
                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <Wallet size={20} />
                    </div>
                    <span className="text-xs font-bold">Deposit</span>
                </button>
                <button
                    onClick={onWithdraw}
                    className="flex-1 flex flex-col items-center gap-2 py-4 bg-white/10 hover:bg-white/20 active:scale-95 rounded-2xl transition-all cursor-pointer"
                >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <ArrowDownUp size={20} />
                    </div>
                    <span className="text-xs font-bold">Withdrawal</span>
                </button>
            </div>
        </div>
    );
}
