import { Link, useLocation } from "react-router-dom";
import { Bell, User, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@/assets/logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

export const Header = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [showMessages, setShowMessages] = useState(false);

  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <img src={logo} alt="Hadith Master" className="h-12 w-12 object-contain" />
          <span className="text-xl font-semibold tracking-wide">HADITH MASTER</span>
        </Link>

        {/* Center Mode Switcher */}
        <div className="flex gap-2 bg-primary-foreground/10 p-1 rounded-lg">
          <Link to="/beginner">
            <Button
              variant={currentPath === "/beginner" ? "default" : "ghost"}
              className={
                currentPath === "/beginner"
                  ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                  : "text-primary-foreground hover:bg-primary-foreground/20"
              }
            >
              Beginner
            </Button>
          </Link>
          <Link to="/advanced">
            <Button
              variant={currentPath === "/advanced" ? "default" : "ghost"}
              className={
                currentPath === "/advanced"
                  ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                  : "text-primary-foreground hover:bg-primary-foreground/20"
              }
            >
              Advanced
            </Button>
          </Link>
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/20 relative"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-card">
              <SheetHeader>
                <SheetTitle>Notifications</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-accent/10 rounded-lg border border-border">
                  <p className="font-semibold text-card-foreground">Welcome to Hadith Master!</p>
                  <p className="text-sm text-muted-foreground mt-1">Start exploring authentic hadiths today.</p>
                  <p className="text-xs text-muted-foreground mt-2">2 hours ago</p>
                </div>
                <div className="p-4 bg-background rounded-lg border border-border">
                  <p className="font-semibold text-card-foreground">New Collection Added</p>
                  <p className="text-sm text-muted-foreground mt-1">Sunan Ibn Majah is now available.</p>
                  <p className="text-xs text-muted-foreground mt-2">1 day ago</p>
                </div>
                <div className="p-4 bg-background rounded-lg border border-border">
                  <p className="font-semibold text-card-foreground">Search Tips</p>
                  <p className="text-sm text-muted-foreground mt-1">Try using voice search for faster results!</p>
                  <p className="text-xs text-muted-foreground mt-2">3 days ago</p>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Sheet open={showMessages} onOpenChange={setShowMessages}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/20 relative"
              >
                <MessageSquare className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-card flex flex-col">
              <SheetHeader>
                <SheetTitle>Messages</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto mt-6 space-y-4">
                <div className="bg-accent/10 rounded-lg p-3">
                  <p className="text-sm font-medium text-card-foreground">Admin</p>
                  <p className="text-sm text-muted-foreground mt-1">Welcome! How can I help you today?</p>
                  <p className="text-xs text-muted-foreground mt-2">10:30 AM</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-3 ml-6">
                  <p className="text-sm font-medium text-card-foreground">You</p>
                  <p className="text-sm text-muted-foreground mt-1">I'm looking for hadiths about prayer.</p>
                  <p className="text-xs text-muted-foreground mt-2">10:32 AM</p>
                </div>
                <div className="bg-accent/10 rounded-lg p-3">
                  <p className="text-sm font-medium text-card-foreground">Admin</p>
                  <p className="text-sm text-muted-foreground mt-1">Try searching in Sahih Bukhari Book of Prayer.</p>
                  <p className="text-xs text-muted-foreground mt-2">10:33 AM</p>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex gap-2">
                  <Input placeholder="Type a message..." className="bg-input border-border" />
                  <Button size="icon" className="bg-accent hover:bg-accent/90">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover">
              <DropdownMenuItem asChild>
                <Link to="/login" className="cursor-pointer">
                  Login
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/signup" className="cursor-pointer">
                  Create Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/about" className="cursor-pointer">
                  About Us
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
