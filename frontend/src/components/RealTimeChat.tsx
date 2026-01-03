import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, AlertCircle, CheckCircle, Clock, Shield, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'admin';
  timestamp: Date;
  metadata: {
    responder: 'AI' | 'ADMIN';
    confidence: 'high' | 'medium' | 'low';
    escalation: boolean;
  };
  isTyping?: boolean;
}

interface AdminSuggestion {
  id: string;
  text: string;
  timestamp: Date;
}

const RealTimeChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAdminOnline, setIsAdminOnline] = useState(false);
  const [adminJoined, setAdminJoined] = useState(false);
  const [adminSuggestions, setAdminSuggestions] = useState<AdminSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if message requires admin escalation
  const requiresEscalation = (message: string): { required: boolean; reason: string } => {
    const escalationKeywords = [
      'fatwa', 'legal ruling', 'sect', 'dispute', 'authenticity',
      'admin', 'human support', 'talk to admin', 'confused', 'emotional',
      'payment', 'premium', 'bug', 'error', 'login issue'
    ];

    const sensitiveKeywords = [
      'divorce', 'marriage', 'inheritance', 'finance', 'criminal',
      'political', 'controversial', 'scholarly debate'
    ];

    const lowerMessage = message.toLowerCase();

    // Check for explicit admin requests
    if (lowerMessage.includes('admin') || lowerMessage.includes('human support')) {
      return { required: true, reason: 'User explicitly requested admin support' };
    }

    // Check for fatwa/legal requests
    if (lowerMessage.includes('fatwa') || lowerMessage.includes('legal ruling')) {
      return { required: true, reason: 'User requested religious legal guidance' };
    }

    // Check for sensitive topics
    if (sensitiveKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return { required: true, reason: 'Sensitive religious topic requiring scholarly guidance' };
    }

    // Check for technical issues
    if (lowerMessage.includes('payment') || lowerMessage.includes('bug') || lowerMessage.includes('error')) {
      return { required: true, reason: 'Technical support required' };
    }

    return { required: false, reason: '' };
  };

  // Generate AI response
  const generateAIResponse = async (userMessage: string): Promise<ChatMessage> => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    let responseText = '';
    let confidence: 'high' | 'medium' | 'low' = 'high';
    let escalation = false;

    // Simple AI response logic (in production, this would call your AI service)
    if (userMessage.toLowerCase().includes('hadith')) {
      responseText = "I'm here to help you understand hadiths better. Could you please specify which hadith or topic you'd like to learn about? I can provide explanations, context, and references.";
      confidence = 'high';
    } else if (userMessage.toLowerCase().includes('search')) {
      responseText = "To search for hadiths, you can use the search bar on the main page. You can search by keywords, book names, or narrators. Would you like me to guide you through the search process?";
      confidence = 'high';
    } else if (userMessage.toLowerCase().includes('account') || userMessage.toLowerCase().includes('login')) {
      responseText = "For account and login issues, I'll need to connect you with our admin team who can access your account details securely. Let me escalate this for you.";
      confidence = 'medium';
      escalation = true;
    } else if (userMessage.toLowerCase().includes('premium') || userMessage.toLowerCase().includes('payment')) {
      responseText = "Payment and premium subscription questions require our admin team to review your account. I'm connecting you with them now.";
      confidence = 'medium';
      escalation = true;
    } else {
      responseText = "I'm here to help with your Hadith Master questions. Could you please provide more details about what you'd like to know? I can assist with hadith explanations, app features, or general Islamic learning topics.";
      confidence = 'medium';
    }

    return {
      id: `ai-${Date.now()}`,
      text: responseText,
      sender: 'ai',
      timestamp: new Date(),
      metadata: {
        responder: 'AI',
        confidence,
        escalation
      }
    };
  };

  // Generate admin suggestion (for admin interface)
  const generateAdminSuggestion = (userMessage: string): AdminSuggestion => {
    return {
      id: `suggestion-${Date.now()}`,
      text: `Draft response: "Thank you for your question about ${userMessage.substring(0, 50)}... Our team is reviewing this and will provide you with accurate scholarly guidance. Please allow us a moment to consult our resources."`,
      timestamp: new Date()
    };
  };

  // Handle message sending
  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
      metadata: {
        responder: 'USER',
        confidence: 'high',
        escalation: false
      }
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Check if escalation is needed
    const { required, reason } = requiresEscalation(inputText);
    
    if (required && !adminJoined) {
      setEscalationReason(reason);
      setIsAdminOnline(true);
      
      // Add escalation message
      const escalationMessage: ChatMessage = {
        id: `escalation-${Date.now()}`,
        text: "This needs admin support. I'm connecting you now.",
        sender: 'ai',
        timestamp: new Date(),
        metadata: {
          responder: 'AI',
          confidence: 'high',
          escalation: true
        }
      };

      setMessages(prev => [...prev, escalationMessage]);
      
      // Generate admin suggestion
      const suggestion = generateAdminSuggestion(inputText);
      setAdminSuggestions(prev => [...prev, suggestion]);
      
      // Simulate admin joining
      setTimeout(() => {
        setAdminJoined(true);
        setIsTyping(false);
        
        const adminJoinMessage: ChatMessage = {
          id: `admin-join-${Date.now()}`,
          text: "Admin has joined the chat. I'll be assisting you personally.",
          sender: 'admin',
          timestamp: new Date(),
          metadata: {
            responder: 'ADMIN',
            confidence: 'high',
            escalation: false
          }
        };
        
        setMessages(prev => [...prev, adminJoinMessage]);
      }, 2000);
      
      return;
    }

    // If admin is present, don't respond as AI
    if (adminJoined) {
      setIsTyping(false);
      // Generate suggestion for admin
      const suggestion = generateAdminSuggestion(inputText);
      setAdminSuggestions(prev => [...prev, suggestion]);
      return;
    }

    // Generate AI response
    try {
      const aiResponse = await generateAIResponse(inputText);
      setMessages(prev => [...prev, aiResponse]);
      
      // Check if AI itself recommends escalation
      if (aiResponse.metadata.escalation) {
        setEscalationReason('AI determined escalation needed');
        setIsAdminOnline(true);
        
        setTimeout(() => {
          setAdminJoined(true);
          
          const adminJoinMessage: ChatMessage = {
            id: `admin-join-${Date.now()}`,
            text: "Admin has joined the chat. I'll be assisting you personally.",
            sender: 'admin',
            timestamp: new Date(),
            metadata: {
              responder: 'ADMIN',
              confidence: 'high',
              escalation: false
            }
          };
          
          setMessages(prev => [...prev, adminJoinMessage]);
        }, 1500);
      }
    } catch (error) {
      console.error('AI response failed:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        text: "I apologize, but I'm having trouble responding right now. Let me connect you with our admin team.",
        sender: 'ai',
        timestamp: new Date(),
        metadata: {
          responder: 'AI',
          confidence: 'low',
          escalation: true
        }
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsAdminOnline(true);
    } finally {
      setIsTyping(false);
    }
  }, [inputText, adminJoined]);

  // Handle admin message (for demo purposes)
  const handleAdminMessage = (text: string) => {
    const adminMessage: ChatMessage = {
      id: `admin-${Date.now()}`,
      text,
      sender: 'admin',
      timestamp: new Date(),
      metadata: {
        responder: 'ADMIN',
        confidence: 'high',
        escalation: false
      }
    };
    
    setMessages(prev => [...prev, adminMessage]);
  };

  // Render message component
  const MessageComponent = ({ message }: { message: ChatMessage }) => (
    <div
      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
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
            {message.sender === 'user' ? 'You' : message.metadata.responder}
          </span>
          {message.metadata.escalation && (
            <AlertCircle className="h-3 w-3 text-orange-500" />
          )}
        </div>
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs opacity-70">
            {message.timestamp.toLocaleTimeString()}
          </span>
          <Badge
            variant={message.metadata.confidence === 'high' ? 'default' : 
                    message.metadata.confidence === 'medium' ? 'secondary' : 'destructive'}
            className="text-xs"
          >
            {message.metadata.confidence}
          </Badge>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-4xl mx-auto h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Hadith Master Support</CardTitle>
          <div className="flex items-center gap-2">
            {isAdminOnline && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-600">
                  {adminJoined ? 'Admin Online' : 'Admin Connecting...'}
                </span>
              </div>
            )}
            {!isAdminOnline && (
              <div className="flex items-center gap-1">
                <Bot className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-blue-600">AI Assistant</span>
              </div>
            )}
          </div>
        </div>
        {escalationReason && (
          <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
            <AlertCircle className="inline h-3 w-3 mr-1" />
            Escalation reason: {escalationReason}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <p className="mb-2">Welcome to Hadith Master Support!</p>
              <p className="text-sm">
                I'm here to help with hadith questions, app guidance, and general inquiries.
                For religious rulings and sensitive topics, I'll connect you with our admin team.
              </p>
            </div>
          )}
          
          {messages.map((message) => (
            <MessageComponent key={message.id} message={message} />
          ))}
          
          {isTyping && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  <span className="text-xs font-medium">AI</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Admin Suggestions Panel (only visible in development/demo) */}
        {adminSuggestions.length > 0 && (
          <div className="border-t p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-blue-600">Admin Suggestions</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuggestions(!showSuggestions)}
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${showSuggestions ? 'rotate-180' : ''}`} />
              </Button>
            </div>
            {showSuggestions && (
              <div className="space-y-2">
                {adminSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="bg-blue-50 p-2 rounded text-xs">
                    <p>{suggestion.text}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleAdminMessage(suggestion.text.replace('Draft response: ', ''))}
                    >
                      Use This Response
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                adminJoined 
                  ? "Type your message for admin..." 
                  : "Ask me about hadiths, app features, or Islamic learning..."
              }
              className="flex-1 min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isTyping}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              size="icon"
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground mt-2">
            {adminJoined 
              ? "Admin is responding. AI assistant is paused."
              : "AI responses are instant. Admin joins for sensitive questions."
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeChat;
