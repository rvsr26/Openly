'use client';

import { Conversation } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
    conversations: Conversation[];
    activeConversationId: string | null;
    onSelectConversation: (conversation: Conversation) => void;
    currentUserId: string;
}

export default function ConversationList({
    conversations,
    activeConversationId,
    onSelectConversation,
    currentUserId
}: ConversationListProps) {
    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <svg
                    className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                </svg>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    No messages yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Start a conversation by visiting a user's profile
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-y-auto h-full">
            {conversations.map((conversation) => {
                const otherUser = conversation.participant_info[0];
                const isActive = conversation.id === activeConversationId;

                return (
                    <button
                        key={conversation.id}
                        onClick={() => onSelectConversation(conversation)}
                        className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 ${isActive ? 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-l-purple-600' : ''
                            }`}
                    >
                        <div className="relative flex-shrink-0">
                            <img
                                src={otherUser.photoURL || '/default-avatar.png'}
                                alt={otherUser.display_name}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                            {conversation.unread_count > 0 && (
                                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                    {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className={`font-semibold truncate ${conversation.unread_count > 0
                                        ? 'text-gray-900 dark:text-white'
                                        : 'text-gray-700 dark:text-gray-300'
                                    }`}>
                                    {otherUser.display_name}
                                </h3>
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                    {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                                </span>
                            </div>

                            <p className={`text-sm truncate ${conversation.unread_count > 0
                                    ? 'text-gray-900 dark:text-gray-100 font-medium'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                {conversation.last_message || 'No messages yet'}
                            </p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
