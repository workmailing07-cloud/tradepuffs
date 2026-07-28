"use client";

interface AuthCardProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

export function AuthCard({ children, title, subtitle }: AuthCardProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-6">
            {/* Background Decorative Elements */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/20 rounded-full blur-[100px]" />

            <div className="w-full max-w-md relative animate-in fade-in zoom-in duration-750">
                <div className="bg-secondary/5 backdrop-blur-xl border border-secondary/10 p-10 rounded-[2.5rem] shadow-2xl">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold tracking-tight mb-3">{title}</h1>
                        <p className="text-secondary">{subtitle}</p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
