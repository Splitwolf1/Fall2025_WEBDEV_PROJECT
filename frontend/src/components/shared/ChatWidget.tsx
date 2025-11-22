'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  suggestions?: string[];
  isLoading?: boolean;
}

interface ChatResponse {
  success: boolean;
  intent?: string;
  response: {
    text: string;
    quickReplies?: string[];
    data?: any;
  };
  timestamp: string;
  message?: string;
}

const initialMessages: Message[] = [
  {
    id: 1,
    sender: 'bot',
    text: 'Hi! I\'m your Farm-to-Table assistant. How can I help you today?',
    timestamp: new Date(),
    suggestions: [
      'Track my order',
      'Find products',
      'Contact support',
      'View suppliers',
    ],
  },
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');

  const CHATBOT_SERVICE_URL = process.env.NEXT_PUBLIC_CHATBOT_SERVICE_URL || 'http://localhost:3007';

  // Get user ID from localStorage or session (simplified for now)
  useEffect(() => {
    // In a real app, this would come from authentication
    const storedUserId = localStorage.getItem('userId') || '';
    setUserId(storedUserId);
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const messageText = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Add loading message
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
        headers: {
          'Content-Type': 'application/json',
        },
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
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: Date.now() + 3,
        sender: 'bot',
        text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment or contact our support team.",
        timestamp: new Date(),
        suggestions: ['Contact support', 'Try again'],
      };

      setMessages(prev => prev.filter(m => !m.isLoading).concat([errorMessage]));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
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
          <CardHeader className="bg-green-600 text-white rounded-t-lg flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center">
                  <Bot className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-white">Farm-to-Table AI</CardTitle>
                  <p className="text-xs text-green-100">Online • Ready to help</p>
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
                  className={`flex gap-2 ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.sender === 'bot' && (
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-5 w-5 text-green-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-lg p-3 ${
                      message.sender === 'user'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
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
                        className={`text-xs mt-1 ${
                          message.sender === 'user' ? 'text-green-100' : 'text-gray-500'
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
          </CardContent>

          {/* Input Area */}
          <div className="p-4 border-t flex-shrink-0">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-green-600 hover:bg-green-700"
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
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </Card>
      )}
    </>
  );
}
