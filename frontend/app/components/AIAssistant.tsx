"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, X, MessageSquare, Loader2, Bot, User as UserIcon, Wand2 } from 'lucide-react';
import api from '../lib/api';

interface Message {
    role: 'user' | 'model';
    parts: string[];
}

export default function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory, isLoading]);

    const handleSendMessage = async () => {
        if (!message.trim() || isLoading) return;

        const userMsg = message.trim();
        setMessage('');
        setIsLoading(true);

        // Optimistic update
        const newHistory: Message[] = [...chatHistory, { role: 'user', parts: [userMsg] }];
        setChatHistory(newHistory);

        try {
            const res = await api.post('/api/v1/ai/chat', {
                message: userMsg,
                history: chatHistory
            });

            if (res.data.response) {
                setChatHistory(prev => [...prev, { role: 'model', parts: [res.data.response] }]);
            }
        } catch (err) {
            console.error("AI Chat failed:", err);
            setChatHistory(prev => [...prev, { role: 'model', parts: ["Sorry, I'm having trouble connecting right now. 😔"] }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 hover:bg-primary/20 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                            <Bot size={18} />
                        </div>
                        <div className="text-left">
                            <p className="text-[13px] font-black text-foreground">Openly AI</p>
                            <p className="text-[10px] text-muted-foreground">Ask me anything...</p>
                        </div>
                    </div>
                    <Sparkles size={14} className="text-primary animate-pulse" />
                </button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="rounded-3xl border border-primary/20 bg-background/40 backdrop-blur-xl overflow-hidden shadow-2xl shadow-primary/5"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-primary/10 flex items-center justify-between bg-primary/5">
                        <div className="flex items-center gap-2">
                            <Bot size={16} className="text-primary" />
                            <span className="text-xs font-black uppercase tracking-widest text-foreground">AI Assistant</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div
                        ref={scrollRef}
                        className="h-64 overflow-y-auto p-4 space-y-4 scrollbar-hide"
                    >
                        {chatHistory.length === 0 && (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                                    <Wand2 size={24} className="text-primary" />
                                </div>
                                <p className="text-xs font-bold text-foreground mb-1">How can I help you?</p>
                                <p className="text-[10px] text-muted-foreground px-4">I can summarize posts, help you write, or answer questions about Openly.</p>
                            </div>
                        )}

                        {chatHistory.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
                            >
                                {msg.role === 'model' && (
                                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <Bot size={12} className="text-primary" />
                                    </div>
                                )}
                                <div className={`max-w-[85%] p-3 rounded-2xl text-[12px] leading-relaxed ${msg.role === 'user'
                                        ? 'bg-primary text-white rounded-tr-none'
                                        : 'bg-white/5 border border-white/5 text-foreground rounded-tl-none'
                                    }`}>
                                    {msg.parts[0]}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                                        <UserIcon size={12} className="text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start gap-2">
                                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Bot size={12} className="text-primary" />
                                </div>
                                <div className="bg-white/5 border border-white/5 p-3 rounded-2xl rounded-tl-none">
                                    <Loader2 size={12} className="animate-spin text-primary" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-3 border-t border-primary/10 bg-black/20">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type a message..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 pr-10 text-xs focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!message.trim() || isLoading}
                                className="absolute right-1.5 p-1.5 text-primary hover:bg-primary/10 rounded-lg disabled:opacity-30"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
