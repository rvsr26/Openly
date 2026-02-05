"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [token, setToken] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    useEffect(() => {
        const tokenParam = searchParams.get("token");
        if (!tokenParam) {
            toast.error("Invalid reset link");
            router.push("/forgot-password");
        } else {
            setToken(tokenParam);
        }
    }, [searchParams, router]);

    const validatePassword = (pwd: string) => {
        const validationErrors: string[] = [];

        if (pwd.length < 8) {
            validationErrors.push("At least 8 characters long");
        }
        if (!/[A-Z]/.test(pwd)) {
            validationErrors.push("One uppercase letter");
        }
        if (!/[a-z]/.test(pwd)) {
            validationErrors.push("One lowercase letter");
        }
        if (!/[0-9]/.test(pwd)) {
            validationErrors.push("One number");
        }
        if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pwd)) {
            validationErrors.push("One special character");
        }

        setErrors(validationErrors);
        return validationErrors.length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (!validatePassword(password)) {
            toast.error("Password does not meet requirements");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, new_password: password }),
            });

            if (response.ok) {
                toast.success("Password reset successfully!");
                setTimeout(() => {
                    router.push("/login");
                }, 1500);
            } else {
                const data = await response.json();
                toast.error(data.detail || "Failed to reset password");
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 max-w-md w-full"
            >
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-8 h-8 text-blue-600" />
                </div>

                <h1 className="text-3xl font-bold mb-2 text-center">Reset Password</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
                    Enter your new password below
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    validatePassword(e.target.value);
                                }}
                                required
                                className="input-field pr-10"
                                placeholder="Enter new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                            Confirm Password
                        </label>
                        <input
                            type={showPassword ? "text" : "password"}
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="input-field"
                            placeholder="Confirm new password"
                        />
                    </div>

                    {/* Password Requirements */}
                    {password && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2">
                            <p className="text-sm font-medium mb-2">Password must contain:</p>
                            {[
                                { text: "At least 8 characters", valid: password.length >= 8 },
                                { text: "One uppercase letter", valid: /[A-Z]/.test(password) },
                                { text: "One lowercase letter", valid: /[a-z]/.test(password) },
                                { text: "One number", valid: /[0-9]/.test(password) },
                                { text: "One special character", valid: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password) },
                            ].map((req, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                    {req.valid ? (
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-gray-400" />
                                    )}
                                    <span className={req.valid ? "text-green-600" : "text-gray-500"}>
                                        {req.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || errors.length > 0 || password !== confirmPassword}
                        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
