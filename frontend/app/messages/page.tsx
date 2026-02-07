'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { Conversation, Message } from '../types';
import UserSearchModal from '../components/UserSearchModal';
import { useWebSocket } from '../lib/useWebSocket';
import { decryptMessage, encryptMessage, generateConversationKey } from '../lib/encryption';
import {
    Plus, Search, Send, MoreVertical, Phone, Video,
    Info, Image as ImageIcon, Smile, Paperclip,
    MessageCircle, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import api from '../lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function MessagesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const targetUserId = searchParams.get('user');

    const [currentUser, setCurrentUser] = useState<any>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Modal State
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const { isConnected, lastMessage } = useWebSocket(currentUser?.uid || null);

    // Auth check
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
            } else {
                router.push('/login');
            }
        });
        return () => unsubscribe();
    }, [router]);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch conversations
    useEffect(() => {
        if (!currentUser) return;

        const fetchConversations = async () => {
            try {
                const response = await fetch(`${API_URL}/conversations/?user_id=${currentUser.uid}`);
                if (response.ok) {
                    const data = await response.json();

                    // Decrypt last messages
                    const decryptedData = data.map((conv: any) => {
                        const otherUserId = conv.participants.find((id: string) => id !== currentUser.uid);
                        if (otherUserId) {
                            try {
                                const key = generateConversationKey(currentUser.uid, otherUserId);
                                const decryptedPreview = decryptMessage(conv.last_message, key);
                                return { ...conv, last_message: decryptedPreview };
                            } catch (e) {
                                return conv; // Keep original if decrypt fails (e.g. system message)
                            }
                        }
                        return conv;
                    });

                    setConversations(decryptedData);

                    if (targetUserId) {
                        handleSelectUser(targetUserId, decryptedData);
                    } else if (decryptedData.length > 0 && !activeConversation) {
                        // Don't auto-select on mobile to show list first, but for now auto-select is fine for desktop
                        // setActiveConversation(decryptedData[0]); 
                    }
                }
            } catch (error) {
                console.error('Failed to fetch conversations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConversations();
    }, [currentUser, targetUserId]);

    const handleSelectUser = async (userId: string, currentConvs = conversations) => {
        if (!currentUser) return;
        const existing = currentConvs.find((conv: Conversation) =>
            conv.participants.includes(userId)
        );

        if (existing) {
            setActiveConversation(existing);
            setIsSearchOpen(false);
        } else {
            try {
                const createResponse = await fetch(`${API_URL}/conversations/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: currentUser.uid,
                        target_user_id: userId
                    })
                });

                if (createResponse.ok) {
                    const newConv = await createResponse.json();
                    setConversations([newConv, ...currentConvs]);
                    setActiveConversation(newConv);
                    setIsSearchOpen(false);
                }
            } catch (e) {
                console.error("Failed to create conversation", e);
            }
        }
    };

    // Fetch messages
    useEffect(() => {
        if (!activeConversation || !currentUser) return;

        const fetchMessages = async () => {
            setIsLoadingMessages(true);
            try {
                const response = await fetch(
                    `${API_URL}/conversations/${activeConversation.id}/messages`
                );
                if (response.ok) {
                    const data = await response.json();
                    const otherUserId = activeConversation.participants.find(p => p !== currentUser.uid);
                    let decryptedMessages = data;

                    if (otherUserId) {
                        const key = generateConversationKey(currentUser.uid, otherUserId);
                        decryptedMessages = data.map((msg: Message) => ({
                            ...msg,
                            content: decryptMessage(msg.content, key)
                        }));
                    }

                    setMessages(decryptedMessages);

                    // Mark read
                    await fetch(`${API_URL}/conversations/${activeConversation.id}/read`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: currentUser.uid })
                    });

                    setConversations(prev =>
                        prev.map(conv =>
                            conv.id === activeConversation.id
                                ? { ...conv, unread_count: 0 }
                                : conv
                        )
                    );
                }
            } catch (error) {
                console.error('Failed to fetch messages:', error);
            } finally {
                setIsLoadingMessages(false);
            }
        };

        fetchMessages();
    }, [activeConversation?.id, currentUser]);

    // WebSocket Handler
    useEffect(() => {
        if (!lastMessage || !currentUser) return;

        if (lastMessage.type === 'new_message' && lastMessage.message) {
            let newMsg = lastMessage.message;
            const otherUserId = newMsg.sender_id;

            if (otherUserId) {
                const key = generateConversationKey(currentUser.uid, otherUserId);
                newMsg = { ...newMsg, content: decryptMessage(newMsg.content, key) };
            }

            if (newMsg.conversation_id === activeConversation?.id) {
                setMessages(prev => [...prev, newMsg]);
                // Mark read
                fetch(`${API_URL}/conversations/${activeConversation.id}/read`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: currentUser.uid })
                });
            } else {
                setConversations(prev =>
                    prev.map(conv =>
                        conv.id === newMsg.conversation_id
                            ? { ...conv, unread_count: (conv.unread_count || 0) + 1, last_message: newMsg.content }
                            : conv
                    )
                );
            }
        }
    }, [lastMessage, activeConversation?.id, currentUser]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeConversation || !currentUser || !newMessage.trim()) return;

        const content = newMessage.trim();
        setNewMessage(""); // Clear immediately

        const otherUserId = activeConversation.participants.find(p => p !== currentUser.uid);
        let contentToSend = content;
        if (otherUserId) {
            const key = generateConversationKey(currentUser.uid, otherUserId);
            contentToSend = encryptMessage(content, key);
        }

        try {
            const response = await fetch(
                `${API_URL}/conversations/${activeConversation.id}/messages`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sender_id: currentUser.uid,
                        content: contentToSend
                    })
                }
            );

            if (response.ok) {
                const newMsgObj = await response.json();
                const localMessage = { ...newMsgObj, content: content };
                setMessages(prev => [...prev, localMessage]);

                setConversations(prev => {
                    const updated = prev.map(conv =>
                        conv.id === activeConversation.id
                            ? { ...conv, last_message: content, last_message_at: newMsgObj.created_at }
                            : conv
                    );
                    return [
                        updated.find(c => c.id === activeConversation.id)!,
                        ...updated.filter(c => c.id !== activeConversation.id)
                    ];
                });
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    // --- RENDER HELPERS ---

    // Get Other User Details helper
    const getOtherUser = (conv: Conversation) => {
        // Implementation depends on how your API returns user details in conversation
        // For now assuming conv has a `users` array populated, or we just have basic info.
        // If your API API returns `users` array with user objects:
        if ((conv as any).users) {
            return (conv as any).users.find((u: any) => u.uid !== currentUser?.uid) || {};
        }
        // Fallback or if you only have IDs
        return { display_name: "User", photoURL: null };
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen pt-20">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground text-sm uppercase tracking-widest animate-pulse">Loading Messages...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pt-24 pb-10 px-4 md:px-8 max-w-[1600px] mx-auto overflow-hidden h-[100vh]">
            <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] gap-6 h-full max-h-[calc(100vh-140px)]">

                {/* 1. SIDEBAR (Conversation List) */}
                <div className={`glass-card flex flex-col h-full overflow-hidden ${activeConversation ? 'hidden md:flex' : 'flex'}`}>

                    {/* Header */}
                    <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5 backdrop-blur-md">
                        <h2 className="text-xl font-black tracking-tight">Messages</h2>
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-all"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="p-4">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        {conversations.length === 0 ? (
                            <div className="text-center py-10 opacity-50">
                                <MessageCircle size={40} className="mx-auto mb-3 text-muted-foreground" />
                                <p className="text-sm font-medium">No conversations yet</p>
                            </div>
                        ) : (
                            conversations.map((conv) => {
                                const otherUser = getOtherUser(conv);
                                const isUnread = (conv.unread_count || 0) > 0;
                                return (
                                    <motion.button
                                        key={conv.id}
                                        onClick={() => setActiveConversation(conv)}
                                        whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                                        className={`w-full p-4 rounded-xl flex items-start gap-4 transition-all text-left group relative overflow-hidden ${activeConversation?.id === conv.id
                                                ? 'bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5'
                                                : 'border border-transparent hover:border-white/5'
                                            }`}
                                    >
                                        {/* Avatar */}
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                {otherUser.photoURL ? (
                                                    <img src={otherUser.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    (otherUser.display_name || "?")[0]
                                                )}
                                            </div>
                                            {/* Online Badge (Mock) */}
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className={`text-sm font-bold truncate ${isUnread ? 'text-white' : 'text-foreground'}`}>
                                                    {otherUser.display_name || "Unknown User"}
                                                </h3>
                                                {conv.last_message_at && (
                                                    <span className={`text-[10px] font-medium ${isUnread ? 'text-primary' : 'text-muted-foreground'}`}>
                                                        {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-xs truncate ${isUnread ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                                                {conv.last_message || "Started a conversation"}
                                            </p>
                                        </div>

                                        {isUnread && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.5)]"></div>
                                        )}
                                    </motion.button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* 2. CHAT WINDOW (Main Area) */}
                <div className={`glass-card flex-col h-full overflow-hidden relative ${activeConversation ? 'flex' : 'hidden md:flex'}`}>
                    {activeConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-white/5 bg-white/5 backdrop-blur-md flex justify-between items-center z-20 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setActiveConversation(null)}
                                        className="md:hidden p-2 -ml-2 hover:bg-white/10 rounded-full"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>

                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
                                        {getOtherUser(activeConversation).photoURL ? (
                                            <img src={getOtherUser(activeConversation).photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            (getOtherUser(activeConversation).display_name || "?")[0]
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm">{getOtherUser(activeConversation).display_name || "Unknown User"}</h3>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Online</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors">
                                        <Phone size={18} />
                                    </button>
                                    <button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors">
                                        <Video size={18} />
                                    </button>
                                    <button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative">
                                {/* Decorative elements usually go here (bg patterns) */}

                                {isLoadingMessages ? (
                                    <div className="flex justify-center py-10">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isMe = msg.sender_id === currentUser.uid;
                                        const showAvatar = !isMe && (idx === 0 || messages[idx - 1].sender_id !== msg.sender_id);

                                        return (
                                            <div
                                                key={msg.id || idx}
                                                className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`flex max-w-[70%] sm:max-w-[60%] gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>

                                                    {/* Avatar for receiver */}
                                                    {!isMe && (
                                                        <div className={`w-8 h-8 rounded-full flex-shrink-0 ${showAvatar ? 'bg-indigo-500' : 'opacity-0'} flex items-center justify-center text-xs text-white`}>
                                                            {getOtherUser(activeConversation).display_name?.[0]}
                                                        </div>
                                                    )}

                                                    <div className={`group relative p-3 sm:p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${isMe
                                                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                            : 'bg-white/10 backdrop-blur-md text-foreground rounded-tl-none border border-white/5'
                                                        }`}>
                                                        {msg.content}

                                                        {/* Timestamp */}
                                                        <div className={`text-[9px] mt-1 font-medium opacity-50 ${isMe ? 'text-right text-primary-foreground' : 'text-left'}`}>
                                                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white/5 backdrop-blur-md border-t border-white/5">
                                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                    <button type="button" className="p-3 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full transition-colors hidden sm:flex">
                                        <ImageIcon size={20} />
                                    </button>
                                    <button type="button" className="p-3 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full transition-colors hidden sm:flex">
                                        <Paperclip size={20} />
                                    </button>

                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="w-full bg-white/10 border border-white/10 rounded-full pl-5 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                        />
                                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                                            <Smile size={20} />
                                        </button>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="p-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary text-white rounded-full shadow-lg shadow-primary/20 transition-all transform active:scale-95"
                                    >
                                        <Send size={20} className={newMessage.trim() ? "ml-0.5" : ""} />
                                    </button>
                                </form>
                            </div>

                        </>
                    ) : (
                        <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-8 opacity-80">
                            <div className="w-24 h-24 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
                                <MessageCircle size={48} className="text-primary" />
                            </div>
                            <h2 className="text-2xl font-black mb-2">Your Messages</h2>
                            <p className="text-muted-foreground max-w-sm mb-8">
                                Select a conversation from the sidebar to start chatting or use the + button to find someone new.
                            </p>
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold transition-all flex items-center gap-2"
                            >
                                <Plus size={18} />
                                Start New Chat
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* User Search Modal */}
            <UserSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onSelectUser={(userId) => handleSelectUser(userId)}
                currentUserId={currentUser?.uid}
            />
        </div>
    );
}
