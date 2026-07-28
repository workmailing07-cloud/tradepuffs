"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Copy, Check, AlertTriangle, Loader2, CheckCircle2, ExternalLink, Upload } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    requiredAmount?: number;
    /** When true, user already has a PENDING deposit — block another until processed. */
    hasPendingDeposit?: boolean;
    onSubmitPending?: (amount: number, depositAddress: string) => Promise<void>;
    isPending?: boolean;
}

interface AddressData { address: string | null; network: string; }

interface PendingDepositData {
    amount: number;
    depositAddress: string;
}

interface TransactionData {
    type?: string;
    status?: string;
    amount?: number;
    depositAddress?: string;
}

export function DepositModal({ isOpen, onClose, requiredAmount, hasPendingDeposit = false, onSubmitPending, isPending }: DepositModalProps) {
    const [addr, setAddr] = useState<AddressData>({ address: null, network: "TRON (TRC-20)" });
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [amount, setAmount] = useState("");
    const [showQr, setShowQr] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submittedAmount, setSubmittedAmount] = useState(0);
    const [pendingDeposit, setPendingDeposit] = useState<PendingDepositData | null>(null);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
    const [proofSubmitting, setProofSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setSubmitted(false);
            return;
        }
        setAmount("");
        setShowQr(false);
        setSubmitted(false);
        setProofFile(null);
        setProofPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
    }, [isOpen, requiredAmount]);

    useEffect(() => {
        if (!isOpen || !hasPendingDeposit) return;
        setShowQr(true);

        const loadPendingDeposit = async () => {
            setLoading(true);
            try {
                const [addressRes, txRes] = await Promise.all([
                    fetch("/api/deposit/address"),
                    fetch("/api/transactions"),
                ]);
                const addressData = await addressRes.json();
                setAddr(addressData);

                const txData = await txRes.json();
                if (!txRes.ok) return;
                const transactions: TransactionData[] = Array.isArray(txData) ? txData : [];
                const pending = transactions.find((tx) => tx.type === "DEPOSIT" && tx.status === "PENDING");
                if (pending) {
                    const pendingAddress = String(pending.depositAddress || "");
                    setPendingDeposit({
                        amount: Number(pending.amount) || 0,
                        depositAddress: pendingAddress,
                    });
                    if (pendingAddress) {
                        setAddr((current) => ({ ...current, address: pendingAddress }));
                    }
                }
            } catch {
                toast.error("Could not load deposit details");
            } finally {
                setLoading(false);
            }
        };

        void loadPendingDeposit();
    }, [isOpen, hasPendingDeposit]);

    const fetchAddress = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/deposit/address");
            setAddr(await res.json());
        } catch { toast.error("Could not load deposit address"); }
        finally { setLoading(false); }
    };

    const handleCopy = (address = addr.address || "") => {
        if (!address) return;
        navigator.clipboard.writeText(address);
        setCopied(true);
        toast.success("Address copied to clipboard");
        setTimeout(() => setCopied(false), 2500);
    };

    const handleSubmit = async () => {
        if (hasPendingDeposit) {
            toast.info(
                "Your deposit request has been received and is being processed. Please wait until it is completed."
            );
            return;
        }
        const val = Number(amount);
        if (!val || val <= 0) { toast.error("Enter the amount you sent"); return; }
        if (!onSubmitPending) return;
        try {
            await onSubmitPending(val, addr.address ?? "");
            setSubmittedAmount(val);
            setSubmitted(true);
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Submission failed");
        }
    };

    const handleProofFile = (file: File | null) => {
        setProofFile(file);
        if (proofPreviewUrl) URL.revokeObjectURL(proofPreviewUrl);
        setProofPreviewUrl(null);

        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Please choose an image screenshot");
            setProofFile(null);
            return;
        }

        setProofPreviewUrl(URL.createObjectURL(file));
    };

    const submitPaymentProof = async () => {
        if (!proofFile) {
            toast.error("Upload your payment screenshot");
            return;
        }

        const proofAmount = pendingDeposit?.amount || Number(amount) || 0;
        setProofSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("file", proofFile);

            const uploadRes = await fetch("/api/upload/payment-screenshot", { method: "POST", body: formData });
            const uploadJson = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadJson.error || "Upload failed");

            const csRes = await fetch("/api/cs/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "DEPOSIT_HELP",
                    message: proofAmount > 0
                        ? `Payment proof submitted for ${proofAmount.toFixed(2)} USDT (TRC-20).`
                        : "Payment proof submitted for pending deposit.",
                    depositAmount: proofAmount,
                    screenshotUrl: uploadJson.secureUrl,
                    screenshotPublicId: uploadJson.publicId,
                }),
            });
            const csJson = await csRes.json();
            if (!csRes.ok) throw new Error(csJson.error || "Failed to submit payment proof");

            toast.success("Payment proof sent to admin");
            setProofFile(null);
            if (proofPreviewUrl) URL.revokeObjectURL(proofPreviewUrl);
            setProofPreviewUrl(null);
            onClose();
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to submit payment proof");
        } finally {
            setProofSubmitting(false);
        }
    };

    const handleContinueToQr = async () => {
        if (hasPendingDeposit) {
            toast.info(
                "Your deposit request has been received and is being processed. Please wait until it is completed."
            );
            return;
        }
        const val = Number(amount);
        if (!val || val <= 0) { toast.error("Enter deposit amount first"); return; }
        setShowQr(true);
        if (!addr.address && !loading) {
            await fetchAddress();
        }
    };

    if (!isOpen) return null;

    const paymentAddress = pendingDeposit?.depositAddress || addr.address || "";
    const displayAmount = hasPendingDeposit
        ? (pendingDeposit?.amount ?? 0)
        : Number(amount) || 0;
    const inPaymentView = showQr || hasPendingDeposit;

    /* ── Success / Submitted state ── */
    if (submitted) {
        return (
            <div className="fixed inset-0 z-110 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-t-[2.5rem] sm:rounded-4xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
                    <div className="px-6 py-4 flex items-center justify-between border-b border-black/5 dark:border-white/5">
                        <button onClick={onClose} className="p-2 -ml-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"><ChevronLeft size={24} /></button>
                        <h2 className="text-lg font-bold">Deposit</h2>
                        <div className="w-10" />
                    </div>
                    <div className="p-8 flex flex-col items-center gap-5 text-center">
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
                            <CheckCircle2 size={44} className="text-green-500" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black">Request Submitted!</h3>
                            <p className="text-secondary text-sm">Your deposit of <span className="font-black text-green-500">{submittedAmount.toFixed(2)} USDT</span> is pending admin approval.</p>
                        </div>
                        <div className="w-full bg-amber-500/10 border border-amber-400/20 rounded-2xl p-4 text-left space-y-2">
                            <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">Next steps</p>
                            <ol className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                                <li>Screenshot your USDT transfer confirmation.</li>
                                <li>Send it to <strong>Customer Service</strong> for faster approval.</li>
                                <li>Admin will verify on the blockchain and credit your account.</li>
                            </ol>
                        </div>
                        <div className="w-full grid grid-cols-2 gap-3">
                            <Link href="/dashboard/service" onClick={onClose}
                                className="flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-2xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer">
                                <ExternalLink size={15} /> Contact CS
                            </Link>
                            <Link href="/dashboard/history?type=DEPOSIT" onClick={onClose}
                                className="flex items-center justify-center gap-2 py-3.5 bg-secondary/10 text-foreground rounded-2xl font-bold text-sm hover:bg-secondary/20 active:scale-[0.98] transition-all cursor-pointer">
                                View Records
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Main QR / Payment state ── */
    return (
        <div className="fixed inset-0 z-110 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-950 w-full max-w-md flex flex-col rounded-t-[2.5rem] sm:rounded-4xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-500 max-h-[95vh]">

                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-black/5 dark:border-white/5 shrink-0">
                    <button onClick={onClose} className="p-2 -ml-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"><ChevronLeft size={24} /></button>
                    <h2 className="text-lg font-bold">Deposit</h2>
                    <div className="w-10" />
                </div>

                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                    {/* Amount + network (reference layout) */}
                    <div className="text-center space-y-1">
                        {!hasPendingDeposit && (
                            <p className="text-sm font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 leading-none">
                                {inPaymentView ? "Step 2" : "Step 1"}
                            </p>
                        )}
                        {displayAmount > 0 && (
                            <p className="text-5xl font-black tracking-tight text-foreground leading-none pt-1">
                                {displayAmount % 1 === 0 ? displayAmount.toFixed(0) : displayAmount.toFixed(2)}
                            </p>
                        )}
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                            Network - {addr.network}
                        </p>
                    </div>

                    {(hasPendingDeposit || (requiredAmount && requiredAmount > 0)) && (
                        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl">
                            <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-600 dark:text-red-400 font-semibold leading-relaxed">
                                {requiredAmount && requiredAmount > 0
                                    ? "You have an order that has not been paid"
                                    : "Your deposit request is in progress. Send payment proof after you transfer."}
                            </p>
                        </div>
                    )}

                    {!inPaymentView ? (
                        <div className="space-y-3 pt-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Enter deposit amount (USDT)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">$</span>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full pl-9 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold text-base focus:border-primary/50 outline-none transition-all"
                                />
                            </div>
                            <button
                                onClick={() => void handleContinueToQr()}
                                disabled={!amount}
                                className={cn("w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer", !amount && "opacity-50")}
                            >
                                Continue to QR
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col items-center gap-4">
                                <p className="text-sm text-amber-600 dark:text-amber-400 font-bold tracking-wide">
                                    One Time Address:
                                </p>

                                {loading ? (
                                    <div className="w-52 h-52 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                                        <Loader2 className="animate-spin text-zinc-400" size={32} />
                                    </div>
                                ) : paymentAddress ? (
                                    <div className="p-4 bg-white rounded-2xl shadow-md border border-black/5">
                                        <QRCodeSVG value={paymentAddress} size={200} level="H" includeMargin={false} />
                                    </div>
                                ) : (
                                    <div className="w-52 h-52 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 text-xs text-center px-6">
                                        No deposit address configured yet.<br />Contact support.
                                    </div>
                                )}

                                {paymentAddress && (
                                    <div className="flex items-center gap-2 w-full max-w-sm px-1">
                                        <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 flex-1 break-all leading-relaxed text-center">
                                            {paymentAddress}
                                        </span>
                                        <button
                                            onClick={() => handleCopy(paymentAddress)}
                                            className="p-2 shrink-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                                        >
                                            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                        </button>
                                    </div>
                                )}

                                <p className="text-base font-bold text-zinc-500 dark:text-zinc-400">Waiting for payment...</p>
                            </div>

                            {hasPendingDeposit ? (
                                <div className="space-y-3">
                                    <input
                                        id="deposit-proof-input"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleProofFile(e.target.files?.[0] ?? null)}
                                    />
                                    {proofPreviewUrl && (
                                        <div className="relative w-full h-40 rounded-2xl border border-secondary/10 bg-background overflow-hidden">
                                            <Image src={proofPreviewUrl} alt="Payment proof preview" fill className="object-contain" unoptimized />
                                        </div>
                                    )}
                                    {!proofFile ? (
                                        <label
                                            htmlFor="deposit-proof-input"
                                            className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                                        >
                                            <Upload size={18} />
                                            Send Payment Proof
                                        </label>
                                    ) : (
                                        <button
                                            onClick={() => void submitPaymentProof()}
                                            disabled={proofSubmitting}
                                            className={cn(
                                                "w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer",
                                                proofSubmitting && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            {proofSubmitting ? "Sending..." : "Send Payment Proof"}
                                        </button>
                                    )}
                                </div>
                            ) : onSubmitPending ? (
                                <div className="space-y-3 pt-2 border-t border-black/5 dark:border-white/5">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isPending || !paymentAddress || !amount}
                                        className={cn(
                                            "w-full py-4 bg-green-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-500/20 hover:bg-green-600 active:scale-[0.98] transition-all cursor-pointer",
                                            (isPending || !paymentAddress || !amount) && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        {isPending ? "Submitting..." : "I Have Paid — Submit Request"}
                                    </button>
                                </div>
                            ) : null}
                        </>
                    )}

                    {/* Tips */}
                    <div className="pb-4 space-y-2.5">
                        <h4 className="text-sm font-black">Tips:</h4>
                        <ol className="list-decimal list-inside space-y-2">
                            {[
                                <>The recharge address is a <span className="text-amber-600 dark:text-amber-400 font-bold">one-time address</span>, do not transfer repeatedly.</>,
                                <>Minimum recharge not less than <span className="text-amber-600 dark:text-amber-400 font-bold">10 USDT</span>.</>,
                                <>After recharging, it takes about <span className="text-amber-600 dark:text-amber-400 font-bold">1 to 2</span> minutes to arrive.</>,
                                "Send your payment screenshot to customer service to speed up approval.",
                            ].map((tip, i) => (
                                <li key={i} className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{tip}</li>
                            ))}
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}
