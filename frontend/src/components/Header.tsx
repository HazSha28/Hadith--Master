import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, MessageSquare } from "lucide-react";
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
import { Chat } from "./Chat";
import { useToast } from "@/hooks/use-toast";

export const Header = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [showMessages, setShowMessages] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      navigate("/login");
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
          {user && <Notifications />}

          {user && (
            <Sheet open={showMessages} onOpenChange={setShowMessages}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-card w-full sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle>Community Chat</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <Chat />
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
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
