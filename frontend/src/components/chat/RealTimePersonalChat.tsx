import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Send, 
  Search, 
  User, 
  Crown, 
  Shield, 
  Clock, 
  Check, 
  CheckCheck, 
  Circle,
  MoreVertical,
  Phone,
  Video,
  Info
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import websocketService from '@/services/websocketService';

interface RealTimeMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  delivered: boolean;
  typing?: boolean;
  edited?: boolean;
  deleted?: boolean;
}

interface RealTimeUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isTyping?: boolean;
}

interface RealTimePersonalChatProps {
  selectedUser?: RealTimeUser;
  onUserSelect?: (user: RealTimeUser) => void;
  showUserList?: boolean;
}

const RealTimePersonalChat: React.FC<RealTimePersonalChatProps> = ({ 
  selectedUser: propSelectedUser, 
  onUserSelect, 
  showUserList = true 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<RealTimeMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState<RealTimeUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<RealTimeUser | null>(propSelectedUser || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket connection and users
  useEffect(() => {
    if (!user) return;

    // Set up WebSocket listeners
    const handleConnected = () => {
      setConnectionStatus('connected');
      toast({
        title: 'Connected',
        description: 'Real-time chat is now active',
      });
    };

    const handleDisconnected = () => {
      setConnectionStatus('disconnected');
      toast({
        title: 'Disconnected',
        description: 'Real-time chat connection lost',
        variant: 'destructive',
      });
    };

    const handleNewMessage = (data: any) => {
      if ((data.senderId === user.uid && data.receiverId === selectedUser?.id) ||
          (data.receiverId === user.uid && data.senderId === selectedUser?.id)) {
        const message: RealTimeMessage = {
          id: data.id,
          senderId: data.senderId,
          receiverId: data.receiverId,
          content: data.content,
          timestamp: new Date(data.timestamp),
          read: data.read || false,
          delivered: true,
        };
        
        setMessages(prev => [...prev, message]);
        
        // Mark as read if it's a received message
        if (data.receiverId === user.uid) {
          markMessageAsRead(data.id);
        }
        
        scrollToBottom();
      }
    };

    const handleUserStatusChange = (data: any) => {
      setUsers(prev => prev.map(u => 
        u.id === data.userId 
          ? { ...u, isOnline: data.isOnline }
          : u
      ));
    };

    const handleUserTyping = (data: any) => {
      if (data.userId !== user?.uid && data.userId === selectedUser?.id) {
        setTypingUsers(prev => new Set(prev).add(data.userId));
        
        // Clear typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
        }, 3000);
      }
    };

    const handleMessageRead = (data: any) => {
      setMessages(prev => prev.map(m => 
        m.id === data.messageId 
          ? { ...m, read: true }
          : m
      ));
    };

    // Register listeners
    websocketService.on('connected', handleConnected);
    websocketService.on('disconnected', handleDisconnected);
    websocketService.on('newMessage', handleNewMessage);
    websocketService.on('userStatusChange', handleUserStatusChange);
    websocketService.on('userTyping', handleUserTyping);
    websocketService.on('messageRead', handleMessageRead);

    // Initialize users
    initializeUsers();

    // Force connection status to connected after a short delay for mock service
    const connectionTimer = setTimeout(() => {
      if (websocketService.isConnected()) {
        setConnectionStatus('connected');
      }
    }, 1500);

    return () => {
      websocketService.off('connected', handleConnected);
      websocketService.off('disconnected', handleDisconnected);
      websocketService.off('newMessage', handleNewMessage);
      websocketService.off('userStatusChange', handleUserStatusChange);
      websocketService.off('userTyping', handleUserTyping);
      websocketService.off('messageRead', handleMessageRead);
      clearTimeout(connectionTimer);
    };
  }, [user, selectedUser]);

  const initializeUsers = () => {
    const mockUsers: RealTimeUser[] = [
      {
        id: '1',
        username: 'Ahmed Hassan',
        email: 'ahmed@example.com',
        isOnline: true,
        isPremium: true,
        isAdmin: false,
        lastMessage: 'Can you help me with this hadith?',
        lastMessageTime: new Date(Date.now() - 300000),
        unreadCount: 2,
      },
      {
        id: '2',
        username: 'Fatima Zahra',
        email: 'fatima@example.com',
        isOnline: true,
        isPremium: false,
        isAdmin: false,
        lastMessage: 'JazakAllah Khair for your help!',
        lastMessageTime: new Date(Date.now() - 600000),
        unreadCount: 0,
      },
      {
        id: '3',
        username: 'Mohammed Ali',
        email: 'mohammed@example.com',
        isOnline: false,
        isPremium: false,
        isAdmin: false,
        lastMessage: 'See you tomorrow inshallah',
        lastMessageTime: new Date(Date.now() - 3600000),
        unreadCount: 1,
      },
      {
        id: '4',
        username: 'Seyad Ahmed Bashir',
        email: 'seyad@admin.com',
        isOnline: true,
        isPremium: true,
        isAdmin: true,
        lastMessage: 'How can I assist you today?',
        lastMessageTime: new Date(Date.now() - 120000),
        unreadCount: 0,
      },
      {
        id: '5',
        username: 'Ayishathul Hazeena',
        email: 'hazeena@admin.com',
        isOnline: true,
        isPremium: true,
        isAdmin: true,
        lastMessage: 'Welcome to our support chat!',
        lastMessageTime: new Date(Date.now() - 240000),
        unreadCount: 0,
      },
    ];
    setUsers(mockUsers);
  };

  // Load messages for selected user
  useEffect(() => {
    if (selectedUser && user) {
      loadMessages(selectedUser.id);
    }
  }, [selectedUser, user]);

  const loadMessages = async (userId: string) => {
    // Simulate loading messages from API
    const mockMessages: RealTimeMessage[] = [
      {
        id: '1',
        senderId: userId,
        receiverId: user.uid,
        content: `Assalamu Alaikum ${user.displayName || 'User'}!`,
        timestamp: new Date(Date.now() - 3600000),
        read: true,
        delivered: true,
      },
      {
        id: '2',
        senderId: user.uid,
        receiverId: userId,
        content: 'Wa Alaikum Assalam! How are you today?',
        timestamp: new Date(Date.now() - 3000000),
        read: true,
        delivered: true,
      },
      {
        id: '3',
        senderId: userId,
        receiverId: user.uid,
        content: 'I\'m doing well, thank you! I wanted to discuss something about the hadith collection.',
        timestamp: new Date(Date.now() - 2400000),
        read: true,
        delivered: true,
      },
      {
        id: '4',
        senderId: user.uid,
        receiverId: userId,
        content: 'Of course! I\'d be happy to help. What would you like to know?',
        timestamp: new Date(Date.now() - 1800000),
        read: true,
        delivered: true,
      },
      {
        id: '5',
        senderId: userId,
        receiverId: user.uid,
        content: selectedUser.lastMessage || 'Great! Let me ask my question...',
        timestamp: selectedUser.lastMessageTime || new Date(),
        read: false,
        delivered: true,
      },
    ];
    setMessages(mockMessages);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !user || connectionStatus !== 'connected') return;

    setIsLoading(true);

    const messageData = {
      id: Date.now().toString(),
      senderId: user.uid,
      receiverId: selectedUser.id,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    // Send via WebSocket
    websocketService.send('sendMessage', messageData);

    // Add to local state immediately for better UX
    const message: RealTimeMessage = {
      ...messageData,
      timestamp: new Date(messageData.timestamp),
      read: false,
      delivered: false,
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setIsLoading(false);
    scrollToBottom();

    // Update user's last message
    setUsers(prev => prev.map(u => 
      u.id === selectedUser.id 
        ? { ...u, lastMessage: newMessage.trim(), lastMessageTime: new Date() }
        : u
    ));

    toast({
      title: 'Message Sent',
      description: `Message sent to ${selectedUser.username}`,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping && selectedUser && connectionStatus === 'connected') {
      setIsTyping(true);
      websocketService.send('userTyping', {
        userId: user.uid,
        receiverId: selectedUser.id,
      });

      // Clear typing indicator after 3 seconds of inactivity
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        websocketService.send('userStopTyping', {
          userId: user.uid,
          receiverId: selectedUser.id,
        });
      }, 3000);
    }
  };

  const markMessageAsRead = (messageId: string) => {
    websocketService.send('markAsRead', { messageId });
  };

  const handleUserSelect = (user: RealTimeUser) => {
    setSelectedUser(user);
    if (onUserSelect) {
      onUserSelect(user);
    }
    // Mark messages as read
    setUsers(prev => prev.map(u => 
      u.id === user.id ? { ...u, unreadCount: 0 } : u
    ));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatLastMessageTime = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? 'bg-green-500' : 'bg-gray-400';
  };

  const getRoleIcon = (isAdmin: boolean, isPremium: boolean) => {
    if (isAdmin) return <Shield className="h-3 w-3 text-blue-500" />;
    if (isPremium) return <Crown className="h-3 w-3 text-amber-500" />;
    return null;
  };

  const getMessageStatus = (message: RealTimeMessage) => {
    if (message.read) return <CheckCheck className="h-4 w-4 text-blue-500" />;
    if (message.delivered) return <Check className="h-4 w-4 text-gray-400" />;
    return <Clock className="h-4 w-4 text-gray-300" />;
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connecting': return <Circle className="h-2 w-2 text-yellow-500 animate-pulse" />;
      case 'connected': return <Circle className="h-2 w-2 text-green-500" />;
      case 'disconnected': return <Circle className="h-2 w-2 text-red-500" />;
      default: return <Circle className="h-2 w-2 text-gray-500" />;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please log in to use personal chat</p>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white dark:bg-gray-800">
      {/* User List */}
      {showUserList && (
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                Messages
                {getConnectionStatusIcon()}
              </h3>
              <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
                {connectionStatus}
              </Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredUsers.map((chatUser) => (
                <div
                  key={chatUser.id}
                  onClick={() => handleUserSelect(chatUser)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedUser?.id === chatUser.id
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={chatUser.avatar} />
                      <AvatarFallback>
                        {chatUser.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(chatUser.isOnline)}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {chatUser.username}
                      </p>
                      {getRoleIcon(chatUser.isAdmin, chatUser.isPremium)}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {chatUser.lastMessage}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-gray-400">
                      {formatLastMessageTime(chatUser.lastMessageTime)}
                    </span>
                    {chatUser.unreadCount > 0 && (
                      <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {chatUser.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedUser.avatar} />
                      <AvatarFallback>
                        {selectedUser.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(selectedUser.isOnline)}`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        {selectedUser.username}
                      </h4>
                      {getRoleIcon(selectedUser.isAdmin, selectedUser.isPremium)}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedUser.isOnline ? 'Active now' : 'Offline'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.senderId === user.uid ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.senderId === user.uid ? user.photoURL : selectedUser.avatar} />
                      <AvatarFallback>
                        {message.senderId === user.uid ? 'You' : selectedUser.username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`max-w-[70%] space-y-1 ${message.senderId === user.uid ? 'items-end' : 'items-start'}`}>
                      <div className={`rounded-lg p-3 text-sm ${
                        message.senderId === user.uid
                          ? 'bg-emerald-600 text-white ml-auto'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {message.content}
                      </div>
                      
                      <div className={`flex items-center gap-1 text-xs text-gray-400 ${
                        message.senderId === user.uid ? 'flex-row-reverse' : 'flex-row'
                      }`}>
                        <span>{formatTime(message.timestamp)}</span>
                        {message.senderId === user.uid && getMessageStatus(message)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {typingUsers.has(selectedUser.id) && (
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{selectedUser.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex gap-2">
                <Input
                  placeholder={`Message ${selectedUser.username}...`}
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyPress={handleKeyPress}
                  disabled={connectionStatus !== 'connected'}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isLoading || connectionStatus !== 'connected'}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isLoading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {connectionStatus !== 'connected' && (
                <p className="text-xs text-red-500 mt-2">
                  Connection lost. Trying to reconnect...
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a user from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimePersonalChat;
