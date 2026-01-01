import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Users, MessageCircle, Clock, Bell, CheckCircle } from 'lucide-react';
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

const CommunityChat: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Simulated chat data (replace with real WebSocket/Socket.io implementation)
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
        content: 'Assalamu Alaikum! Does anyone have recommendations for beginners?',
        timestamp: new Date(Date.now() - 3600000),
        isOwn: false,
      },
      {
        id: '2',
        userId: '2',
        username: 'Fatima',
        content: 'I recommend starting with Sahih Bukhari, the hadiths are very authentic.',
        timestamp: new Date(Date.now() - 3000000),
        isOwn: false,
      },
      {
        id: '3',
        userId: '3',
        username: 'Mohammed',
        content: 'JazakAllah Khair! That\'s helpful advice.',
        timestamp: new Date(Date.now() - 2400000),
        isOwn: false,
      },
    ];
    setMessages(mockMessages);
    setIsConnected(true);

    // Daily notification system
    const dailyNotifications = [
      '📚 New hadith collection added: "Sahih Ibn Majah" is now available',
      '🌟 Daily hadith updated: Check out today\'s new hadith!',
      '💡 Tip of the day: Use the narrator filter to find hadiths by specific companions',
      '📈 Community milestone: 100+ active members this week!',
      '🎯 Achievement unlocked: Advanced search features mastered',
    ];

    // Add initial notifications
    setNotifications(dailyNotifications);

    // Simulate daily notification updates
    const notificationInterval = setInterval(() => {
      const randomNotification = dailyNotifications[Math.floor(Math.random() * dailyNotifications.length)];
      setNotifications(prev => {
        const updated = [randomNotification, ...prev.slice(0, 4)]; // Keep max 5 notifications
        return updated;
      });
      
      // Show toast for new notification
      toast({
        title: 'Daily Update',
        description: randomNotification,
      });
    }, 30000); // Update every 30 seconds

    // Auto-scroll to bottom
    scrollToBottom();

    return () => {
      clearInterval(notificationInterval);
    };
  }, [notifications]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleJoinChat = () => {
    if (!username.trim()) {
      toast({
        title: 'Username Required',
        description: 'Please enter a username to join the chat.',
        variant: 'destructive',
      });
      return;
    }

    setIsJoining(true);
    
    // Simulate joining chat (replace with real WebSocket connection)
    setTimeout(() => {
      setIsJoining(false);
      setIsConnected(true);
      toast({
        title: 'Joined Chat',
        description: `Welcome to the community chat, ${username}!`,
      });
    }, 1000);
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

    // Simulate sending message (replace with real WebSocket send)
    console.log('Sending message:', message);
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
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Community Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Join the community chat to discuss hadiths, ask questions, and learn from others.
              </p>
              <div className="max-w-md mx-auto space-y-2">
                <Input
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="text-center"
                />
                <Button 
                  onClick={handleJoinChat}
                  disabled={isJoining}
                  className="w-full"
                >
                  {isJoining ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                      Joining...
                    </>
                  ) : (
                    'Join Chat'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Community Chat
            <span className="ml-2 text-sm text-muted-foreground">
              ({onlineUsers.filter(u => u.isOnline).length} online)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{onlineUsers.length} members</span>
            </div>
          </div>
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-12 right-4 z-50 w-80 bg-background border border-border rounded-lg shadow-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Daily Notifications</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setNotifications([]);
                    setShowNotifications(false);
                  }}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No new notifications
                  </p>
                ) : (
                  notifications.map((notification, index) => (
                    <div 
                      key={index} 
                      className="p-3 bg-muted/50 rounded-lg border border-border"
                    >
                      <p className="text-sm">{notification}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date().toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-4 h-[600px]">
          {/* Online Users Sidebar */}
          <div className="lg:col-span-1 border-r bg-muted/30 p-4">
            <h3 className="font-semibold mb-4 text-sm">Online Members</h3>
            <div className="space-y-2">
              {onlineUsers.map((onlineUser) => (
                <div 
                  key={onlineUser.id} 
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="relative">
                    <div className={`w-2 h-2 rounded-full ${
                      onlineUser.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>
                  <span className="text-sm font-medium">{onlineUser.username}</span>
                  {onlineUser.isOnline && (
                    <span className="text-xs text-green-600">●</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3 flex flex-col">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4 border-b">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex gap-3 ${
                      message.isOwn ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      message.isOwn 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {message.username.charAt(0).toUpperCase()}
                    </div>
                    <div className={`max-w-[70%] space-y-1 ${
                      message.isOwn ? 'items-end' : 'items-start'
                    }`}>
                      <div className={`text-xs text-muted-foreground ${
                        message.isOwn ? 'text-right' : 'text-left'
                      }`}>
                        {message.username} • {formatTime(message.timestamp)}
                      </div>
                      <div className={`rounded-lg p-3 ${
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

            {/* Message Input */}
            <div className="p-4 border-t bg-muted/30">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                  disabled={!isConnected}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !isConnected}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityChat;
