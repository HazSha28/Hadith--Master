import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Users, MessageCircle, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  isOwn?: boolean;
}

interface User {
  id: string;
  username: string;
  isOnline?: boolean;
}

const SimpleCommunityChat: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simulated chat data
  useEffect(() => {
    // Simulate online users
    const mockUsers: User[] = [
      { id: '1', username: 'Ahmed', isOnline: true },
      { id: '2', username: 'Fatima', isOnline: true },
      { id: '3', username: 'Mohammed', isOnline: false },
      { id: '4', username: 'Aisha', isOnline: true },
      { id: '5', username: 'Abdullah', isOnline: true },
    ];
    setOnlineUsers(mockUsers);

    // Simulate initial messages
    const mockMessages: Message[] = [
      {
        id: '1',
        userId: '1',
        username: 'Ahmed',
        content: 'Assalamu Alaikum! Welcome to community chat!',
        timestamp: new Date(Date.now() - 3600000),
        isOwn: false,
      },
      {
        id: '2',
        userId: '2',
        username: 'Fatima',
        content: 'This is a great place to learn about hadiths together.',
        timestamp: new Date(Date.now() - 3000000),
        isOwn: false,
      },
    ];
    setMessages(mockMessages);
    setIsConnected(true);

    // Auto-scroll to bottom
    scrollToBottom();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleJoinChat = () => {
    if (!username.trim()) {
      toast({
        title: 'Username Required',
        description: 'Please enter a username to join chat.',
        variant: 'destructive',
      });
      return;
    }

    setIsConnected(true);
    toast({
      title: 'Joined Chat',
      description: `Welcome to the community chat, ${username}!`,
    });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !username.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      userId: user?.uid || 'anonymous',
      username: username || 'Anonymous',
      content: newMessage.trim(),
      timestamp: new Date(),
      isOwn: true,
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    scrollToBottom();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col h-[400px] items-center justify-center p-4">
        <div className="text-center space-y-4">
          <MessageCircle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Community Chat</h3>
          <p className="text-muted-foreground mb-4">
            Join the community chat to discuss hadiths and learn from others.
          </p>
          <div className="space-y-2 max-w-xs mx-auto">
            <Input
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-center"
            />
            <Button 
              onClick={handleJoinChat}
              className="w-full"
            >
              Join Chat
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          <span className="font-medium text-sm">Community Chat</span>
          <span className="text-xs text-muted-foreground">
            ({onlineUsers.filter(u => u.isOnline).length} online)
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{onlineUsers.length} members</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Messages */}
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-3">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex gap-2 ${
                  message.isOwn ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  message.isOwn 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {message.username.charAt(0).toUpperCase()}
                </div>
                <div className={`max-w-[80%] space-y-1 ${
                  message.isOwn ? 'items-end' : 'items-start'
                }`}>
                  <div className={`text-xs text-muted-foreground ${
                    message.isOwn ? 'text-right' : 'text-left'
                  }`}>
                    {message.username} • {formatTime(message.timestamp)}
                  </div>
                  <div className={`rounded-lg p-2 text-sm ${
                    message.isOwn 
                      ? 'bg-primary text-primary-foreground ml-auto' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Message Input */}
      <div className="p-3 border-t bg-muted/30">
        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimpleCommunityChat;
