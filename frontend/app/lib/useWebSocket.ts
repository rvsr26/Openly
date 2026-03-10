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
    const intentionalDisconnectRef = useRef(false);

    const connectRef = useRef<() => void>(() => { });

    const connect = useCallback(() => {
        if (!userId || wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            const wsUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
                .replace(/^http/, 'ws')
                .replace('localhost', '127.0.0.1')
                .replace(/\/$/, "");
            const ws = new WebSocket(`${wsUrl}/ws/${userId}`);

            ws.onopen = () => {
                console.log('✅ WebSocket connected');
                setIsConnected(true);
                reconnectAttempts.current = 0;
                intentionalDisconnectRef.current = false;
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
                if (intentionalDisconnectRef.current) return;
                console.error('WebSocket error:', error);
            };

            ws.onclose = () => {
                setIsConnected(false);
                wsRef.current = null;

                if (intentionalDisconnectRef.current) {
                    console.log('🔌 WebSocket disconnected intentionally (unmount)');
                    return;
                }

                console.log('❌ WebSocket disconnected unexpectedly');
                // Attempt to reconnect with exponential backoff
                if (reconnectAttempts.current < 5) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttempts.current++;
                        connectRef.current();
                    }, delay);
                }
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
        }
    }, [userId]);

    useEffect(() => {
        connectRef.current = connect;
    }, [connect]);

    const disconnect = useCallback(() => {
        intentionalDisconnectRef.current = true;

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
        let mountTimeout: NodeJS.Timeout;

        if (userId) {
            // Debounce connection to bypass Strict Mode double-invoke 
            // which causes unsuppressible browser "closed before established" console warnings
            mountTimeout = setTimeout(() => {
                connect();
            }, 100);
        }

        return () => {
            if (mountTimeout) {
                clearTimeout(mountTimeout);
            }
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
