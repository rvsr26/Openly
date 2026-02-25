"use client";

import { useState } from "react";
import { Plus, X, PieChart, Info } from "lucide-react";
import { PollOption, Poll } from "../types"; // Using Poll type slightly modified to represent creation DTO

export interface PollCreateData {
    question: string;
    type: "yesno" | "multiple";
    options: { text: string }[];
    allow_anonymous: boolean;
    ends_at?: string;
}

interface PollBuilderProps {
    pollData: PollCreateData | null;
    setPollData: (data: PollCreateData | null) => void;
}

export default function PollBuilder({ pollData, setPollData }: PollBuilderProps) {
    const [isAdding, setIsAdding] = useState(false);

    // Initialize empty poll form
    const handleEnablePoll = () => {
        setPollData({
            question: "",
            type: "multiple",
            options: [{ text: "" }, { text: "" }],
            allow_anonymous: true
        });
        setIsAdding(true);
    };

    const handleCancel = () => {
        setPollData(null);
        setIsAdding(false);
    };

    const updateQuestion = (q: string) => {
        if (pollData) setPollData({ ...pollData, question: q });
    };

    const setType = (t: "yesno" | "multiple") => {
        if (pollData) setPollData({ ...pollData, type: t });
    };

    const updateOption = (index: number, val: string) => {
        if (pollData) {
            const newOpts = [...pollData.options];
            newOpts[index].text = val;
            setPollData({ ...pollData, options: newOpts });
        }
    };

    const addOption = () => {
        if (pollData && pollData.options.length < 6) {
            setPollData({ ...pollData, options: [...pollData.options, { text: "" }] });
        }
    };

    const removeOption = (index: number) => {
        if (pollData && pollData.options.length > 2) {
            const newOpts = pollData.options.filter((_, i) => i !== index);
            setPollData({ ...pollData, options: newOpts });
        }
    };

    if (!isAdding || !pollData) {
        return (
            <button
                onClick={handleEnablePoll}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors group border border-transparent hover:border-white/10"
            >
                <PieChart size={14} className="group-hover:text-primary transition-colors" />
                Add Poll
            </button>
        );
    }

    return (
        <div className="mt-4 p-5 rounded-2xl bg-black/20 border border-primary/20 relative">
            <button
                onClick={handleCancel}
                className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors p-1 bg-white/5 hover:bg-destructive/10 rounded-full"
            >
                <X size={14} />
            </button>

            <div className="flex items-center gap-2 mb-4">
                <PieChart size={16} className="text-primary" />
                <h4 className="text-sm font-black text-foreground">Create a Poll</h4>
            </div>

            <div className="space-y-4">
                {/* Question */}
                <div>
                    <input
                        type="text"
                        placeholder="Ask a question..."
                        value={pollData.question}
                        onChange={(e) => updateQuestion(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:bg-white/10 transition-all font-bold placeholder:font-medium placeholder:text-muted-foreground/50"
                    />
                </div>

                {/* Type Toggle */}
                <div className="flex bg-white/5 rounded-xl p-1 w-full max-w-xs">
                    <button
                        onClick={() => setType("multiple")}
                        className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-all ${pollData.type === "multiple" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        Multiple Choice
                    </button>
                    <button
                        onClick={() => setType("yesno")}
                        className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-all ${pollData.type === "yesno" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        Yes/No
                    </button>
                </div>

                {/* Options */}
                {pollData.type === "multiple" && (
                    <div className="space-y-2">
                        {pollData.options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="h-10 w-full relative">
                                    <input
                                        type="text"
                                        placeholder={`Option ${i + 1}`}
                                        value={opt.text}
                                        onChange={(e) => updateOption(i, e.target.value)}
                                        className="w-full h-full bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:border-primary/40 focus:bg-white/10 transition-all"
                                    />
                                </div>
                                {pollData.options.length > 2 && (
                                    <button onClick={() => removeOption(i)} className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all">
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        ))}

                        {pollData.options.length < 6 && (
                            <button onClick={addOption} className="w-full py-2.5 flex items-center justify-center gap-2 border border-dashed border-white/20 rounded-xl text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all mt-2">
                                <Plus size={14} /> Add another option
                            </button>
                        )}
                    </div>
                )}

                {/* Settings */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={pollData.allow_anonymous}
                            onChange={(e) => setPollData({ ...pollData, allow_anonymous: e.target.checked })}
                            className="w-4 h-4 rounded appearance-none border border-white/30 checked:bg-primary checked:border-primary transition-all relative after:content-['✓'] after:absolute after:text-white after:text-[10px] after:font-black after:left-[3px] after:top-[-1px] after:hidden checked:after:block"
                        />
                        <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">Allow Anonymous Voting</span>
                    </label>
                </div>
            </div>
        </div>
    );
}
