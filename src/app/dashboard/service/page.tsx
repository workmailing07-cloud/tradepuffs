"use client";

import { useEffect, useState } from "react";
import { Headphones, MessageCircle, Clock, Shield, ArrowLeft, Upload, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";

const SUPPORT_ITEMS = [
    {
        icon: MessageCircle,
        bg: "bg-blue-500/10",
        color: "text-blue-500",
        title: "Live Chat Support",
        desc: "Chat with our support team for instant help.",
    },
    {
        icon: Clock,
        bg: "bg-emerald-500/10",
        color: "text-emerald-500",
        title: "Available 24 / 7",
        desc: "Our customer service team is always ready to help you.",
    },
    {
        icon: Shield,
        bg: "bg-amber-500/10",
        color: "text-amber-500",
        title: "Secure & Trusted",
        desc: "All transactions and requests are handled with full security.",
    },
];

export default function ServicePage() {
    const router = useRouter();
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [telegramUsername, setTelegramUsername] = useState("");

    const telegramUrl = telegramUsername ? `https://t.me/${telegramUsername}` : "";

    useEffect(() => {
        void (async () => {
            try {
                const res = await fetch("/api/support/contact");
                if (!res.ok) return;
                const json = await res.json();
                const usernameFromApi = String(json?.telegramUsername || "").trim();
                const urlFromApi = String(json?.telegramUrl || "").trim();
                const usernameFromUrl = urlFromApi
                    .replace(/^https?:\/\/t\.me\//i, "")
                    .replace(/^@/, "")
                    .split(/[/?#]/)[0]
                    .trim();
                setTelegramUsername(usernameFromApi || usernameFromUrl);
            } catch {
                // Ignore contact fetch errors to avoid blocking service form.
            }
        })();
    }, []);

    const onPickFile = (f: File | null) => {
        setFile(f);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPreviewError(null);
        if (!f) return;
        if (!f.type.startsWith("image/")) {
            setPreviewError("Please choose an image file (PNG/JPG).");
            return;
        }
        const url = URL.createObjectURL(f);
        setPreviewUrl(url);
    };

    const submitPaymentProof = async () => {
        const val = Number(amount);
        if (!val || val <= 0) { toast.error("Enter the amount you paid"); return; }
        if (!file) { toast.error("Upload your payment screenshot"); return; }

        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const up = await fetch("/api/upload/payment-screenshot", { method: "POST", body: fd });
            const upJson = await up.json();
            if (!up.ok) throw new Error(upJson.error || "Upload failed");

            const cs = await fetch("/api/cs/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "DEPOSIT_HELP",
                    message: note.trim() || `Payment proof submitted for ${val.toFixed(2)} USDT (TRC-20).`,
                    depositAmount: val,
                    screenshotUrl: upJson.secureUrl,
                    screenshotPublicId: upJson.publicId,
                }),
            });
            const csJson = await cs.json();
            if (!cs.ok) throw new Error(csJson.error || "Failed to submit request");

            toast.success("Submitted! Admin will review your payment screenshot.");
            setAmount("");
            setNote("");
            setFile(null);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Submission failed";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto px-4 py-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()}
                    className="p-3 bg-secondary/10 hover:bg-secondary/20 rounded-full text-secondary transition-all cursor-pointer">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Customer Service</h1>
                    <p className="text-secondary text-xs font-medium">We&apos;re here to help you</p>
                </div>
            </div>

            <div className="flex flex-col items-center gap-4 py-10 bg-secondary/5 rounded-4xl border border-secondary/10">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center">
                    <Headphones className="text-primary" size={40} />
                </div>
                <div className="text-center space-y-1">
                    <p className="font-black text-lg">How can we help?</p>
                    <p className="text-secondary text-sm max-w-[240px] leading-relaxed">
                        After paying, upload your payment screenshot here so admin can verify faster.
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                <div className="p-5 bg-secondary/5 border border-secondary/10 rounded-3xl space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Amount paid (USDT)</p>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-bold">$</span>
                        <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number"
                            className="w-full pl-10 pr-4 py-3.5 bg-background border border-secondary/10 rounded-2xl font-bold focus:border-primary/50 outline-none transition-all" placeholder="0.00" />
                    </div>
                </div>

                <div className="p-5 bg-secondary/5 border border-secondary/10 rounded-3xl space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Payment screenshot</p>
                    <label className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-secondary/20 rounded-2xl cursor-pointer hover:bg-secondary/5 transition-colors">
                        <Upload size={18} className="text-primary" />
                        <span className="text-sm font-bold text-primary">{file ? "Change image" : "Choose image"}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => onPickFile(e.target.files?.[0] ?? null)} />
                    </label>
                    {previewError && <p className="text-xs text-red-500 font-bold">{previewError}</p>}
                    {previewUrl && !previewError && (
                        <div className="relative w-full h-56 rounded-2xl border border-secondary/10 bg-background overflow-hidden">
                            <Image src={previewUrl} alt="Preview" fill className="object-contain" unoptimized />
                        </div>
                    )}
                </div>

                <div className="p-5 bg-secondary/5 border border-secondary/10 rounded-3xl space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Note (optional)</p>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
                        className="w-full px-4 py-3 bg-background border border-secondary/10 rounded-2xl text-sm focus:border-primary/50 outline-none transition-all resize-none"
                        placeholder="Transaction hash, time, or any extra info..." />
                </div>

                <button onClick={submitPaymentProof} disabled={submitting}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer">
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />}
                    {submitting ? "Submitting..." : "Submit Payment Proof"}
                </button>
            </div>

            <div className="space-y-3">
                {SUPPORT_ITEMS.map(({ icon: Icon, bg, color, title, desc }) => (
                    <div key={title} className="flex items-start gap-4 p-5 bg-secondary/5 border border-secondary/10 rounded-3xl">
                        <div className={`w-10 h-10 rounded-2xl ${bg} flex items-center justify-center shrink-0`}>
                            <Icon size={20} className={color} />
                        </div>
                        <div>
                            <p className="font-bold text-sm mb-0.5">{title}</p>
                            <p className="text-xs text-secondary leading-relaxed">{desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {telegramUrl ? (
                <a
                    href={telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fixed bottom-24 right-5 z-50 rounded-full bg-[#229ED9] text-white px-4 py-3 shadow-lg shadow-[#229ED9]/30 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                    title={`Contact with Customer Support - Telegram (@${telegramUsername})`}
                >
                    <MessageCircle size={18} />
                    <span className="text-sm font-bold">Contact with Customer Support - Telegram</span>
                </a>
            ) : null}
        </div>
    );
}
