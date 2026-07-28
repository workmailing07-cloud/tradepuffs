"use client";

import { cn } from "@/lib/utils";
import { Package } from "lucide-react";

const S = 294;           // total SVG / container size
const C = S / 2;         // center
const RING_R = 128;      // progress ring radius
const ORBIT_R = 106;     // orbit icons radius

interface GrabButtonProps {
    busy: boolean;
    completed: number;
    total: number;
    onClick: () => void;
    products?: Array<{ _id?: string; name: string; image: string }>;
    hoveredName?: string | null;
    onHoverName?: (name: string | null) => void;
}

export function GrabButton({
    busy,
    completed,
    total,
    onClick,
    products = [],
    hoveredName,
    onHoverName,
}: GrabButtonProps) {
    const progress = total > 0 ? Math.min(completed / total, 1) : 0;
    const circ = 2 * Math.PI * RING_R;
    const offset = circ * (1 - progress);

    return (
        <div className="relative flex items-center justify-center mx-auto" style={{ width: S, height: S }}>

            {/* Progress ring */}
            <svg width={S} height={S} className="absolute inset-0 pointer-events-none">
                {/* Track */}
                <circle cx={C} cy={C} r={RING_R} fill="none"
                    stroke="rgba(100,116,139,0.12)" strokeWidth={7} />
                {/* Arc — only rendered when there's progress */}
                {progress > 0 && (
                    <circle cx={C} cy={C} r={RING_R} fill="none"
                        stroke="#f59e0b" strokeWidth={7} strokeLinecap="round"
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                        transform={`rotate(-90 ${C} ${C})`}
                        style={{ transition: "stroke-dashoffset 0.7s ease" }} />
                )}
                {/* Dot at progress end */}
                {progress > 0 && progress < 1 && (() => {
                    const a = (progress * 360 - 90) * (Math.PI / 180);
                    return (
                        <circle cx={C + RING_R * Math.cos(a)} cy={C + RING_R * Math.sin(a)}
                            r={5} fill="#f59e0b" />
                    );
                })()}
            </svg>

            {/* Orbit product icons */}
            {products.map((product, i) => {
                const angle = (i / Math.max(products.length, 1)) * 360 - 90;
                const rad = (angle * Math.PI) / 180;
                const x = C + ORBIT_R * Math.cos(rad) - 20;
                const y = C + ORBIT_R * Math.sin(rad) - 20;
                return (
                    <div
                        key={product._id || `${product.name}-${i}`}
                        className="absolute w-10 h-10 bg-white dark:bg-zinc-800 rounded-2xl shadow-md flex items-center justify-center border border-black/5 dark:border-white/5 overflow-hidden"
                        style={{ left: x, top: y }}
                        onMouseEnter={() => onHoverName?.(product.name)}
                        onMouseLeave={() => onHoverName?.(null)}
                        onTouchStart={() => onHoverName?.(product.name)}
                        title={product.name}
                    >
                        {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <Package size={17} className="text-primary" strokeWidth={1.5} />
                        )}
                    </div>
                );
            })}

            {/* Idle glow rings */}
            {!busy && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-40 h-40 rounded-full bg-amber-500/15 animate-ping"
                        style={{ animationDuration: "2.8s" }} />
                    <div className="absolute w-32 h-32 rounded-full bg-amber-500/10 animate-ping"
                        style={{ animationDuration: "2.2s", animationDelay: "0.5s" }} />
                </div>
            )}

            {/* Central tap button */}
            <button onClick={onClick} disabled={busy}
                className={cn(
                    "absolute rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 cursor-pointer border-[6px] border-background z-10",
                    busy
                        ? "w-24 h-24 bg-amber-400/40 scale-90 cursor-not-allowed shadow-none"
                        : "w-28 h-28 bg-linear-to-br from-amber-300 to-amber-500 hover:scale-110 active:scale-95 shadow-amber-500/40"
                )}>
                {busy ? (
                    <div className="w-7 h-7 border-2 border-black/20 border-t-black/80 rounded-full animate-spin" />
                ) : (
                    <div className="text-center text-black select-none">
                        <p className="text-2xl font-black leading-none tracking-tight">TAP</p>
                        <p className="text-[9px] font-black opacity-50 uppercase tracking-widest mt-0.5">
                            {hoveredName ? hoveredName.slice(0, 16) : "to grab"}
                        </p>
                    </div>
                )}
            </button>
        </div>
    );
}
