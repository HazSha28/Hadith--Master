import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, MessageSquare, Moon, Sun, Users, Menu, X, BookOpen, Home, Search, Mic, LogOut, Shield } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/config/adminConfig";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import ChatHub from "./chat/ChatHub";

export const Header = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [showMessages, setShowMessages] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, profile, signOut } = useAuth();
  const isUserAdmin = profile?.role === 'admin' || isAdminEmail(currentUser?.email);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    try {
      await signOut();
      setMobileMenuOpen(false);
      toast({ title: "Logged out successfully" });
      navigate("/login");
    } catch {
      toast({ title: "Failed to logout", variant: "destructive" });
    }
  };

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      onClick={() => setMobileMenuOpen(false)}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
        ${currentPath === to
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-muted text-foreground'
        }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-2">

        {/* ── Logo ── */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity flex-shrink-0">
          <img src={logo} alt="Hadith Master" className="h-10 w-10 object-contain" />
          <span className="hidden sm:inline text-lg font-semibold tracking-wide">HADITH MASTER</span>
        </Link>

        {/* ── Center Mode Switcher (desktop only) ── */}
        <div className="hidden md:flex gap-2 bg-primary-foreground/10 p-1 rounded-lg">
          <Link to="/beginner">
            <Button
              variant={currentPath === "/beginner" ? "default" : "ghost"}
              size="sm"
              className={currentPath === "/beginner"
                ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                : "text-primary-foreground hover:bg-primary-foreground/20"}
            >
              Beginner
            </Button>
          </Link>
          <Link to="/advanced">
            <Button
              variant={currentPath === "/advanced" ? "default" : "ghost"}
              size="sm"
              className={currentPath === "/advanced"
                ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                : "text-primary-foreground hover:bg-primary-foreground/20"}
            >
              Advanced
            </Button>
          </Link>
        </div>

        {/* ── Right Icons ── */}
        <div className="flex items-center gap-1">

          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme}
            className="text-primary-foreground hover:bg-primary-foreground/20">
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          {/* Community Chat (desktop) */}
          {currentUser && (
            <Sheet open={showMessages} onOpenChange={setShowMessages}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"
                  className="hidden sm:inline-flex text-primary-foreground hover:bg-primary-foreground/20"
                  title="Community Center">
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-card w-full sm:max-w-4xl p-0 flex flex-col">
                <SheetHeader className="p-4 border-b bg-muted/30 flex-shrink-0">
                  <SheetTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Chat Hub
                    <div className="ml-auto flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">All Conversations</span>
                    </div>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-hidden">
                  <ChatHub />
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* User Dropdown (desktop) */}
          <div className="hidden sm:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"
                  className="text-primary-foreground hover:bg-primary-foreground/20">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover">
                {currentUser ? (
                  <>
                    {isUserAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin/panel" className="cursor-pointer text-red-600 font-bold">Admin Panel</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">Logout</DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/about" className="cursor-pointer">About Us</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/help" className="cursor-pointer">Help</Link>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/login" className="cursor-pointer">Login</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/signup" className="cursor-pointer">Create Account</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/about" className="cursor-pointer">About Us</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/help" className="cursor-pointer">Help</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ── Hamburger (mobile only) ── */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex sm:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="relative ml-auto w-72 max-w-full h-full bg-background shadow-xl flex flex-col overflow-y-auto">
            {/* Drawer header */}
            <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground">
              <div className="flex items-center gap-2">
                <img src={logo} alt="Hadith Master" className="h-8 w-8 object-contain" />
                <span className="font-semibold">HADITH MASTER</span>
              </div>
              <Button variant="ghost" size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Nav links */}
            <div className="flex flex-col gap-1 p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase px-4 py-2">Study Mode</p>
              {navLink("/beginner", "🕌 Beginner")}
              {navLink("/advanced", "📚 Advanced")}

              <p className="text-xs font-semibold text-muted-foreground uppercase px-4 py-2 mt-2">Account</p>
              {currentUser ? (
                <>
                  {navLink("/profile", "👤 Profile")}
                  {isUserAdmin && navLink("/admin/panel", "🛡️ Admin Panel")}
                  {navLink("/about", "ℹ️ About Us")}
                  {navLink("/help", "❓ Help")}

                  {/* Community Chat in mobile menu */}
                  <button
                    onClick={() => { setMobileMenuOpen(false); setShowMessages(true); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted text-foreground transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Community Chat
                  </button>

                  <div className="mt-4 px-2">
                    <Button
                      variant="outline"
                      className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {navLink("/login", "🔑 Login")}
                  {navLink("/signup", "✨ Create Account")}
                  {navLink("/about", "ℹ️ About Us")}
                  {navLink("/help", "❓ Help")}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat sheet (opened from mobile menu too) */}
      {currentUser && (
        <Sheet open={showMessages} onOpenChange={setShowMessages}>
          <SheetContent side="right" className="bg-card w-full sm:max-w-4xl p-0 flex flex-col">
            <SheetHeader className="p-4 border-b bg-muted/30 flex-shrink-0">
              <SheetTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Chat Hub
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-hidden">
              <ChatHub />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </header>
  );
};
