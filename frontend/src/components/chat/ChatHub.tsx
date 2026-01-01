 import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  Users, 
  Shield, 
  Crown, 
  Search, 
  Bell,
  CreditCard,
  User,
  HeadphonesIcon
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import CommunityCenterChat from './CommunityCenterChat';
import RealTimePersonalChat from './RealTimePersonalChat';
import AdminChat from './AdminChat';

interface ChatHubProps {
  defaultTab?: string;
}

const ChatHub: React.FC<ChatHubProps> = ({ defaultTab = 'community' }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [unreadCounts, setUnreadCounts] = useState({
    community: 3,
    personal: 5,
    admin: 1,
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Reset unread count for the selected tab
    setUnreadCounts(prev => ({ ...prev, [tab]: 0 }));
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'community':
        return <Users className="h-4 w-4" />;
      case 'personal':
        return <MessageCircle className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'community':
        return 'Community';
      case 'personal':
        return 'Personal';
      case 'admin':
        return 'Admin Support';
      default:
        return tab;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
        <Card className="max-w-md mx-4">
          <CardHeader className="text-center">
            <HeadphonesIcon className="h-12 w-12 mx-auto mb-4 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-2xl">Chat Hub</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Connect with our community, get personal support, and reach admin help - all in one place!
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div className="text-left">
                  <h4 className="font-medium">Community Chat</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Join discussions with other users</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div className="text-left">
                  <h4 className="font-medium">Personal Messages</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">One-on-one conversations</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div className="text-left">
                  <h4 className="font-medium">Admin Support</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Get help from our team</p>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Sign in to access all chat features
              </p>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                Sign In to Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Chat Hub Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HeadphonesIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Chat Hub
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                All your conversations in one place
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700">
              <CreditCard className="h-3 w-3 mr-1" />
              5 Credits
            </Badge>
            {user && (
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700">
                <Crown className="h-3 w-3 mr-1" />
                {user.displayName || 'User'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Chat Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
          <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4">
            <TabsList className="grid w-full grid-cols-3 bg-transparent">
              {(['community', 'personal', 'admin'] as const).map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="relative data-[state=active]:bg-emerald-50 dark:data-[state=active]:bg-emerald-900/30 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300 border-0"
                >
                  <div className="flex items-center gap-2">
                    {getTabIcon(tab)}
                    <span className="hidden sm:inline">{getTabLabel(tab)}</span>
                    {unreadCounts[tab as keyof typeof unreadCounts] > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs ml-1"
                      >
                        {unreadCounts[tab as keyof typeof unreadCounts]}
                      </Badge>
                    )}
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            <TabsContent value="community" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <CommunityCenterChat />
            </TabsContent>
            
            <TabsContent value="personal" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <RealTimePersonalChat />
            </TabsContent>
            
            <TabsContent value="admin" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <AdminChat />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default ChatHub;
