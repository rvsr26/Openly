'use client';

import { useState, KeyboardEvent } from 'react';

interface MessageInputProps {
    onSend: (content: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export default function MessageInput({ onSend, disabled = false, placeholder = "Type a message..." }: MessageInputProps) {
    const [content, setContent] = useState('');

    const handleSend = () => {
        if (content.trim() && !disabled) {
            onSend(content.trim());
            setContent('');
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-end gap-2">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={1}
                    className="flex-1 resize-none rounded-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-none focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 max-h-32 overflow-y-auto"
                    style={{
                        minHeight: '48px',
                        height: 'auto'
                    }}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                    }}
                />

                <button
                    onClick={handleSend}
                    disabled={!content.trim() || disabled}
                    className={`rounded-full p-3 transition-all ${content.trim() && !disabled
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:scale-105'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                    </svg>
                </button>
            </div>

            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Press Enter to send, Shift+Enter for new line
                {content.length > 0 && (
                    <span className={`ml-2 ${content.length > 500 ? 'text-red-500' : ''}`}>
                        {content.length}/1000
                    </span>
                )}
            </div>
        </div>
    );
}
