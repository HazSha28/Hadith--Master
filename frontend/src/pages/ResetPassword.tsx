import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  verifyPasswordResetCode,
  confirmPasswordReset
} from "firebase/auth";
import { auth } from "../firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Key, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get("oobCode"); // 🔑 Firebase token
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!oobCode) {
      setValid(false);
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then(() => setValid(true))
      .catch(() => setValid(false));
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirm) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode!, password);

      toast({
        title: "Success 🎉",
        description: "Password reset successfully"
      });

      navigate("/login");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (valid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (valid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full p-6 text-center">
          <CardTitle>Invalid or Expired Link</CardTitle>
          <p className="mt-4 text-sm text-muted-foreground">
            Please request a new password reset.
          </p>
          <Button asChild className="mt-4">
            <Link to="/forgot-password">Try Again</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <Input
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={loading}
            />
            <Button className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Key className="mr-2" />
                  Reset Password
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-sm inline-flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
