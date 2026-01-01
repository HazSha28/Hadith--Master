import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Users, MessageCircle, Bell, CheckCircle, Crown, CreditCard, Star, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  isOwn?: boolean;
  isAI?: boolean;
}

interface User {
  id: string;
  username: string;
  isOnline?: boolean;
  isPremium?: boolean;
}

interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  credits: number;
  isPremium: boolean;
  createdAt: string;
}

const CommunityCenterChat: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simulated user profile data
  useEffect(() => {
    if (user) {
      // Simulate fetching user profile
      const mockProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        fullName: user.displayName || 'User',
        credits: 2, // Start with 2 credits for demo
        isPremium: false, // Regular user
        createdAt: new Date().toISOString(),
      };
      setUserProfile(mockProfile);
      setIsConnected(true);
    }
  }, [user]);

  // Simulated chat data
  useEffect(() => {
    // Simulate online users
    const mockUsers: User[] = [
      { id: '1', username: 'Ahmed', isOnline: true, isPremium: true },
      { id: '2', username: 'Fatima', isOnline: true, isPremium: false },
      { id: '3', username: 'Mohammed', isOnline: false, isPremium: false },
      { id: '4', username: 'Aisha', isOnline: true, isPremium: true },
      { id: '5', username: 'Abdullah', isOnline: true, isPremium: false },
    ];
    setOnlineUsers(mockUsers);

    // Simulate initial messages
    const mockMessages: Message[] = [
      {
        id: '1',
        userId: 'ai',
        username: 'Islamic Scholar AI',
        content: 'Assalamu Alaikum! Welcome to the Community Center. How can I help you learn about Hadith today?',
        timestamp: new Date(Date.now() - 3600000),
        isOwn: false,
        isAI: true,
      },
      {
        id: '2',
        userId: '1',
        username: 'Ahmed',
        content: 'Can you explain the importance of Sahih Bukhari in Islamic studies?',
        timestamp: new Date(Date.now() - 3000000),
        isOwn: false,
        isAI: false,
      },
      {
        id: '3',
        userId: 'ai',
        username: 'Islamic Scholar AI',
        content: 'Sahih Bukhari is considered the most authentic collection of hadiths, compiled by Imam al-Bukhari. It contains 7,563 hadiths and is second only to the Quran in authenticity among Sunni Muslims.',
        timestamp: new Date(Date.now() - 2400000),
        isOwn: false,
        isAI: true,
      },
    ];
    setMessages(mockMessages);
  }, []);

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

    setIsConnected(true);
    toast({
      title: 'Joined Chat',
      description: `Welcome to the community center, ${username}!`,
    });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    // Check if user is logged in
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    // Check credits
    if (userProfile && userProfile.credits <= 0) {
      toast({
        title: 'Credits Exhausted',
        description: 'You\'ve used your free enquiries. Please upgrade to Premium to continue.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const message: Message = {
        id: Date.now().toString(),
        userId: user.uid,
        username: user.displayName || username || 'User',
        content: newMessage.trim(),
        timestamp: new Date(),
        isOwn: true,
        isAI: false,
      };

      setMessages(prev => [...prev, message]);
      
      // Deduct credit
      if (userProfile) {
        setUserProfile(prev => prev ? { ...prev, credits: prev.credits - 1 } : null);
      }

      setNewMessage('');
      setIsLoading(false);
      scrollToBottom();

      toast({
        title: 'Query Submitted',
        description: 'Your question has been submitted to the community.',
      });
    }, 1000);
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

  const handleLogin = () => {
    navigate('/login');
    setShowLoginModal(false);
  };

  const handleSignup = () => {
    navigate('/signup');
    setShowLoginModal(false);
  };

  const handleUpgrade = () => {
    toast({
      title: 'Premium Features',
      description: 'Premium features coming soon! You\'ll get unlimited enquiries and exclusive access.',
    });
  };

  if (!user) {
    return (
      <div className="flex flex-col h-[500px] items-center justify-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
        <div className="text-center space-y-6 max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-emerald-200 dark:border-emerald-700">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Community Center
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Join our Islamic knowledge community to ask questions about Hadith, Islamic studies, and connect with scholars.
            </p>
            
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-4 border border-emerald-200 dark:border-emerald-700">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Free Enquiries</span>
                </div>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• 2 free questions per session</li>
                  <li>• Community discussions</li>
                  <li>• AI scholar assistance</li>
                </ul>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-4 border border-amber-200 dark:border-amber-700">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Premium Access</span>
                </div>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Unlimited enquiries</li>
                  <li>• Priority responses</li>
                  <li>• Exclusive content</li>
                  <li>• Advanced search features</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleLogin}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Sign In
              </Button>
              <Button 
                onClick={handleSignup}
                variant="outline"
                className="flex-1 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (userProfile && userProfile.credits <= 0 && !userProfile.isPremium) {
    return (
      <div className="flex flex-col h-[500px] items-center justify-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
        <div className="text-center space-y-6 max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-amber-200 dark:border-amber-700">
            <Shield className="h-12 w-12 mx-auto mb-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Credits Exhausted
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You've used your free enquiries. Upgrade to Premium to continue asking questions and unlock unlimited access to our Islamic knowledge community.
            </p>
            
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2">
                <Crown className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                <span className="text-lg font-bold text-amber-800 dark:text-amber-200">Premium Features</span>
              </div>
            </div>

            <Button 
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium"
            >
              Upgrade to Premium
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Community Center</h3>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                ({onlineUsers.filter(u => u.isOnline).length} online)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Credits Display */}
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-700">
            <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
              {userProfile?.credits || 0}/5 credits
            </span>
          </div>

          {/* Premium Badge */}
          {userProfile?.isPremium && (
            <Badge variant="secondary" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex gap-3 mb-4 ${
                  message.isOwn ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  message.isAI 
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white' 
                    : message.isOwn 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                }`}>
                  {message.isAI ? 'AI' : message.username.charAt(0).toUpperCase()}
                </div>
                <div className={`max-w-[70%] space-y-1 ${
                  message.isOwn ? 'items-end' : 'items-start'
                }`}>
                  <div className={`text-xs text-gray-500 dark:text-gray-400 ${
                    message.isOwn ? 'text-right' : 'text-left'
                  }`}>
                    {message.isAI ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500" />
                        {message.username}
                      </div>
                    ) : (
                      `${message.username} • ${formatTime(message.timestamp)}`
                    )}
                  </div>
                  <div className={`rounded-lg p-3 text-sm ${
                    message.isAI 
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/50 dark:to-teal-900/50 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                      : message.isOwn 
                      ? 'bg-emerald-600 text-white ml-auto' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
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
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex gap-2">
          <Input
            placeholder={
              userProfile && userProfile.credits > 0 
                ? "Ask about Hadith, Islamic knowledge, or join discussions..." 
                : "Credits exhausted. Upgrade to Premium to continue."
            }
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!user || (userProfile && userProfile.credits <= 0)}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!user || !newMessage.trim() || (userProfile && userProfile.credits <= 0) || isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isLoading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Upgrade Prompt */}
        {userProfile && userProfile.credits <= 0 && !userProfile.isPremium && (
          <div className="mt-3 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              You've used your free enquiries. 
              <Button 
                variant="link" 
                onClick={handleUpgrade}
                className="text-amber-600 dark:text-amber-400 p-0 h-auto font-medium"
              >
                Upgrade to Premium
              </Button>
              {' '}for unlimited access.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityCenterChat;
