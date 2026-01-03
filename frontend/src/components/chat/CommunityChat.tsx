import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Users,
  MessageCircle,
  Bell,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ---------------- INIT MOCK DATA ---------------- */
  useEffect(() => {
    setOnlineUsers([
      { id: "1", username: "Ahmed", isOnline: true },
      { id: "2", username: "Fatima", isOnline: true },
      { id: "3", username: "Mohammed", isOnline: false },
      { id: "4", username: "Aisha", isOnline: true },
    ]);

    setMessages([
      {
        id: "1",
        userId: "1",
        username: "Ahmed",
        content: "Assalamu Alaikum! Any advice for beginners?",
        timestamp: new Date(),
      },
      {
        id: "2",
        userId: "2",
        username: "Fatima",
        content: "Start with Sahih Bukhari and Sahih Muslim.",
        timestamp: new Date(),
      },
    ]);

    setNotifications([
      "📚 New Hadiths added today",
      "🌟 Tip: Use filters to refine search",
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const msg: Message = {
      id: Date.now().toString(),
      userId: user?.uid || "me",
      username: user?.fullName || "You",
      content: newMessage.trim(),
      timestamp: new Date(),
      isOwn: true,
    };

    setMessages((prev) => [...prev, msg]);
    setNewMessage("");
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  /* ---------------- UI ---------------- */
  return (
    <Card className="w-full h-full flex flex-col min-h-0">
      {/* HEADER */}
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Community Chat
            <span className="text-sm text-muted-foreground">
              ({onlineUsers.filter((u) => u.isOnline).length} online)
            </span>
          </div>

          <div className="relative">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-4 w-4" />
            </Button>

            {showNotifications && (
              <div className="absolute right-0 top-10 z-50 w-72 rounded-lg border bg-background shadow-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">Notifications</h4>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setNotifications([])}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notifications.map((n, i) => (
                    <div key={i} className="text-sm p-2 rounded bg-muted">
                      {n}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      {/* BODY */}
      <CardContent className="flex-1 min-h-0 p-0">
        <div className="grid grid-cols-1 lg:grid-cols-4 h-full min-h-0">
          {/* SIDEBAR */}
          <div className="lg:col-span-1 border-r bg-muted/30 p-4 overflow-y-auto">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members
            </h3>
            <div className="space-y-2">
              {onlineUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      u.isOnline ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  {u.username}
                </div>
              ))}
            </div>
          </div>

          {/* CHAT */}
          <div className="lg:col-span-3 flex flex-col min-h-0">
            {/* MESSAGES */}
            <ScrollArea className="flex-1 min-h-0 p-4">
              <div className="space-y-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${
                      m.isOwn ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 text-sm ${
                        m.isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="text-xs opacity-70 mb-1">
                        {m.username} • {formatTime(m.timestamp)}
                      </div>
                      {m.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* INPUT */}
            <div className="border-t p-4 flex gap-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityChat;
