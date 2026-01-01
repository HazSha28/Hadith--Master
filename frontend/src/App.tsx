import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/auth/ErrorBoundary";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Beginner from "./pages/Beginner";
import Advanced from "./pages/Advanced";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import SearchResults from "./pages/SearchResults";
import FloatingChatButton from "./components/chat/FloatingChatButton";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="min-h-screen bg-background">
                <FloatingChatButton />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/beginner" element={
                    <ProtectedRoute>
                      <main><Beginner /></main>
                    </ProtectedRoute>
                  } />
                  <Route path="/advanced" element={
                    <ProtectedRoute>
                      <main><Advanced /></main>
                    </ProtectedRoute>
                  } />
                  <Route path="/search-results" element={
                    <ProtectedRoute>
                      <main><SearchResults /></main>
                    </ProtectedRoute>
                  } />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/about" element={
                    <main><About /></main>
                  } />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
