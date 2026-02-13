"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, ArrowRight, Lock, Loader2 } from "lucide-react";
import api from "@/app/lib/api";
import { useAuth } from "@/context/AuthContext";

import { Suspense } from "react";

function MFAContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const uid = searchParams.get("uid");
    const { refreshSession } = useAuth();

    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!uid) {
            router.push("/login");
        }
        // Focus first input
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [uid, router]);

    const handleInput = (index: number, value: string) => {
        // Allow only numbers
        if (value && !/^\d+$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            // Focus previous on backspace if empty
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === "Enter" && index === 5) {
            verifyCode();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").trim();
        if (!/^\d{6}$/.test(pastedData)) return;

        const newCode = pastedData.split("");
        setCode(newCode);
        inputRefs.current[5]?.focus();
        // Optional: auto-submit
    };

    const verifyCode = async () => {
        const fullCode = code.join("");
        if (fullCode.length !== 6) return;

        setLoading(true);
        setError("");

        try {
            const res = await api.post("/auth/2fa/verify-login", {
                user_id: uid,
                code: fullCode
            });

            if (res.data.access_token) {
                localStorage.setItem("token", res.data.access_token);
                await refreshSession();
                router.push("/");
            }
        } catch (err: any) {
            console.error(err);
            setError("Invalid verification code. Please try again.");
            setCode(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">

            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md p-8 glass-card border border-primary/20 shadow-2xl relative z-10"
            >
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary ring-4 ring-primary/5">
                        <Shield size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight">Two-Factor Authentication</h1>
                    <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                        Enter the 6-digit code from your authenticator app to verify your identity.
                    </p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center flex items-center justify-center gap-2"
                    >
                        <Lock size={14} /> {error}
                    </motion.div>
                )}

                <div className="flex justify-center gap-2 mb-8">
                    {code.map((digit, idx) => (
                        <input
                            key={idx}
                            ref={(el) => { inputRefs.current[idx] = el }}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleInput(idx, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(idx, e)}
                            onPaste={handlePaste}
                            className="w-12 h-14 text-center text-xl font-bold bg-background/50 border border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/20"
                            placeholder="0"
                        />
                    ))}
                </div>

                <button
                    onClick={verifyCode}
                    disabled={loading || code.some(c => !c)}
                    className="btn-primary w-full py-3 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={16} /> Verifying...
                        </>
                    ) : (
                        <>
                            Verify Login <ArrowRight size={16} />
                        </>
                    )}
                </button>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.push('/login')}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Back to Login
                    </button>
                </div>

            </motion.div>
        </div>
    );
}

export default function MFAPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
            <MFAContent />
        </Suspense>
    );
}
