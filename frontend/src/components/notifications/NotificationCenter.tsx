import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  X, 
  Settings, 
  MessageSquare, 
  Users, 
  Shield,
  Crown,
  Star,
  Heart,
  ThumbsUp
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import websocketService from '@/services/websocketService';

interface Notification {
  id: string;
  type: 'message' | 'user_status' | 'system' | 'community' | 'admin' | 'achievement' | 'welcome';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  metadata?: any;
}

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    soundEnabled: true,
    desktopNotifications: true,
    showPreview: true,
  });
  const notificationSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!user) return;

    // Initialize notification sound
    notificationSound.current = new Audio('/notification-sound.mp3');
    notificationSound.current.volume = 0.3;

    // Load initial notifications
    loadInitialNotifications();

    // Set up WebSocket listeners
    setupWebSocketListeners();

    // Request notification permissions
    requestNotificationPermissions();

    return () => {
      // Cleanup WebSocket listeners
      websocketService.off('connected', handleConnected);
      websocketService.off('disconnected', handleDisconnected);
      websocketService.off('newMessage', handleNewMessage);
      websocketService.off('userStatusChange', handleUserStatusChange);
      websocketService.off('systemNotification', handleSystemNotification);
      websocketService.off('communityUpdate', handleCommunityUpdate);
    };
  }, [user]);

  const loadInitialNotifications = () => {
    const initialNotifications: Notification[] = [
      {
        id: '1',
        type: 'welcome',
        title: 'Welcome to Hadith Master!',
        message: 'Start exploring hadiths and connect with our community',
        timestamp: new Date(Date.now() - 3600000),
        read: false,
        priority: 'normal',
        icon: <Star className="h-4 w-4 text-amber-500" />,
      },
      {
        id: '2',
        type: 'community',
        title: 'New Community Message',
        message: 'Ahmed Hassan asked about hadith authentication',
        timestamp: new Date(Date.now() - 1800000),
        read: false,
        priority: 'normal',
        icon: <Users className="h-4 w-4 text-emerald-500" />,
        action: {
          label: 'View Chat',
          onClick: () => handleViewChat('community'),
        },
      },
      {
        id: '3',
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: 'You\'ve read your first 10 hadiths',
        timestamp: new Date(Date.now() - 900000),
        read: true,
        priority: 'high',
        icon: <Crown className="h-4 w-4 text-purple-500" />,
      },
    ];
    setNotifications(initialNotifications);
  };

  const setupWebSocketListeners = () => {
    // Listen for new messages
    websocketService.on('newMessage', handleNewMessage);
    
    // Listen for user status changes
    websocketService.on('userStatusChange', handleUserStatusChange);
    
    // Listen for system notifications
    websocketService.on('systemNotification', handleSystemNotification);
    
    // Listen for community updates
    websocketService.on('communityUpdate', handleCommunityUpdate);
  };

  const handleNewMessage = (data: any) => {
    if (data.receiverId === user?.uid) {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'message',
        title: `New message from ${data.senderName}`,
        message: data.content,
        timestamp: new Date(),
        read: false,
        priority: 'normal',
        icon: <MessageSquare className="h-4 w-4 text-blue-500" />,
        action: {
          label: 'Reply',
          onClick: () => handleViewChat('personal', data.senderId),
        },
        metadata: { senderId: data.senderId },
      };
      
      addNotification(notification);
      showToast(notification);
    }
  };

  const handleUserStatusChange = (data: any) => {
    if (data.userId !== user?.uid) {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'user_status',
        title: `${data.username} is ${data.isOnline ? 'online' : 'offline'}`,
        message: data.isOnline ? 'Now available for chat' : 'Has gone offline',
        timestamp: new Date(),
        read: false,
        priority: 'low',
        icon: <Users className="h-4 w-4 text-gray-500" />,
      };
      
      addNotification(notification);
    }
  };

  const handleSystemNotification = (data: any) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type: 'system',
      title: data.title || 'System Notification',
      message: data.message,
      timestamp: new Date(),
      read: false,
      priority: data.priority || 'normal',
      icon: <Bell className="h-4 w-4 text-orange-500" />,
    };
    
    addNotification(notification);
    showToast(notification);
  };

  const handleCommunityUpdate = (data: any) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type: 'community',
      title: 'Community Update',
      message: data.message,
      timestamp: new Date(),
      read: false,
      priority: 'normal',
      icon: <Users className="h-4 w-4 text-emerald-500" />,
      action: {
        label: 'View Community',
        onClick: () => handleViewChat('community'),
      },
    };
    
    addNotification(notification);
  };

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep only last 50
    playNotificationSound();
    showDesktopNotification(notification);
  };

  const playNotificationSound = () => {
    if (settings.soundEnabled && notificationSound.current) {
      notificationSound.current.play().catch(e => console.log('Could not play notification sound:', e));
    }
  };

  const showDesktopNotification = (notification: Notification) => {
    if (settings.desktopNotifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
      });
    }
  };

  const showToast = (notification: Notification) => {
    if (notification.priority === 'high' || notification.priority === 'urgent') {
      toast({
        title: notification.title,
        description: notification.message,
        action: notification.action ? (
          <Button size="sm" onClick={notification.action.onClick}>
            {notification.action.label}
          </Button>
        ) : undefined,
      });
    }
  };

  const requestNotificationPermissions = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const handleViewChat = (type: string, userId?: string) => {
    // This would navigate to the appropriate chat
    console.log('Navigate to chat:', { type, userId });
    setIsOpen(false);
  };

  const getNotificationIcon = (notification: Notification) => {
    if (notification.icon) return notification.icon;
    
    switch (notification.type) {
      case 'message': return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'user_status': return <Users className="h-4 w-4 text-gray-500" />;
      case 'system': return <Bell className="h-4 w-4 text-orange-500" />;
      case 'community': return <Users className="h-4 w-4 text-emerald-500" />;
      case 'admin': return <Shield className="h-4 w-4 text-red-500" />;
      case 'achievement': return <Crown className="h-4 w-4 text-purple-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'normal': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'low': return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
      default: return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5 animate-pulse" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-background border border-border rounded-lg shadow-lg z-50 max-h-[500px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount}</Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={markAllAsRead}
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearAllNotifications}
                title="Clear all"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <ScrollArea className="flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="p-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border-l-4 mb-2 cursor-pointer transition-colors ${
                      notification.read ? 'opacity-60' : ''
                    } ${getPriorityColor(notification.priority)}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {notification.title}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        {notification.action && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              notification.action.onClick();
                            }}
                          >
                            {notification.action.label}
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="h-6 w-6"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="p-3 border-t flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Open settings
                console.log('Open notification settings');
              }}
            >
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
            <span className="text-xs text-muted-foreground">
              {notifications.length} total
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
