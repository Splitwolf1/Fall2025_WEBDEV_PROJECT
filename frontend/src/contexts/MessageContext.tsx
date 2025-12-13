'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { socketClient } from '@/lib/socket-client';
import { auth } from '@/lib/auth';

export interface ChatMessage {
    id: string;
    fromUserId: string;
    toUserId: string;
    message: string;
    orderId?: string;
    orderNumber?: string;
    senderName: string;
    senderRole: string;
    timestamp: string;
    read: boolean;
}

interface MessageContextType {
    messages: ChatMessage[];
    unreadCount: number;
    addMessage: (message: ChatMessage) => void;
    markAsRead: (messageId: string) => void;
    markAllAsRead: () => void;
    getConversation: (userId: string) => ChatMessage[];
    openChatWithUser: (userId: string, userName: string, orderNumber?: string) => void;
    activeChatUser: { userId: string; userName: string; orderNumber?: string } | null;
    clearActiveChat: () => void;
}

const MessageContext = createContext<MessageContextType | null>(null);

export function useMessages() {
    const context = useContext(MessageContext);
    if (!context) {
        throw new Error('useMessages must be used within a MessageProvider');
    }
    return context;
}

export function MessageProvider({ children }: { children: React.ReactNode }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [activeChatUser, setActiveChatUser] = useState<{ userId: string; userName: string; orderNumber?: string } | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string>('');

    // Load messages from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem('chat_messages');
            if (stored) {
                setMessages(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load messages from localStorage:', e);
        }

        const user = auth.getCurrentUser();
        if (user) {
            setCurrentUserId(user.id);
            console.log('📧 MessageContext: Current user ID set to', user.id);
        }
    }, []);

    // Save messages to localStorage when they change
    useEffect(() => {
        try {
            localStorage.setItem('chat_messages', JSON.stringify(messages));
        } catch (e) {
            console.error('Failed to save messages to localStorage:', e);
        }
    }, [messages]);

    // Listen for incoming messages via WebSocket
    useEffect(() => {
        const user = auth.getCurrentUser();
        if (!user) {
            console.log('📧 MessageContext: No user, skipping socket setup');
            return;
        }

        console.log('📧 MessageContext: Setting up socket listener for user', user.id);

        const handleNotification = (notification: any) => {
            console.log('📧 MessageContext received notification:', notification.type);

            if (notification.type === 'chat_message' && notification.data) {
                const msgData = notification.data;
                console.log('📧 MessageContext: Processing chat_message from', msgData.senderName);

                const newMessage: ChatMessage = {
                    id: msgData.id || `msg_${Date.now()}`,
                    fromUserId: msgData.fromUserId,
                    toUserId: msgData.toUserId,
                    message: msgData.message,
                    orderId: msgData.orderId,
                    orderNumber: msgData.orderNumber,
                    senderName: msgData.senderName || 'Unknown',
                    senderRole: msgData.senderRole || 'user',
                    timestamp: msgData.timestamp || new Date().toISOString(),
                    read: false,
                };
                setMessages(prev => {
                    console.log('📧 MessageContext: Adding message, total now:', prev.length + 1);
                    return [...prev, newMessage];
                });
            }
        };

        socketClient.onNotification(handleNotification);
        return () => {
            socketClient.offNotification(handleNotification);
        };
    }, []);

    const addMessage = useCallback((message: ChatMessage) => {
        setMessages(prev => [...prev, message]);
    }, []);

    const markAsRead = useCallback((messageId: string) => {
        setMessages(prev =>
            prev.map(msg => (msg.id === messageId ? { ...msg, read: true } : msg))
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setMessages(prev => prev.map(msg => ({ ...msg, read: true })));
    }, []);

    const getConversation = useCallback((userId: string) => {
        return messages.filter(
            msg => msg.fromUserId === userId || msg.toUserId === userId
        ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [messages]);

    const openChatWithUser = useCallback((userId: string, userName: string, orderNumber?: string) => {
        setActiveChatUser({ userId, userName, orderNumber });
        // Mark messages from this user as read
        setMessages(prev =>
            prev.map(msg => (msg.fromUserId === userId ? { ...msg, read: true } : msg))
        );
    }, []);

    const clearActiveChat = useCallback(() => {
        setActiveChatUser(null);
    }, []);

    // Calculate unread count for messages TO the current user
    const unreadCount = messages.filter(msg => {
        const isUnread = !msg.read;
        const isForMe = msg.toUserId === currentUserId;
        return isUnread && isForMe;
    }).length;

    console.log('📧 MessageContext: unreadCount =', unreadCount, 'currentUserId =', currentUserId, 'total messages =', messages.length);

    return (
        <MessageContext.Provider
            value={{
                messages,
                unreadCount,
                addMessage,
                markAsRead,
                markAllAsRead,
                getConversation,
                openChatWithUser,
                activeChatUser,
                clearActiveChat,
            }}
        >
            {children}
        </MessageContext.Provider>
    );
}
