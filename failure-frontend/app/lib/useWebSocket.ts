'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Message } from '../types';

interface WebSocketMessage {
    type: string;
    message?: Message;
    conversation_id?: string;
    is_typing?: boolean;
}

export function useWebSocket(userId: string | null) {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);

    const connect = useCallback(() => {
        if (!userId || wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            const wsUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
                .replace(/^http/, 'ws')
                .replace('localhost', '127.0.0.1');
            const ws = new WebSocket(`${wsUrl}/ws/${userId}`);

            ws.onopen = () => {
                console.log('✅ WebSocket connected');
                setIsConnected(true);
                reconnectAttempts.current = 0;
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setLastMessage(data);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            ws.onclose = () => {
                console.log('❌ WebSocket disconnected');
                setIsConnected(false);
                wsRef.current = null;

                // Attempt to reconnect with exponential backoff
                if (reconnectAttempts.current < 5) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttempts.current++;
                        connect();
                    }, delay);
                }
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
        }
    }, [userId]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
    }, []);

    const sendMessage = useCallback((message: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket is not connected');
        }
    }, []);

    const sendTypingIndicator = useCallback((conversationId: string, isTyping: boolean) => {
        sendMessage({
            type: 'typing',
            conversation_id: conversationId,
            is_typing: isTyping
        });
    }, [sendMessage]);

    useEffect(() => {
        if (userId) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [userId, connect, disconnect]);

    return {
        isConnected,
        lastMessage,
        sendMessage,
        sendTypingIndicator,
        reconnect: connect
    };
}
