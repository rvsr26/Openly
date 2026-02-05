'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { Conversation, Message } from '../types';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import { useWebSocket } from '../lib/useWebSocket';

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

    const { isConnected, lastMessage, sendTypingIndicator } = useWebSocket(currentUser?.uid || null);

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

    // Fetch conversations
    useEffect(() => {
        if (!currentUser) return;

        const fetchConversations = async () => {
            try {
                const response = await fetch(`${API_URL}/conversations/?user_id=${currentUser.uid}`);
                if (response.ok) {
                    const data = await response.json();
                    setConversations(data);

                    // If targetUserId is provided, create or get conversation with that user
                    if (targetUserId) {
                        const existing = data.find((conv: Conversation) =>
                            conv.participants.includes(targetUserId)
                        );

                        if (existing) {
                            setActiveConversation(existing);
                        } else {
                            // Create new conversation
                            const createResponse = await fetch(`${API_URL}/conversations/`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    user_id: currentUser.uid,
                                    target_user_id: targetUserId
                                })
                            });

                            if (createResponse.ok) {
                                const newConv = await createResponse.json();
                                setConversations([newConv, ...data]);
                                setActiveConversation(newConv);
                            }
                        }
                    } else if (data.length > 0 && !activeConversation) {
                        // Select first conversation by default
                        setActiveConversation(data[0]);
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

    // Fetch messages for active conversation
    useEffect(() => {
        if (!activeConversation) return;

        const fetchMessages = async () => {
            setIsLoadingMessages(true);
            try {
                const response = await fetch(
                    `${API_URL}/conversations/${activeConversation.id}/messages`
                );
                if (response.ok) {
                    const data = await response.json();
                    setMessages(data);

                    // Mark as read
                    await fetch(`${API_URL}/conversations/${activeConversation.id}/read`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: currentUser.uid })
                    });

                    // Update conversation unread count locally
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

    // Handle WebSocket messages
    useEffect(() => {
        if (!lastMessage) return;

        if (lastMessage.type === 'new_message' && lastMessage.message) {
            const newMsg = lastMessage.message;

            // Add message to list if it's for the active conversation
            if (newMsg.conversation_id === activeConversation?.id) {
                setMessages(prev => [...prev, newMsg]);

                // Mark as read immediately
                fetch(`${API_URL}/conversations/${activeConversation.id}/read`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: currentUser.uid })
                });
            } else {
                // Update unread count for other conversations
                setConversations(prev =>
                    prev.map(conv =>
                        conv.id === newMsg.conversation_id
                            ? { ...conv, unread_count: conv.unread_count + 1, last_message: newMsg.content }
                            : conv
                    )
                );
            }
        }
    }, [lastMessage, activeConversation?.id, currentUser]);

    const handleSendMessage = async (content: string) => {
        if (!activeConversation || !currentUser) return;

        try {
            const response = await fetch(
                `${API_URL}/conversations/${activeConversation.id}/messages`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sender_id: currentUser.uid,
                        content
                    })
                }
            );

            if (response.ok) {
                const newMessage = await response.json();
                setMessages(prev => [...prev, newMessage]);

                // Update conversation list
                setConversations(prev => {
                    const updated = prev.map(conv =>
                        conv.id === activeConversation.id
                            ? { ...conv, last_message: content, last_message_at: newMessage.created_at }
                            : conv
                    );
                    // Move to top
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

    const handleDeleteMessage = async (messageId: string) => {
        if (!currentUser) return;

        try {
            const response = await fetch(`${API_URL}/messages/${messageId}?user_id=${currentUser.uid}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === messageId ? { ...msg, is_deleted: true } : msg
                    )
                );
            }
        } catch (error) {
            console.error('Failed to delete message:', error);
        }
    };

    const handleSelectConversation = (conversation: Conversation) => {
        setActiveConversation(conversation);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            {/* Conversations Sidebar */}
            <div className="w-full md:w-96 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                </div>

                <ConversationList
                    conversations={conversations}
                    activeConversationId={activeConversation?.id || null}
                    onSelectConversation={handleSelectConversation}
                    currentUserId={currentUser?.uid || ''}
                />
            </div>

            {/* Chat Window */}
            <div className="flex-1 hidden md:block">
                <ChatWindow
                    conversation={activeConversation}
                    messages={messages}
                    currentUserId={currentUser?.uid || ''}
                    onSendMessage={handleSendMessage}
                    onDeleteMessage={handleDeleteMessage}
                    isLoading={isLoadingMessages}
                />
            </div>

            {/* Mobile: Show chat window when conversation is selected */}
            {activeConversation && (
                <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 md:hidden">
                    <button
                        onClick={() => setActiveConversation(null)}
                        className="absolute top-4 left-4 z-10 p-2 bg-gray-100 dark:bg-gray-800 rounded-full"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <ChatWindow
                        conversation={activeConversation}
                        messages={messages}
                        currentUserId={currentUser?.uid || ''}
                        onSendMessage={handleSendMessage}
                        onDeleteMessage={handleDeleteMessage}
                        isLoading={isLoadingMessages}
                    />
                </div>
            )}
        </div>
    );
}
