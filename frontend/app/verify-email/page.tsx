"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    const verifyEmail = async (token: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/verify-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus("success");
                setMessage("Email verified successfully! Redirecting...");

                // Redirect to login or home after 2 seconds
                setTimeout(() => {
                    router.push("/login");
                }, 2000);
            } else {
                setStatus("error");
                setMessage(data.detail || "Verification failed");
            }
        } catch (error) {
            setStatus("error");
            setMessage("An error occurred. Please try again.");
        }
    };

    useEffect(() => {
        const token = searchParams.get("token");

        if (!token) {
            setTimeout(() => {
                setStatus("error");
                setMessage("Invalid verification link");
            }, 0);
            return;
        }

        setTimeout(() => verifyEmail(token), 0);
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 max-w-md w-full text-center"
            >
                {status === "loading" && (
                    <>
                        <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-spin" />
                        <h1 className="text-2xl font-bold mb-2">Verifying Email...</h1>
                        <p className="text-gray-600 dark:text-gray-400">Please wait while we verify your email address.</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
                        <h1 className="text-2xl font-bold mb-2 text-green-600">Email Verified!</h1>
                        <p className="text-gray-600 dark:text-gray-400">{message}</p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <XCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
                        <h1 className="text-2xl font-bold mb-2 text-red-600">Verification Failed</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
                        <button
                            onClick={() => router.push("/login")}
                            className="btn-primary"
                        >
                            Go to Login
                        </button>
                    </>
                )}
            </motion.div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-16 h-16 mx-auto text-blue-600 animate-spin" /> Verifying...</div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}
