import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Key, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  Settings,
  Users,
  MessageSquare,
  Lock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { ADMIN_CONFIG } from '../../config/adminConfig';

const AdminSetupGuide: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [adminUid, setAdminUid] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  const getCurrentUserUid = () => {
    if (currentUser) {
      setAdminUid(currentUser.uid);
      setCopied(true);
      navigator.clipboard.writeText(currentUser.uid);
      toast({
        title: 'UID Copied',
        description: 'Your user ID has been copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const setupAdminAccess = async () => {
    if (!currentUser || !adminUid.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid admin UID.',
        variant: 'destructive'
      });
      return;
    }

    setIsSettingUp(true);

    try {
      // Update current user to admin role
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        role: 'admin',
        status: 'approved',
        approvedBy: currentUser.uid,
        approvedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });

      toast({
        title: 'Admin Access Granted',
        description: 'You now have admin privileges. Please refresh the page.',
      });
    } catch (error) {
      console.error('Error setting up admin access:', error);
      toast({
        title: 'Setup Error',
        description: 'Failed to grant admin access. Please check your permissions.',
        variant: 'destructive'
      });
    } finally {
      setIsSettingUp(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: 'Copied',
      description: 'Text copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="text-center mb-8">
        <Shield className="h-16 w-16 mx-auto mb-4 text-blue-600" />
        <h1 className="text-3xl font-bold mb-2">Admin Panel Setup Guide</h1>
        <p className="text-muted-foreground">
          Follow these steps to configure admin access for the Hadith Master application
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Get Your UID */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Step 1: Get Your User ID
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              First, you need your Firebase Auth UID to configure admin access.
            </p>
            
            {currentUser ? (
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-1">Your Current User:</p>
                  <p className="text-sm">{currentUser.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    UID: {currentUser.uid.substring(0, 8)}...
                  </p>
                </div>
                
                <Button 
                  onClick={getCurrentUserUid}
                  className="w-full"
                  variant={copied ? "secondary" : "default"}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      UID Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy My UID
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please <a href="/login" className="text-blue-600 hover:underline">log in</a> to get your user ID.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Configure Admin UIDs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Step 2: Configure Admin Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add your UID to the admin configuration file.
            </p>
            
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-2">Edit this file:</p>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  src/config/adminConfig.ts
                </code>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium mb-2">Add your UID:</p>
                <code className="text-xs bg-blue-100 p-2 rounded block">
                  {`ADMIN_UIDS: [
  "${adminUid || 'your-uid-here'}",
  // "other-admin-uid-here"
]`}
                </code>
              </div>
              
              <Button
                onClick={() => copyToClipboard(adminUid || 'your-uid-here')}
                className="w-full"
                variant="outline"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Configuration
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Grant Admin Role */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Step 3: Grant Admin Role
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set your user role to admin in the database.
            </p>
            
            <div className="space-y-3">
              <Input
                placeholder="Enter your admin UID"
                value={adminUid}
                onChange={(e) => setAdminUid(e.target.value)}
              />
              
              <Button
                onClick={setupAdminAccess}
                disabled={isSettingUp || !adminUid.trim()}
                className="w-full"
              >
                {isSettingUp ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Setting Up...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Grant Admin Access
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Step 4: Access Admin Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Step 4: Access Admin Panel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Once configured, you can access the admin panel.
            </p>
            
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium mb-2">Admin Panel URL:</p>
                <code className="text-xs bg-green-100 p-2 rounded block">
                  /admin/panel
                </code>
              </div>
              
              <Button
                onClick={() => window.open('/admin/panel', '_blank')}
                className="w-full"
                variant="outline"
              >
                <Shield className="mr-2 h-4 w-4" />
                Open Admin Panel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Admin Panel Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <p className="font-medium">User Management</p>
                <p className="text-sm text-muted-foreground">
                  Approve, reject, and suspend user accounts
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <p className="font-medium">Comment Moderation</p>
                <p className="text-sm text-muted-foreground">
                  Review and approve scholar commentaries
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-purple-600 mt-1" />
              <div>
                <p className="font-medium">Role Management</p>
                <p className="text-sm text-muted-foreground">
                  Assign user roles and permissions
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notes */}
      <Alert className="mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Note:</strong> Only grant admin access to trusted individuals. 
          Admin users can approve/reject users and moderate all content on the platform.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default AdminSetupGuide;
