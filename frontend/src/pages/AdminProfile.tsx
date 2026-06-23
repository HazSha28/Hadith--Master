import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Shield,
  Edit3,
  Save,
  X,
  Check,
  TrendingUp,
  Activity,
  Bookmark,
  Share2,
  MessageSquare,
  Globe,
  Phone,
  Briefcase,
  GraduationCap,
  Star,
  Trophy,
  Sparkles,
  Users,
  Database,
  BarChart3,
  Lock,
  Eye,
  Download,
  Upload,
  Zap,
  Crown,
  Key,
  AlertTriangle,
  CheckCircle,
  FileText,
  Hash,
  Target,
  Rocket,
  Command
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, updateDoc, serverTimestamp, collection, getDocs, query, where, orderBy, limit, count } from 'firebase/firestore';
import { db } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { isAdminEmail } from '@/config/adminConfig';
import { Link, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface UserStats {
  hadithsRead: number;
  hadithsLiked: number;
  hadithsShared: number;
  commentsPosted: number;
  studyStreak: number;
  totalStudyTime: number;
  lastActive: Date;
}

interface UserActivity {
  id: string;
  type: 'read' | 'liked' | 'shared' | 'commented' | 'admin_action';
  hadithText?: string;
  book?: string;
  timestamp: Date;
  details?: string;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalHadiths: number;
  newUsersToday: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  serverLoad: number;
  storageUsed: number;
  apiCalls: number;
}

interface SystemMetrics {
  uptime: string;
  responseTime: number;
  errorRate: number;
  activeConnections: number;
  cacheHitRate: number;
}

const AdminProfile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<UserActivity[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const isUserAdmin = currentUser && (isAdminEmail(currentUser.email) || profile?.role === 'admin');

  useEffect(() => {
    if (currentUser) {
      loadProfile();
      loadUserStats();
      loadAdminStats();
      loadSystemMetrics();
      loadRecentActivity();
      loadAdminLogs();
    }
  }, [currentUser]);

  const loadProfile = async () => {
    if (!currentUser) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setProfile(userDoc.data());
        setFormData(userDoc.data());
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    if (!currentUser) return;

    try {
      // Load user statistics
      const statsDoc = await getDoc(doc(db, 'userStats', currentUser.uid));
      if (statsDoc.exists()) {
        setUserStats(statsDoc.data() as UserStats);
      } else {
        // Default stats
        setUserStats({
          hadithsRead: 0,
          hadithsLiked: 0,
          hadithsShared: 0,
          commentsPosted: 0,
          studyStreak: 0,
          totalStudyTime: 0,
          lastActive: new Date()
        });
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const loadAdminStats = async () => {
    if (!isUserAdmin) return;

    try {
      // Get total users count
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;

      // Get active users (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const activeUsersQuery = query(
        collection(db, 'users'),
        where('lastActive', '>=', sevenDaysAgo)
      );
      const activeUsersSnapshot = await getDocs(activeUsersQuery);
      const activeUsers = activeUsersSnapshot.size;

      // Get total hadiths
      const hadithsSnapshot = await getDocs(collection(db, 'hadiths'));
      const totalHadiths = hadithsSnapshot.size;

      // Get new users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newUsersQuery = query(
        collection(db, 'users'),
        where('createdAt', '>=', today)
      );
      const newUsersSnapshot = await getDocs(newUsersQuery);
      const newUsersToday = newUsersSnapshot.size;

      setAdminStats({
        totalUsers,
        activeUsers,
        totalHadiths,
        newUsersToday,
        systemHealth: 'excellent',
        serverLoad: Math.floor(Math.random() * 100),
        storageUsed: Math.floor(Math.random() * 1000),
        apiCalls: Math.floor(Math.random() * 10000)
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
    }
  };

  const loadSystemMetrics = async () => {
    if (!isUserAdmin) return;

    // Mock system metrics - in real app, these would come from monitoring service
    setSystemMetrics({
      uptime: '99.9%',
      responseTime: 120,
      errorRate: 0.1,
      activeConnections: 1250,
      cacheHitRate: 94.5
    });
  };

  const loadRecentActivity = async () => {
    if (!currentUser) return;

    try {
      const activityQuery = query(
        collection(db, 'userActivity', currentUser.uid, 'activities'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const activitySnapshot = await getDocs(activityQuery);
      const activities = activitySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      setRecentActivity(activities as UserActivity[]);
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const loadAdminLogs = async () => {
    if (!isUserAdmin) return;

    try {
      // Mock admin logs - in real app, these would come from admin activity collection
      const mockLogs = [
        { id: '1', action: 'User management', details: 'Updated user permissions', timestamp: new Date(), severity: 'info' },
        { id: '2', action: 'Content moderation', details: 'Approved 5 new hadiths', timestamp: new Date(Date.now() - 3600000), severity: 'success' },
        { id: '3', action: 'System maintenance', details: 'Database backup completed', timestamp: new Date(Date.now() - 7200000), severity: 'info' },
        { id: '4', action: 'Security alert', details: 'Failed login attempt detected', timestamp: new Date(Date.now() - 10800000), severity: 'warning' }
      ];
      setAdminLogs(mockLogs);
    } catch (error) {
      console.error('Error loading admin logs:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    setSaving(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const updateData = {
        ...formData,
        fullName: formData.fullName || profile.fullName,
        displayName: formData.fullName || profile.fullName,
        location: formData.location || profile.location || '',
        bio: formData.bio || profile.bio || '',
        updatedAt: serverTimestamp()
      };

      await updateDoc(userRef, updateData);
      await updateProfile(currentUser, { displayName: updateData.displayName });

      setProfile({ ...profile, ...updateData });
      setEditDialogOpen(false);

      toast({
        title: 'Profile Updated Successfully',
        description: 'Your admin profile has been updated.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData(profile || {});
    setEditDialogOpen(false);
  };

  const getRoleBadge = (role?: string) => {
    if (role === 'admin') {
      return (
        <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-0">
          <Crown className="w-3 h-3 mr-1" />
          Super Admin
        </Badge>
      );
    } else if (role === 'moderator') {
      return (
        <Badge className="bg-gradient-to-r from-secondary to-primary text-primary-foreground border-0">
          <Shield className="w-3 h-3 mr-1" />
          Moderator
        </Badge>
      );
    }
    return null;
  };

  const getSystemHealthBadge = (health: string) => {
    const colors = {
      excellent: 'bg-green-100 text-green-800 border-green-200',
      good: 'bg-blue-100 text-blue-800 border-blue-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      critical: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <Badge className={colors[health as keyof typeof colors] || colors.good}>
        {health === 'excellent' && <CheckCircle className="w-3 h-3 mr-1" />}
        {health === 'warning' && <AlertTriangle className="w-3 h-3 mr-1" />}
        {health === 'critical' && <X className="w-3 h-3 mr-1" />}
        {health.charAt(0).toUpperCase() + health.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isUserAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
            <p className="text-gray-600 mb-6">This page is only available to administrators.</p>
            <Button onClick={() => navigate('/profile')}>
              Back to Profile
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Admin Profile Header */}
      <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Admin Avatar */}
            <div className="flex-shrink-0">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-2xl">
                  <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    {profile?.fullName?.charAt(0) || profile?.displayName?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-accent to-primary rounded-full p-2">
                  <Crown className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold">{profile?.fullName || profile?.displayName || 'Admin'}</h1>
                    {getRoleBadge(profile?.role)}
                  </div>
                  <p className="text-xl text-primary-foreground/80 mb-4">{profile?.email}</p>
                  
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
                      <Calendar className="h-4 w-4" />
                      Admin since {profile?.createdAt?.toDate?.() ?
                        new Date(profile.createdAt.toDate()).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }) :
                        'Unknown'
                      }
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
                      <Zap className="h-4 w-4" />
                      Super Admin Access
                    </div>
                  </div>

                  {profile?.bio && (
                    <p className="text-primary-foreground/90 leading-relaxed max-w-3xl mb-4">
                      {profile.bio}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-primary-foreground/70">
                      <Key className="h-4 w-4" />
                      <span>Full System Access</span>
                    </div>
                    <div className="flex items-center gap-2 text-primary-foreground/70">
                      <Shield className="h-4 w-4" />
                      <span>Security Clearance Level 5</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 ml-4">
                  <Link to="/admin/panel">
                    <Button className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border border-primary-foreground/30">
                      <Command className="h-4 w-4 mr-2" />
                      Admin Panel
                    </Button>
                  </Link>
                  <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border border-primary-foreground/30"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Edit Admin Profile</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Full Name</label>
                            <Input
                              value={formData.fullName || ''}
                              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                              placeholder="Enter your full name"
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <Input
                              value={profile?.email || ''}
                              disabled
                              className="bg-gray-50 border-gray-300 text-gray-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Location</label>
                            <Input
                              value={formData.location || ''}
                              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                              placeholder="City, Country"
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Bio</label>
                          <textarea
                            className="w-full p-3 border border-gray-300 rounded-lg resize-none min-h-[100px] focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                            value={formData.bio || ''}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            placeholder="Tell us about yourself and your role..."
                          />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                          <Button 
                            variant="outline" 
                            onClick={handleCancelEdit}
                            disabled={saving}
                            className="border-gray-300 hover:bg-gray-50"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {saving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Admin Statistics */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm border border-border">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Admin Dashboard Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {adminStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto mb-2">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div className="text-2xl font-bold text-foreground">{adminStats.totalUsers.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Users</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto mb-2">
                        <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="text-2xl font-bold text-foreground">{adminStats.activeUsers.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Active Users</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-accent/10 rounded-full mx-auto mb-2">
                        <BookOpen className="h-6 w-6 text-accent" />
                      </div>
                      <div className="text-2xl font-bold text-foreground">{adminStats.totalHadiths.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Hadiths</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full mx-auto mb-2">
                        <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="text-2xl font-bold text-foreground">{adminStats.newUsersToday}</div>
                      <div className="text-sm text-muted-foreground">New Today</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Metrics */}
            <Card className="shadow-sm border border-border">
              <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Database className="h-5 w-5 text-green-600 dark:text-green-400" />
                  System Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {systemMetrics && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Uptime</span>
                        {getSystemHealthBadge('excellent')}
                      </div>
                      <div className="text-xl font-semibold text-foreground">{systemMetrics.uptime}</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Response Time</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="text-xl font-semibold text-foreground">{systemMetrics.responseTime}ms</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Error Rate</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="text-xl font-semibold text-foreground">{systemMetrics.errorRate}%</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Active Connections</span>
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                      <div className="text-xl font-semibold text-foreground">{systemMetrics.activeConnections.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Cache Hit Rate</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="text-xl font-semibold text-foreground">{systemMetrics.cacheHitRate}%</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Server Load</span>
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      </div>
                      <div className="text-xl font-semibold text-foreground">{adminStats?.serverLoad || 0}%</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Admin Activity Logs */}
            <Card className="shadow-sm border border-border">
              <CardHeader className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                  Recent Admin Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {adminLogs.length > 0 ? (
                    adminLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          {log.severity === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {log.severity === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                          {log.severity === 'error' && <X className="h-4 w-4 text-red-600" />}
                          {log.severity === 'info' && <Eye className="h-4 w-4 text-blue-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{log.action}</p>
                          <p className="text-xs text-gray-500">{log.details}</p>
                          <p className="text-xs text-gray-400">
                            {log.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-600">No recent admin activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* User Statistics */}
            <Card className="shadow-sm border border-border">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Activity className="h-5 w-5 text-primary" />
                  Your Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {userStats && (
                  <>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Hadiths Read</span>
                      <span className="font-semibold text-foreground">{userStats.hadithsRead}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Hadiths Liked</span>
                      <span className="font-semibold text-foreground">{userStats.hadithsLiked}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Hadiths Shared</span>
                      <span className="font-semibold text-foreground">{userStats.hadithsShared}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Comments Posted</span>
                      <span className="font-semibold text-foreground">{userStats.commentsPosted}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Study Streak</span>
                      <span className="font-semibold text-foreground">{userStats.studyStreak} days</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Total Study Time</span>
                      <span className="font-semibold text-foreground">{userStats.totalStudyTime} min</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-sm border border-border">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Zap className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <Link to="/admin/panel">
                  <Button className="w-full justify-start" variant="outline">
                    <Command className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Button>
                </Link>
                <Link to="/admin/users">
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Button>
                </Link>
                <Link to="/admin/content">
                  <Button className="w-full justify-start" variant="outline">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Content Management
                  </Button>
                </Link>
                <Link to="/admin/analytics">
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                </Link>
                <Link to="/admin/settings">
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    System Settings
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent User Activity */}
            <Card className="shadow-sm border border-border">
              <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Your Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {recentActivity.length > 0 ? (
                    recentActivity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          {activity.type === 'read' && <BookOpen className="h-4 w-4 text-blue-600" />}
                          {activity.type === 'liked' && <Heart className="h-4 w-4 text-red-600" />}
                          {activity.type === 'shared' && <Share2 className="h-4 w-4 text-green-600" />}
                          {activity.type === 'commented' && <MessageSquare className="h-4 w-4 text-purple-600" />}
                          {activity.type === 'admin_action' && <Shield className="h-4 w-4 text-orange-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 capitalize">{activity.type.replace('_', ' ')}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {activity.hadithText || activity.book || activity.details || 'System action'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {activity.timestamp.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-600">No recent activity</p>
                    </div>
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

export default AdminProfile;
