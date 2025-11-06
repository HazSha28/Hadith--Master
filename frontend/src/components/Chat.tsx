import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { Send } from "lucide-react";

interface Message {
  id: number;
  user: string;
  text: string;
  timestamp: string;
}

export const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      user: "Admin",
      text: "Welcome to the community chat!",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (newMessage.trim() && user) {
      setMessages([
        ...messages,
        {
          id: messages.length + 1,
          user: user.fullName,
          text: newMessage,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setNewMessage("");
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-sm text-foreground">
                  {message.user}
                </span>
                <span className="text-xs text-muted-foreground">
                  {message.timestamp}
                </span>
              </div>
              <p className="text-sm text-foreground">{message.text}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="bg-input"
        />
        <Button onClick={handleSend} size="icon" className="bg-accent hover:bg-accent/90">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
