'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Mail, MessageSquare, User } from 'lucide-react';
import { useMessages } from '@/contexts/MessageContext';
import { auth } from '@/lib/auth';

interface MessageGroup {
    senderName: string;
    senderId: string;
    lastMessage: string;
    timestamp: string;
    unreadCount: number;
    orderNumber?: string;
}

export default function MessageInboxBadge() {
    const { messages, unreadCount, openChatWithUser } = useMessages();
    const [messageGroups, setMessageGroups] = useState<MessageGroup[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string>('');

    // Get current user ID
    useEffect(() => {
        const user = auth.getCurrentUser();
        if (user) {
            setCurrentUserId(user.id);
        }
    }, []);

    // Group messages by sender - only for messages TO current user
    useEffect(() => {
        if (!currentUserId) return;

        const groups: Record<string, MessageGroup> = {};

        messages.forEach(msg => {
            // Only show messages TO the current user that are unread
            if (!msg.read && msg.toUserId === currentUserId) {
                const key = msg.fromUserId;
                if (!groups[key]) {
                    groups[key] = {
                        senderName: msg.senderName,
                        senderId: msg.fromUserId,
                        lastMessage: msg.message,
                        timestamp: msg.timestamp,
                        unreadCount: 1,
                        orderNumber: msg.orderNumber,
                    };
                } else {
                    groups[key].unreadCount++;
                    if (new Date(msg.timestamp) > new Date(groups[key].timestamp)) {
                        groups[key].lastMessage = msg.message;
                        groups[key].timestamp = msg.timestamp;
                    }
                }
            }
        });

        console.log('📧 MessageInboxBadge: Found', Object.keys(groups).length, 'message groups for user', currentUserId);
        setMessageGroups(Object.values(groups).sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
    }, [messages, currentUserId]);

    const handleOpenChat = (group: MessageGroup) => {
        openChatWithUser(group.senderId, group.senderName, group.orderNumber);
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Mail className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Messages
                    {unreadCount > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                            {unreadCount} unread
                        </Badge>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {messageGroups.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                        No new messages
                    </div>
                ) : (
                    messageGroups.slice(0, 5).map((group) => (
                        <DropdownMenuItem
                            key={group.senderId}
                            className="flex items-start gap-3 p-3 cursor-pointer"
                            onClick={() => handleOpenChat(group)}
                        >
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <p className="font-medium text-sm truncate">{group.senderName}</p>
                                    <span className="text-xs text-gray-500">{formatTime(group.timestamp)}</span>
                                </div>
                                <p className="text-xs text-gray-600 truncate">{group.lastMessage}</p>
                                {group.orderNumber && (
                                    <p className="text-xs text-blue-500">Order: {group.orderNumber}</p>
                                )}
                                {group.unreadCount > 1 && (
                                    <Badge variant="secondary" className="text-xs mt-1">
                                        {group.unreadCount} messages
                                    </Badge>
                                )}
                            </div>
                        </DropdownMenuItem>
                    ))
                )}

                {messageGroups.length > 5 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-center text-sm text-blue-600">
                            View all messages
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
