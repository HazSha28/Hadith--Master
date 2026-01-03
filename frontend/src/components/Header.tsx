import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, MessageSquare, Moon, Sun, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/hooks/useAuth";
import { Notifications } from "./Notifications";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import ChatHub from "./chat/ChatHub";

export const Header = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [showMessages, setShowMessages] = useState(false);
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    try {
      await logout();
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

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
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          {user && <Notifications />}

          {/* Community Chat */}
          {user && (
            <Sheet open={showMessages} onOpenChange={setShowMessages}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-primary-foreground/20"
                  title="Community Center"
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-card w-full sm:max-w-4xl h-[85vh] p-0">
                <SheetHeader className="p-4 border-b bg-muted/30">
                  <SheetTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Chat Hub
                    <div className="ml-auto flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        All Conversations
                      </span>
                    </div>
                  </SheetTitle>
                </SheetHeader>
                <div className="h-full overflow-hidden">
                  <ChatHub />
                </div>
              </SheetContent>
            </Sheet>
          )}

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
              {user ? (
                <>
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    Logout
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/about" className="cursor-pointer">
                      About Us
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/help" className="cursor-pointer">
                      Help
                    </Link>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
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
                  <DropdownMenuItem asChild>
                    <Link to="/help" className="cursor-pointer">
                      Help
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
