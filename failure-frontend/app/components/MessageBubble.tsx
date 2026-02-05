'use client';

import { Message } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface MessageBubbleProps {
    message: Message;
    isOwnMessage: boolean;
    onDelete?: (messageId: string) => void;
}

export default function MessageBubble({ message, isOwnMessage, onDelete }: MessageBubbleProps) {
    if (message.is_deleted) {
        return (
            <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
                <div className="max-w-[70%] px-4 py-2 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 italic">
                    Message deleted
                </div>
            </div>
        );
    }

    return (
        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}>
            {!isOwnMessage && message.sender_pic && (
                <img
                    src={message.sender_pic}
                    alt={message.sender_name}
                    className="w-8 h-8 rounded-full mr-2 mt-auto"
                />
            )}

            <div className={`max-w-[70%] ${isOwnMessage ? 'order-1' : 'order-2'}`}>
                {!isOwnMessage && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-2">
                        {message.sender_name}
                    </div>
                )}

                <div
                    className={`px-4 py-2 rounded-2xl break-words ${isOwnMessage
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-sm'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                        }`}
                >
                    {message.content}
                </div>

                <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>

                    {isOwnMessage && onDelete && (
                        <button
                            onClick={() => onDelete(message.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600"
                        >
                            Delete
                        </button>
                    )}

                    {isOwnMessage && (
                        <span className="text-xs">
                            {message.is_read ? '✓✓' : '✓'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
