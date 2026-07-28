"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = await signIn("credentials", {
            email: email.trim().toLowerCase(),
            password,
            redirect: false,
        });

        if (res?.error) {
            setError("Invalid credentials");
            toast.error("Invalid email or password");
            setLoading(false);
        } else {
            toast.success("Welcome back!");
            router.push("/dashboard");
        }
    };

    return (
        <AuthCard title="Welcome Back" subtitle="Log in to your trading account">
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-sm text-center">{error}</div>}

                <div className="space-y-2">
                    <label className="text-sm font-semibold ml-1">Email Address</label>
                    <input
                        type="email"
                        required
                        className="w-full px-6 py-4 bg-secondary/5 border border-secondary/10 rounded-2xl focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold ml-1">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            className="w-full px-6 py-4 bg-secondary/5 border border-secondary/10 rounded-2xl focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none pr-12"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors cursor-pointer"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                <button
                    disabled={loading}
                    type="submit"
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                    {loading ? "Logging in..." : "Login"}
                </button>

                <p className="text-center text-sm text-secondary">
                    Don&apos;t have an account?{" "}
                    <Link href="/auth/signup" className="text-primary font-bold hover:underline cursor-pointer">Sign up</Link>
                </p>
            </form>
        </AuthCard>
    );
}
