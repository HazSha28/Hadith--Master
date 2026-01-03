import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, AlertTriangle, Clock, CheckCircle, Bot, User, Shield, Eye, MessageCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatMessage, chatService, ESCALATION_REASONS } from '@/lib/chatService';

interface AdminChatSession {
  id: string;
  userId: string;
  userName: string;
  status: 'active' | 'waiting' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  escalationReason: keyof typeof ESCALATION_REASONS;
  messages: ChatMessage[];
  startTime: Date;
  lastActivity: Date;
  assignedAdmin?: string;
  aiSuggestions: string[];
}

const AdminChatDashboard = () => {
  const [sessions, setSessions] = useState<AdminChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<AdminChatSession | null>(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [activeTab, setActiveTab] = useState('queue');
  const [stats, setStats] = useState({
    totalSessions: 0,
    activeChats: 0,
    waitingQueue: 0,
    resolvedToday: 0,
    averageResponseTime: 0,
    escalationByReason: {} as Record<string, number>
  });

  // Mock data for demonstration - in production, this would come from your backend
  useEffect(() => {
    const mockSessions: AdminChatSession[] = [
      {
        id: 'session-1',
        userId: 'user-123',
        userName: 'Ahmed Hassan',
        status: 'waiting',
        priority: 'high',
        escalationReason: 'FATWA_REQUEST',
        messages: [
          {
            id: 'msg-1',
            text: 'I need guidance on inheritance distribution according to Islamic law',
            sender: 'user',
            timestamp: new Date(Date.now() - 300000),
            metadata: { responder: 'USER', confidence: 'high', escalation: false }
          },
          {
            id: 'msg-2',
            text: 'This needs admin support. I\'m connecting you now.',
            sender: 'ai',
            timestamp: new Date(Date.now() - 240000),
            metadata: { responder: 'AI', confidence: 'high', escalation: true }
          }
        ],
        startTime: new Date(Date.now() - 300000),
        lastActivity: new Date(Date.now() - 240000),
        aiSuggestions: [
          'Draft response: "Thank you for your question regarding Islamic inheritance law. Our scholars are reviewing your inquiry and will provide you with proper scholarly guidance based on Quranic principles and authentic hadiths."'
        ]
      },
      {
        id: 'session-2',
        userId: 'user-456',
        userName: 'Fatima Al-Rashid',
        status: 'active',
        priority: 'medium',
        escalationReason: 'SENSITIVE_TOPIC',
        messages: [
          {
            id: 'msg-3',
            text: 'I\'m confused about hadith authenticity. How do we know which hadiths are authentic?',
            sender: 'user',
            timestamp: new Date(Date.now() - 600000),
            metadata: { responder: 'USER', confidence: 'high', escalation: false }
          },
          {
            id: 'msg-4',
            text: 'Admin has joined the chat. I\'ll be assisting you personally.',
            sender: 'admin',
            timestamp: new Date(Date.now() - 540000),
            metadata: { responder: 'ADMIN', confidence: 'high', escalation: false }
          }
        ],
        startTime: new Date(Date.now() - 600000),
        lastActivity: new Date(Date.now() - 540000),
        assignedAdmin: 'Admin Ahmed',
        aiSuggestions: []
      },
      {
        id: 'session-3',
        userId: 'user-789',
        userName: 'Omar Khalid',
        status: 'waiting',
        priority: 'urgent',
        escalationReason: 'PAYMENT_ISSUE',
        messages: [
          {
            id: 'msg-5',
            text: 'My premium subscription payment failed but I was charged. Please help!',
            sender: 'user',
            timestamp: new Date(Date.now() - 120000),
            metadata: { responder: 'USER', confidence: 'high', escalation: false }
          },
          {
            id: 'msg-6',
            text: 'This requires admin support. I\'m connecting you with our team now.',
            sender: 'ai',
            timestamp: new Date(Date.now() - 60000),
            metadata: { responder: 'AI', confidence: 'high', escalation: true }
          }
        ],
        startTime: new Date(Date.now() - 120000),
        lastActivity: new Date(Date.now() - 60000),
        aiSuggestions: [
          'Draft response: "I\'m sorry you\'re experiencing payment issues. I\'m reviewing your account now and will resolve this for you personally. Your satisfaction is important to us."'
        ]
      }
    ];

    setSessions(mockSessions);

    // Calculate stats
    const escalationCounts = mockSessions.reduce((acc, session) => {
      acc[session.escalationReason] = (acc[session.escalationReason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setStats({
      totalSessions: mockSessions.length,
      activeChats: mockSessions.filter(s => s.status === 'active').length,
      waitingQueue: mockSessions.filter(s => s.status === 'waiting').length,
      resolvedToday: 12, // Mock number
      averageResponseTime: 3.5, // Mock minutes
      escalationByReason: escalationCounts
    });
  }, []);

  // Handle accepting a session
  const handleAcceptSession = (sessionId: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, status: 'active' as const, assignedAdmin: 'Current Admin' }
        : session
    ));
  };

  // Handle sending admin message
  const handleSendMessage = () => {
    if (!adminMessage.trim() || !selectedSession) return;

    const newMessage: ChatMessage = {
      id: `admin-${Date.now()}`,
      text: adminMessage,
      sender: 'admin',
      timestamp: new Date(),
      metadata: {
        responder: 'ADMIN',
        confidence: 'high',
        escalation: false
      }
    };

    setSessions(prev => prev.map(session => 
      session.id === selectedSession.id 
        ? { ...session, messages: [...session.messages, newMessage], lastActivity: new Date() }
        : session
    ));

    setSelectedSession(prev => prev ? { ...prev, messages: [...prev.messages, newMessage] } : null);
    setAdminMessage('');
  };

  // Handle resolving a session
  const handleResolveSession = (sessionId: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, status: 'resolved' as const }
        : session
    ));
    setSelectedSession(null);
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Format wait time
  const formatWaitTime = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Admin Chat Dashboard</h1>
        <p className="text-muted-foreground">Manage user conversations and provide support</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Chats</p>
                <p className="text-2xl font-bold">{stats.activeChats}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Waiting Queue</p>
                <p className="text-2xl font-bold">{stats.waitingQueue}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{stats.averageResponseTime}m</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Chat Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="queue">Queue</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="resolved">Resolved</TabsTrigger>
                </TabsList>

                <TabsContent value="queue" className="mt-4">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {sessions.filter(s => s.status === 'waiting').map(session => (
                        <div
                          key={session.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedSession?.id === session.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedSession(session)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(session.priority)}`} />
                              <span className="font-medium text-sm">{session.userName}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {formatWaitTime(session.startTime)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {ESCALATION_REASONS[session.escalationReason]}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {session.priority}
                            </Badge>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptSession(session.id);
                              }}
                            >
                              Accept
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="active" className="mt-4">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {sessions.filter(s => s.status === 'active').map(session => (
                        <div
                          key={session.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedSession?.id === session.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedSession(session)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-green-500" />
                              <span className="font-medium text-sm">{session.userName}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {session.assignedAdmin}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {ESCALATION_REASONS[session.escalationReason]}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="resolved" className="mt-4">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {sessions.filter(s => s.status === 'resolved').map(session => (
                        <div
                          key={session.id}
                          className="p-3 border rounded-lg opacity-60"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="font-medium text-sm">{session.userName}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Resolved - {ESCALATION_REASONS[session.escalationReason]}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            {selectedSession ? (
              <>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedSession.userName}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{selectedSession.priority}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {ESCALATION_REASONS[selectedSession.escalationReason]}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Profile
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleResolveSession(selectedSession.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {selectedSession.messages.map(message => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.sender === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : message.sender === 'admin'
                                ? 'bg-green-100 border border-green-300'
                                : 'bg-gray-100 border border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {message.sender === 'user' && <User className="h-4 w-4" />}
                              {message.sender === 'ai' && <Bot className="h-4 w-4" />}
                              {message.sender === 'admin' && <Shield className="h-4 w-4" />}
                              <span className="text-xs font-medium">
                                {message.sender === 'user' ? 'User' : message.metadata.responder}
                              </span>
                              {message.metadata.escalation && (
                                <AlertTriangle className="h-3 w-3 text-orange-500" />
                              )}
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                            <span className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* AI Suggestions */}
                  {selectedSession.aiSuggestions.length > 0 && (
                    <div className="border-t p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-600">AI Suggestion</span>
                      </div>
                      <div className="bg-blue-50 p-2 rounded text-sm">
                        {selectedSession.aiSuggestions[0]}
                      </div>
                    </div>
                  )}

                  {/* Admin Input */}
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Textarea
                        value={adminMessage}
                        onChange={(e) => setAdminMessage(e.target.value)}
                        placeholder="Type your response as admin..."
                        className="flex-1 min-h-[60px] resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button onClick={handleSendMessage} disabled={!adminMessage.trim()}>
                        Send
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4" />
                  <p>Select a chat session to start responding</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminChatDashboard;
