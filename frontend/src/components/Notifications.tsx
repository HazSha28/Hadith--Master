import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const Notifications = () => {
  const notifications = [
    { id: 1, text: "Welcome to Hadith Master!", time: "Just now" },
    { id: 2, text: "New hadith collections available", time: "1 hour ago" },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/20 relative"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-popover" align="end">
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {notifications.map((notification) => (
            <div key={notification.id} className="space-y-1 border-b border-border pb-3 last:border-0">
              <p className="text-sm text-foreground">{notification.text}</p>
              <p className="text-xs text-muted-foreground">{notification.time}</p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
