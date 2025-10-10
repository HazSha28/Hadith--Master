import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (user) {
    navigate("/");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      navigate("/");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img src={logo} alt="Hadith Master" className="h-12 w-12 object-contain" />
            <span className="text-xl font-semibold tracking-wide">HADITH MASTER</span>
          </Link>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card className="bg-card shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-card-foreground">
                Login to Your Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    className="bg-input border-border"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="bg-input border-border"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-accent hover:underline">
                    Create Account
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Login;
