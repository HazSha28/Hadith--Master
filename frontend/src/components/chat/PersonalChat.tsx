import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Search, User, Crown, Shield, Clock, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PersonalMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  delivered: boolean;
}

interface ChatUser {
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
}

interface PersonalChatProps {
  selectedUser?: ChatUser;
  onUserSelect?: (user: ChatUser) => void;
  showUserList?: boolean;
}

const PersonalChat: React.FC<PersonalChatProps> = ({ 
  selectedUser: propSelectedUser, 
  onUserSelect, 
  showUserList = true 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<PersonalMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(propSelectedUser || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simulated users data
  useEffect(() => {
    const mockUsers: ChatUser[] = [
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
    ];
    setUsers(mockUsers);
  }, []);

  // Simulated messages for selected user
  useEffect(() => {
    if (selectedUser && user) {
      const mockMessages: PersonalMessage[] = [
        {
          id: '1',
          senderId: selectedUser.id,
          receiverId: user.uid,
          content: `Assalamu Alaikum ${user.displayName || 'User'}!`,
          timestamp: new Date(Date.now() - 3600000),
          read: true,
          delivered: true,
        },
        {
          id: '2',
          senderId: user.uid,
          receiverId: selectedUser.id,
          content: 'Wa Alaikum Assalam! How are you today?',
          timestamp: new Date(Date.now() - 3000000),
          read: true,
          delivered: true,
        },
        {
          id: '3',
          senderId: selectedUser.id,
          receiverId: user.uid,
          content: 'I\'m doing well, thank you! I wanted to discuss something about the hadith collection.',
          timestamp: new Date(Date.now() - 2400000),
          read: true,
          delivered: true,
        },
        {
          id: '4',
          senderId: user.uid,
          receiverId: selectedUser.id,
          content: 'Of course! I\'d be happy to help. What would you like to know?',
          timestamp: new Date(Date.now() - 1800000),
          read: true,
          delivered: true,
        },
        {
          id: '5',
          senderId: selectedUser.id,
          receiverId: user.uid,
          content: selectedUser.lastMessage || 'Great! Let me ask my question...',
          timestamp: selectedUser.lastMessageTime || new Date(),
          read: false,
          delivered: true,
        },
      ];
      setMessages(mockMessages);
    }
  }, [selectedUser, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !user) return;

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const message: PersonalMessage = {
        id: Date.now().toString(),
        senderId: user.uid,
        receiverId: selectedUser.id,
        content: newMessage.trim(),
        timestamp: new Date(),
        read: false,
        delivered: true,
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
    }, 500);
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

  const handleUserSelect = (user: ChatUser) => {
    setSelectedUser(user);
    if (onUserSelect) {
      onUserSelect(user);
    }
    // Mark messages as read
    setUsers(prev => prev.map(u => 
      u.id === user.id ? { ...u, unreadCount: 0 } : u
    ));
  };

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? 'bg-green-500' : 'bg-gray-400';
  };

  const getRoleIcon = (isAdmin: boolean, isPremium: boolean) => {
    if (isAdmin) return <Shield className="h-3 w-3 text-blue-500" />;
    if (isPremium) return <Crown className="h-3 w-3 text-amber-500" />;
    return null;
  };

  const getMessageStatus = (message: PersonalMessage) => {
    if (message.read) return <CheckCheck className="h-4 w-4 text-blue-500" />;
    if (message.delivered) return <Check className="h-4 w-4 text-gray-400" />;
    return <Clock className="h-4 w-4 text-gray-300" />;
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
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Messages</h3>
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
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex gap-2">
                <Input
                  placeholder={`Message ${selectedUser.username}...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isLoading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
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

export default PersonalChat;
