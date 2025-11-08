'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Send,
  Bot,
  User,
  Clock,
  CheckCircle,
  MessageSquare,
  Paperclip,
  Phone,
  Video,
  Loader2,
} from 'lucide-react';
import { auth } from '@/lib/auth';

interface Message {
  id: number;
  sender: 'user' | 'support' | 'bot';
  text: string;
  timestamp: Date;
  senderName?: string;
  attachments?: string[];
}

interface ChatThread {
  id: string;
  subject: string;
  lastMessage: string;
  timestamp: Date;
  status: 'open' | 'resolved';
  unread: number;
  agent?: string;
}

export default function RestaurantChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedThread, setSelectedThread] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'resolved'>('all');
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    // TODO: Fetch chat threads from backend when API is available
    setIsLoading(false);
  }, [router]);

  const filteredThreads = threads.filter(thread => {
    if (activeTab === 'all') return true;
    return thread.status === activeTab;
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    // TODO: Send message to backend when API is available
    const newMessage: Message = {
      id: messages.length + 1,
      sender: 'user',
      text: inputMessage,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'open' ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Open</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Resolved</Badge>
    );
  };

  return (
    <div className="p-6 h-[calc(100vh-4rem)]">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Chat Support</h1>
          <p className="text-gray-600 mt-1">Get help from our support team</p>
        </div>

        {/* Main Chat Interface */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          {/* Conversation List */}
          <Card className="lg:col-span-1 flex flex-col">
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="open">Open</TabsTrigger>
                  <TabsTrigger value="resolved">Resolved</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-3 space-y-2">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-gray-900">No conversations yet</h3>
                  <p className="text-xs text-gray-500 mt-1">Start a new conversation to get help</p>
                </div>
              ) : (
                filteredThreads.map((thread) => (
                  <Card
                    key={thread.id}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      selectedThread === thread.id ? 'ring-2 ring-green-500' : ''
                    }`}
                    onClick={() => setSelectedThread(thread.id)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-sm">{thread.subject}</h4>
                          {thread.unread > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {thread.unread}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">{thread.lastMessage}</p>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-gray-500">
                            <Clock className="h-3 w-3" />
                            {thread.timestamp.toLocaleDateString()} {thread.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {getStatusBadge(thread.status)}
                        </div>
                        {thread.agent && (
                          <p className="text-xs text-gray-500">Agent: {thread.agent}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}

              <Button className="w-full mt-4" variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Start New Conversation
              </Button>
            </CardContent>
          </Card>

          {/* Chat Messages */}
          <Card className="lg:col-span-2 flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedThread ? 'Chat Support' : 'Select a conversation'}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedThread ? 'Support Agent: Available' : 'Choose a conversation to view messages'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolve
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {!selectedThread ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No conversation selected</h3>
                    <p className="text-gray-500 mt-2">Select a conversation from the list or start a new one</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No messages yet</h3>
                    <p className="text-gray-500 mt-2">Start the conversation by sending a message</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                <div key={message.id}>
                  <div
                    className={`flex gap-3 ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.sender !== 'user' && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className={message.sender === 'bot' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                          {message.sender === 'bot' ? (
                            <Bot className="h-5 w-5" />
                          ) : (
                            message.senderName?.split(' ').map(n => n[0]).join('').slice(0, 2)
                          )}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-[70%] ${message.sender === 'user' ? 'order-2' : ''}`}>
                      {message.senderName && (
                        <p className="text-xs text-gray-500 mb-1 px-1">{message.senderName}</p>
                      )}
                      <div
                        className={`rounded-lg p-3 ${
                          message.sender === 'user'
                            ? 'bg-green-600 text-white'
                            : message.sender === 'bot'
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-blue-50 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
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
                      </div>
                    </div>
                    {message.sender === 'user' && (
                      <Avatar className="h-8 w-8 flex-shrink-0 order-3">
                        <AvatarFallback className="bg-purple-100 text-purple-700">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              ))
              )}
            </CardContent>

            {/* Input Area */}
            {selectedThread && (
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Press Enter to send • Shift+Enter for new line
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Help Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Quick Help</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">Track Order</Button>
              <Button variant="outline" size="sm">Report Issue</Button>
              <Button variant="outline" size="sm">Request Refund</Button>
              <Button variant="outline" size="sm">Change Delivery Time</Button>
              <Button variant="outline" size="sm">Product Question</Button>
              <Button variant="outline" size="sm">Billing Inquiry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
