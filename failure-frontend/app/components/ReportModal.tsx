"use client";

import { useState } from "react";
import { X, Flag, Loader2 } from "lucide-react";
import axios from "axios";
import api from "../lib/api";

import { toast } from "sonner";

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetId: string;
    targetType: "post" | "user";
    reporterId: string;
}

export default function ReportModal({
    isOpen,
    onClose,
    targetId,
    targetType,
    reporterId,
}: ReportModalProps) {
    const [reason, setReason] = useState("");
    const [details, setDetails] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const reasons = ["Spam", "Harassment", "Self-Harm", "Inappropriate Content", "Other"];

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!reason) {
            toast.error("Please select a reason for reporting");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post("/reports/", {
                reporter_id: reporterId,
                target_id: targetId,
                target_type: targetType,
                reason: reason,
                details: details,
            });

            toast.success("Thank you for your report. Our team will review it.");
            onClose();
            // Reset state
            setReason("");
            setDetails("");
        } catch (error) {
            console.error("Report submission failed:", error);
            toast.error("Failed to submit report. Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

                {/* HEADER */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/20">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <Flag size={20} className="text-red-500" />
                        </div>
                        <h3 className="font-bold text-lg text-foreground">Report {targetType === 'post' ? 'Post' : 'User'}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-6 space-y-4">
                    <label className="block">
                        <span className="text-sm font-semibold text-muted-foreground block mb-2">Why are you reporting this?</span>
                        <div className="grid grid-cols-1 gap-2">
                            {reasons.map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setReason(r)}
                                    className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${reason === r
                                        ? "border-red-500 bg-red-500/5 text-red-600 font-medium ring-1 ring-red-500"
                                        : "border-border bg-secondary/10 hover:border-muted-foreground/50 text-foreground"
                                        }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </label>

                    <label className="block">
                        <span className="text-sm font-semibold text-muted-foreground block mb-2">Additional details (optional)</span>
                        <textarea
                            className="w-full bg-secondary/10 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground min-h-[100px] resize-none"
                            placeholder="Provide more context..."
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                        />
                    </label>
                </div>

                {/* FOOTER */}
                <div className="p-4 bg-secondary/20 border-t border-border flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-border font-medium hover:bg-secondary transition-colors text-foreground"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !reason}
                        className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Submitting...</span>
                            </>
                        ) : (
                            <span>Submit Report</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
