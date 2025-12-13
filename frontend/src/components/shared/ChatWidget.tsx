'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, X, Send, Bot, User, Loader2, ArrowLeft, Users } from 'lucide-react';
import { socketClient } from '@/lib/socket-client';
import { auth } from '@/lib/auth';
import { useMessages, ChatMessage } from '@/contexts/MessageContext';

interface Message {
  id: number | string;
  sender: 'user' | 'bot' | 'other';
  text: string;
  timestamp: Date;
  suggestions?: string[];
  isLoading?: boolean;
  senderName?: string;
}

interface ChatContext {
  chatEnabled: boolean;
  targetUserId: string;
  targetName: string;
  targetRole: string;
  orderId: string;
  orderNumber: string;
}

interface ChatResponse {
  success: boolean;
  intent?: string;
  response: {
    text: string;
    quickReplies?: string[];
    data?: ChatContext;
  };
  timestamp: string;
  message?: string;
}

// Role-specific chatbot configurations
interface RoleChatConfig {
  welcomeMessage: string;
  suggestions: string[];
  placeholder: string;
  botName: string;
}

const roleConfigs: Record<string, RoleChatConfig> = {
  restaurant: {
    welcomeMessage: "Hi! I'm your Farm-to-Table ordering assistant. I can help you track orders, connect with farmers, or find fresh products.",
    suggestions: [
      'Track my order',
      'Talk to farmer',
      'Find products',
      'Show my recent orders',
    ],
    placeholder: 'Ask about orders, products, or connect with farmers...',
    botName: 'Ordering Assistant',
  },
  farmer: {
    welcomeMessage: "Hello! I'm your Farm-to-Table sales assistant. I can help you manage incoming orders, view order details, or connect with restaurants.",
    suggestions: [
      'Show pending orders',
      'View order details',
      'Talk to restaurant',
      'Contact support',
    ],
    placeholder: 'Ask about orders, customers, or get help...',
    botName: 'Sales Assistant',
  },
  distributor: {
    welcomeMessage: "Hi! I'm your delivery management assistant. I can help you with delivery routes, contact customers, or check delivery statuses.",
    suggestions: [
      'Show my deliveries',
      'View route details',
      'Talk to restaurant',
      'Talk to farmer',
    ],
    placeholder: 'Ask about deliveries, routes, or contact customers...',
    botName: 'Delivery Assistant',
  },
  inspector: {
    welcomeMessage: "Hello! I'm your inspection management assistant. I can help you view violations, check upcoming inspections, or connect with facility owners.",
    suggestions: [
      'Show recent violations',
      'Upcoming inspections',
      'View inspection INS-702',
      'Talk to facility owner',
    ],
    placeholder: 'Ask about violations, inspections, or contact facilities...',
    botName: 'Inspection Assistant',
  },
  default: {
    welcomeMessage: "Hi! I'm your Farm-to-Table assistant. How can I help you today?",
    suggestions: [
      'Track my order',
      'Find products',
      'Contact support',
    ],
    placeholder: 'Type a message...',
    botName: 'Assistant',
  },
};

const getInitialMessages = (role: string): Message[] => {
  const config = roleConfigs[role] || roleConfigs.default;
  return [
    {
      id: 1,
      sender: 'bot',
      text: config.welcomeMessage,
      timestamp: new Date(),
      suggestions: config.suggestions,
    },
  ];
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [chatContext, setChatContext] = useState<ChatContext | null>(null);
  const [roleConfig, setRoleConfig] = useState<RoleChatConfig>(roleConfigs.default);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Message context for inbox integration
  const messageContext = useMessages();
  const { activeChatUser, clearActiveChat, getConversation, addMessage } = messageContext;

  const CHATBOT_SERVICE_URL = process.env.NEXT_PUBLIC_CHATBOT_SERVICE_URL || 'http://localhost:3008';
  const NOTIFICATION_SERVICE_URL = process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'http://localhost:3007';

  // Get user info from auth and set role-based config
  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (currentUser) {
      setUserId(currentUser.id);
      setUserName(currentUser.name || currentUser.email || 'User');
      const role = currentUser.role || 'default';
      setUserRole(role);

      // Set role-specific configuration
      const config = roleConfigs[role] || roleConfigs.default;
      setRoleConfig(config);
      setMessages(getInitialMessages(role));
    }
  }, []);

  // Auto-open chat when triggered from inbox
  useEffect(() => {
    if (activeChatUser) {
      // Set chat context for direct messaging
      setChatContext({
        chatEnabled: true,
        targetUserId: activeChatUser.userId,
        targetName: activeChatUser.userName,
        targetRole: 'user',
        orderId: '',
        orderNumber: activeChatUser.orderNumber || '',
      });

      // Load message history with this user
      const conversation = getConversation(activeChatUser.userId);
      const historyMessages: Message[] = conversation.map(msg => ({
        id: msg.id,
        sender: msg.fromUserId === userId ? 'user' : 'other',
        text: msg.message,
        timestamp: new Date(msg.timestamp),
        senderName: msg.senderName,
      }));

      // Add history after initial bot message if there is any
      if (historyMessages.length > 0) {
        setMessages([...getInitialMessages(userRole), ...historyMessages]);
      }

      setIsOpen(true);
    }
  }, [activeChatUser, getConversation, userId]);

  // Listen for incoming chat messages via WebSocket
  useEffect(() => {
    const handleNotification = (notification: any) => {
      if (notification.type === 'chat_message' && notification.data) {
        const msgData = notification.data;
        // Only show messages from the current chat partner
        if (chatContext && msgData.fromUserId === chatContext.targetUserId) {
          const newMessage: Message = {
            id: msgData.id || Date.now(),
            sender: 'other',
            text: msgData.message,
            timestamp: new Date(msgData.timestamp),
            senderName: msgData.senderName,
          };
          setMessages(prev => [...prev, newMessage]);
          if (!isOpen) {
            setUnreadCount(prev => prev + 1);
          }
        }
      }
    };

    socketClient.onNotification(handleNotification);
    return () => {
      socketClient.offNotification(handleNotification);
    };
  }, [chatContext, isOpen]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const messageText = inputMessage;
    setInputMessage('');

    // If in chat mode, send direct message
    if (chatContext?.chatEnabled) {
      setIsLoading(true);

      // Add user message immediately
      const userMessage: Message = {
        id: Date.now(),
        sender: 'user',
        text: messageText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      try {
        await fetch(`${NOTIFICATION_SERVICE_URL}/api/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromUserId: userId,
            toUserId: chatContext.targetUserId,
            message: messageText,
            orderId: chatContext.orderId,
            orderNumber: chatContext.orderNumber,
            senderName: userName,
            senderRole: userRole,
          }),
        });
      } catch (error) {
        console.error('Failed to send message:', error);
        const errorMessage: Message = {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'Failed to send message. Please try again.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Otherwise, send to chatbot
    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: messageText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    const loadingMessage: Message = {
      id: Date.now() + 1,
      sender: 'bot',
      text: '',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const response = await fetch(`${CHATBOT_SERVICE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          userId: userId || undefined,
        }),
      });

      const data: ChatResponse = await response.json();

      if (data.success && data.response) {
        const botResponse: Message = {
          id: Date.now() + 2,
          sender: 'bot',
          text: data.response.text,
          timestamp: new Date(),
          suggestions: data.response.quickReplies,
        };

        setMessages(prev => prev.filter(m => !m.isLoading).concat([botResponse]));

        // Check if chat mode should be enabled
        if (data.response.data?.chatEnabled) {
          setChatContext(data.response.data);
        }
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: Date.now() + 3,
        sender: 'bot',
        text: "I'm sorry, I'm having trouble connecting right now. Please try again.",
        timestamp: new Date(),
        suggestions: ['Try again'],
      };
      setMessages(prev => prev.filter(m => !m.isLoading).concat([errorMessage]));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExitChat = () => {
    setChatContext(null);
    const exitMessage: Message = {
      id: Date.now(),
      sender: 'bot',
      text: 'You\'ve left the chat. How else can I help you?',
      timestamp: new Date(),
      suggestions: ['Track my order', 'Talk to farmer', 'Find products'],
    };
    setMessages(prev => [...prev, exitMessage]);
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion === 'Cancel chat') {
      handleExitChat();
    } else {
      setInputMessage(suggestion);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => {
            setIsOpen(true);
            setUnreadCount(0);
          }}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-green-600 hover:bg-green-700 z-50"
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <CardHeader className={`${chatContext?.chatEnabled ? 'bg-blue-600' : 'bg-green-600'} text-white rounded-t-lg flex-shrink-0`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {chatContext?.chatEnabled && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleExitChat}
                    className="text-white hover:bg-blue-700 h-8 w-8"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <div className={`h-10 w-10 ${chatContext?.chatEnabled ? 'bg-blue-100' : 'bg-white'} rounded-full flex items-center justify-center`}>
                  {chatContext?.chatEnabled ? (
                    <Users className="h-6 w-6 text-blue-600" />
                  ) : (
                    <Bot className="h-6 w-6 text-green-600" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-white text-base">
                    {chatContext?.chatEnabled ? chatContext.targetName : roleConfig.botName}
                  </CardTitle>
                  <p className="text-xs text-green-100">
                    {chatContext?.chatEnabled
                      ? `Order: ${chatContext.orderNumber}`
                      : 'Online • Ready to help'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-green-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          {/* Messages Area */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                <div
                  className={`flex gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                >
                  {message.sender !== 'user' && (
                    <div className={`h-8 w-8 ${message.sender === 'other' ? 'bg-blue-100' : 'bg-green-100'} rounded-full flex items-center justify-center flex-shrink-0`}>
                      {message.sender === 'other' ? (
                        <User className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Bot className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-lg p-3 ${message.sender === 'user'
                      ? 'bg-green-600 text-white'
                      : message.sender === 'other'
                        ? 'bg-blue-100 text-gray-900'
                        : 'bg-gray-100 text-gray-900'
                      }`}
                  >
                    {message.senderName && message.sender === 'other' && (
                      <p className="text-xs font-semibold text-blue-600 mb-1">{message.senderName}</p>
                    )}
                    {message.isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <p className="text-sm">Typing...</p>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    )}
                    {!message.isLoading && (
                      <p
                        className={`text-xs mt-1 ${message.sender === 'user' ? 'text-green-100' : 'text-gray-500'
                          }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                  {message.sender === 'user' && (
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                  )}
                </div>

                {/* Suggestions */}
                {message.suggestions && (
                  <div className="flex flex-wrap gap-2 mt-2 ml-10">
                    {message.suggestions.map((suggestion, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input Area */}
          <div className="p-4 border-t flex-shrink-0">
            <div className="flex gap-2">
              <Input
                placeholder={chatContext?.chatEnabled
                  ? `Message ${chatContext.targetName}...`
                  : roleConfig.placeholder}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className={chatContext?.chatEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {chatContext?.chatEnabled
                ? 'Chatting directly • Click ← to exit'
                : 'Press Enter to send'}
            </p>
          </div>
        </Card>
      )}
    </>
  );
}
