import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Shield, Crown, AlertTriangle, CheckCircle, Clock, Star, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AdminMessage {
  id: string;
  senderId: string;
  senderType: 'user' | 'admin';
  content: string;
  timestamp: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'general' | 'technical' | 'content' | 'account' | 'report';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  assignedTo?: string;
}

interface Ticket {
  id: string;
  userId: string;
  username: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: Date;
  lastMessage: string;
  unreadCount: number;
}

const AdminChat: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'general',
    priority: 'normal',
    description: ''
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simulated tickets data
  useEffect(() => {
    const mockTickets: Ticket[] = [
      {
        id: 'TKT-001',
        userId: user?.uid || '',
        username: user?.displayName || 'Current User',
        subject: 'Issue with Hadith Search',
        category: 'technical',
        priority: 'normal',
        status: 'open',
        createdAt: new Date(Date.now() - 86400000),
        lastMessage: 'The search function is not returning results for certain keywords',
        unreadCount: 2,
      },
      {
        id: 'TKT-002',
        userId: 'user123',
        username: 'Ahmed Hassan',
        subject: 'Report inappropriate content',
        category: 'report',
        priority: 'high',
        status: 'in-progress',
        createdAt: new Date(Date.now() - 172800000),
        lastMessage: 'Found some content that needs review',
        unreadCount: 0,
      },
      {
        id: 'TKT-003',
        userId: 'user456',
        username: 'Fatima Zahra',
        subject: 'Account verification issue',
        category: 'account',
        priority: 'urgent',
        status: 'resolved',
        createdAt: new Date(Date.now() - 259200000),
        lastMessage: 'Thank you for resolving my account issue',
        unreadCount: 0,
      },
      {
        id: 'TKT-004',
        userId: 'admin',
        username: 'Seyad Ahmed Bashir',
        subject: 'Welcome to Hadith Master Support',
        category: 'general',
        priority: 'normal',
        status: 'open',
        createdAt: new Date(Date.now() - 60000),
        lastMessage: 'Assalamu Alaikum! How can I help you today?',
        unreadCount: 0,
      },
      {
        id: 'TKT-005',
        userId: 'admin2',
        username: 'Ayishathul Hazeena',
        subject: 'Technical Support Available',
        category: 'technical',
        priority: 'normal',
        status: 'open',
        createdAt: new Date(Date.now() - 30000),
        lastMessage: 'Hello! I\'m here to help with any technical issues you may have.',
        unreadCount: 0,
      },
    ];
    setTickets(mockTickets);
  }, [user]);

  // Simulated messages for selected ticket
  useEffect(() => {
    if (selectedTicket) {
      const mockMessages: AdminMessage[] = [
        {
          id: '1',
          senderId: selectedTicket.userId,
          senderType: 'user',
          content: `Subject: ${selectedTicket.subject}\n\n${selectedTicket.lastMessage}`,
          timestamp: selectedTicket.createdAt,
          priority: selectedTicket.priority as any,
          category: selectedTicket.category as any,
          status: 'open',
        },
        {
          id: '2',
          senderId: 'admin',
          senderType: 'admin',
          content: `Thank you for contacting support. I've received your ticket ${selectedTicket.id} and I'm looking into it.`,
          timestamp: new Date(selectedTicket.createdAt.getTime() + 300000),
          priority: selectedTicket.priority as any,
          category: selectedTicket.category as any,
          status: 'in-progress',
          assignedTo: 'Admin Support',
        },
        {
          id: '3',
          senderId: selectedTicket.userId,
          senderType: 'user',
          content: 'Thank you for the quick response. Is there any update on this issue?',
          timestamp: new Date(selectedTicket.createdAt.getTime() + 600000),
          priority: selectedTicket.priority as any,
          category: selectedTicket.category as any,
          status: 'in-progress',
        },
      ];
      setMessages(mockMessages);
    }
  }, [selectedTicket]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || !user) return;

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const message: AdminMessage = {
        id: Date.now().toString(),
        senderId: user.uid,
        senderType: 'user',
        content: newMessage.trim(),
        timestamp: new Date(),
        priority: selectedTicket.priority as any,
        category: selectedTicket.category as any,
        status: selectedTicket.status as any,
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');
      setIsLoading(false);
      scrollToBottom();

      // Update ticket's last message
      setTickets(prev => prev.map(t => 
        t.id === selectedTicket.id 
          ? { ...t, lastMessage: newMessage.trim(), createdAt: new Date() }
          : t
      ));

      toast({
        title: 'Message Sent',
        description: 'Your message has been sent to admin support',
      });
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateTicket = () => {
    if (!ticketForm.subject.trim() || !ticketForm.description.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const newTicket: Ticket = {
      id: `TKT-${Date.now()}`,
      userId: user?.uid || '',
      username: user?.displayName || 'User',
      subject: ticketForm.subject,
      category: ticketForm.category,
      priority: ticketForm.priority,
      status: 'open',
      createdAt: new Date(),
      lastMessage: ticketForm.description,
      unreadCount: 0,
    };

    setTickets(prev => [newTicket, ...prev]);
    setSelectedTicket(newTicket);
    setShowNewTicket(false);
    setTicketForm({ subject: '', category: 'general', priority: 'normal', description: '' });

    toast({
      title: 'Ticket Created',
      description: `Ticket ${newTicket.id} has been created successfully`,
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'normal': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return <MessageSquare className="h-4 w-4" />;
      case 'report': return <AlertTriangle className="h-4 w-4" />;
      case 'account': return <Shield className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please log in to contact admin support</p>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white dark:bg-gray-800">
      {/* Tickets List */}
      <div className="w-96 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Support Tickets</h3>
            <Button 
              onClick={() => setShowNewTicket(true)}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              New Ticket
            </Button>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                  selectedTicket?.id === ticket.id
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {ticket.id}
                      </span>
                      <Badge className={getPriorityColor(ticket.priority)} variant="secondary">
                        {ticket.priority}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1">
                      {ticket.subject}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {ticket.lastMessage}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(ticket.category)}
                    <Badge className={getStatusColor(ticket.status)} variant="outline">
                      {ticket.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDate(ticket.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedTicket ? (
          <>
            {/* Ticket Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {selectedTicket.subject}
                    </h4>
                    <Badge className={getPriorityColor(selectedTicket.priority)} variant="secondary">
                      {selectedTicket.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Ticket: {selectedTicket.id}</span>
                    <Badge className={getStatusColor(selectedTicket.status)} variant="outline">
                      {selectedTicket.status}
                    </Badge>
                    <span>Category: {selectedTicket.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Admin Support
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.senderType === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {message.senderType === 'admin' ? (
                          <Shield className="h-4 w-4" />
                        ) : (
                          'U'
                        )}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`max-w-[70%] space-y-1 ${
                      message.senderType === 'user' ? 'items-end' : 'items-start'
                    }`}>
                      <div className={`rounded-lg p-3 text-sm ${
                        message.senderType === 'user'
                          ? 'bg-emerald-600 text-white ml-auto'
                          : 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          {message.senderType === 'admin' && <Shield className="h-4 w-4" />}
                          <span className="font-medium">
                            {message.senderType === 'admin' ? 'Admin Support' : 'You'}
                          </span>
                        </div>
                        {message.content}
                      </div>
                      
                      <div className={`flex items-center gap-1 text-xs text-gray-400 ${
                        message.senderType === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}>
                        <span>{formatTime(message.timestamp)}</span>
                        {message.assignedTo && message.senderType === 'admin' && (
                          <span>Assigned to: {message.assignedTo}</span>
                        )}
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
                <Textarea
                  placeholder="Type your message to admin support..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 min-h-[80px] resize-none"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white self-end"
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
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Admin Support Center
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Get help from our admin team for technical issues, account problems, or content reports
              </p>
              <Button 
                onClick={() => setShowNewTicket(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Create New Ticket
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create Support Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <Input
                  placeholder="Brief description of your issue"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="general">General</option>
                  <option value="technical">Technical Issue</option>
                  <option value="content">Content Issue</option>
                  <option value="account">Account Problem</option>
                  <option value="report">Report Content</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={ticketForm.priority}
                  onChange={(e) => setTicketForm(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  placeholder="Detailed description of your issue"
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateTicket}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  Create Ticket
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowNewTicket(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminChat;
