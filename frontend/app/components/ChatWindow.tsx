'use client';

import { useEffect, useRef, useState } from 'react';
import { Message, Conversation } from '../types';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

interface ChatWindowProps {
    conversation: Conversation | null;
    messages: Message[];
    currentUserId: string;
    onSendMessage: (content: string) => void;
    onDeleteMessage: (messageId: string) => void;
    onLoadMore?: () => void;
    isLoading?: boolean;
    isTyping?: boolean;
}

export default function ChatWindow({
    conversation,
    messages,
    currentUserId,
    onSendMessage,
    onDeleteMessage,
    onLoadMore,
    isLoading = false,
    isTyping = false
}: ChatWindowProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (shouldAutoScroll) {
            scrollToBottom();
        }
    }, [messages, shouldAutoScroll]);

    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShouldAutoScroll(isNearBottom);

            // Load more messages when scrolled to top
            if (scrollTop === 0 && onLoadMore && !isLoading) {
                onLoadMore();
            }
        }
    };

    if (!conversation) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900 text-center p-8">
                <svg
                    className="w-24 h-24 text-gray-300 dark:text-gray-600 mb-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                </svg>
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Select a conversation
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    Choose a conversation from the list to start messaging
                </p>
            </div>
        );
    }

    const otherUser = conversation.participant_info[0];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
                <div className="flex items-center gap-3">
                    <img
                        src={otherUser.photoURL || '/default-avatar.png'}
                        alt={otherUser.display_name}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                        <h2 className="font-semibold text-gray-900 dark:text-white">
                            {otherUser.display_name}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{otherUser.username}
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900"
            >
                {isLoading && (
                    <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                )}

                {messages.length === 0 && !isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <p className="text-gray-500 dark:text-gray-400 mb-2">
                            No messages yet
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                            Send a message to start the conversation
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((message) => (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                isOwnMessage={message.sender_id === currentUserId}
                                onDelete={onDeleteMessage}
                            />
                        ))}

                        {isTyping && (
                            <div className="flex items-center gap-2 mb-4">
                                <div className="bg-gray-200 dark:bg-gray-700 rounded-full px-4 py-2">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <MessageInput
                onSend={onSendMessage}
                placeholder={`Message ${otherUser.display_name}...`}
            />
        </div>
    );
}
