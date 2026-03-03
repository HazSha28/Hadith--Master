import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/Header';
import {
  User,
  Mail,
  Calendar,
  BookOpen,
  Heart,
  Settings,
  Award,
  Clock,
  MapPin,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, updateDoc, serverTimestamp, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { isAdminEmail } from '@/config/adminConfig';
import { Link } from 'react-router-dom';

const Profile: React.FC = () => {
  const { currentUser, profile: authProfile } = useAuth();
  const isUserAdmin = authProfile?.role === 'admin' || isAdminEmail(currentUser?.email);
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [savedHadiths, setSavedHadiths] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    if (authProfile) {
      setProfile(authProfile);
      setFormData(authProfile);
      setLoading(false);
    }
  }, [authProfile]);

  useEffect(() => {
    if (currentUser) {
      loadUserStats();
    }
  }, [currentUser]);

  const loadUserStats = async () => {
    try {
      // Load saved hadiths
      const savedRef = collection(db, 'userCollections', currentUser.uid, 'savedHadiths');
      const savedSnapshot = await getDocs(savedRef);
      const savedData = savedSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          liked: data.liked || false,
          shared: data.shared || false
        };
      });
      setSavedHadiths(savedData);

      // Calculate stats
      const stats = {
        hadithsRead: savedData.length,
        hadithsLiked: savedData.filter(h => h.liked).length,
        hadithsShared: savedData.filter(h => h.shared).length,
        commentsPosted: 0 // TODO: Load from comments collection
      };
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    try {
      // Update Firebase Auth profile if displayName changed
      if (formData.fullName && formData.fullName !== profile.fullName) {
        await updateProfile(currentUser, { displayName: formData.fullName });
      }

      // Update Firestore profile
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        ...formData,
        updatedAt: serverTimestamp()
      });

      setProfile({ ...profile, ...formData });
      setEditing(false);

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      });
    }
  };

  const handleCancelEdit = () => {
    setFormData(profile || {});
    setEditing(false);
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      user: 'bg-blue-100 text-blue-800',
      scholar: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: 'secondary',
      approved: 'default',
      suspended: 'destructive'
    };

    const variant = variants[status as keyof typeof variants] || 'secondary';

    return (
      <Badge variant={variant}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground">Unable to load your profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Default Header */}
      <Header />

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-transparent via-muted/20 to-transparent border-b border-border">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-24 w-24 border-4 border-border">
              <AvatarFallback className="text-2xl font-bold bg-muted">
                {profile.fullName?.charAt(0) || profile.displayName?.charAt(0) || profile.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">
                {profile.fullName || profile.displayName || 'User'}
              </h1>
              <p className="text-lg text-muted-foreground mb-4">{profile.email}</p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                {isUserAdmin && (
                  <Badge className="bg-red-600 text-white hover:bg-red-700">Admin</Badge>
                )}
                {getRoleBadge(profile.role)}
                {profile.status !== 'approved' && getStatusBadge(profile.status)}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Joined {profile.createdAt?.toDate?.() ?
                    new Date(profile.createdAt.toDate()).toLocaleDateString() :
                    'Unknown'
                  }
                </div>
              </div>

              {isUserAdmin && (
                <div className="mt-4">
                  <Link to="/admin/panel">
                    <Button variant="destructive" size="sm">
                      <Shield className="h-4 w-4 mr-2" />
                      Manage Admin Panel
                    </Button>
                  </Link>
                </div>
              )}

              {profile.bio && (
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
                  {profile.bio}
                </p>
              )}
            </div>

            <div className="flex flex-col items-center md:items-end gap-3">
              {!editing && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditing(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
              {profile.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {profile.location}
                </div>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  {profile.website}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Edit Form */}
                {editing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Full Name</label>
                        <Input
                          value={formData.fullName || ''}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Location</label>
                        <Input
                          value={formData.location || ''}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="City, Country"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Website</label>
                        <Input
                          value={formData.website || ''}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Bio</label>
                      <textarea
                        className="w-full p-2 border rounded-md resize-none min-h-[100px]"
                        value={formData.bio || ''}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveProfile}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Click "Edit Profile" to update your information.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* User Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Your Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userStats && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Hadiths Read</span>
                      <span className="font-bold">{userStats.hadithsRead}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Hadiths Liked</span>
                      <span className="font-bold">{userStats.hadithsLiked}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Hadiths Shared</span>
                      <span className="font-bold">{userStats.hadithsShared}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Comments Posted</span>
                      <span className="font-bold">{userStats.commentsPosted}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Recent Saved Hadiths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Recent Saved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {savedHadiths.slice(0, 5).map((hadith) => (
                    <div key={hadith.id} className="p-3 border rounded-lg">
                      <p className="text-sm font-medium line-clamp-2">
                        {hadith.english?.text || hadith.arabic}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {hadith.book} - {hadith.chapter}
                      </p>
                    </div>
                  ))}
                  {savedHadiths.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No saved hadiths yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
