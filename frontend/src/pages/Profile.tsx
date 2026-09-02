import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/Header';
import {
  User, Mail, Calendar, BookOpen, Heart, Settings, Award,
  Clock, MapPin, Shield, Edit3, Save, X, TrendingUp,
  Activity, Bookmark, Share2, MessageSquare, Star, Trophy,
  Sparkles, Crown, Camera, ChevronRight, Flame, Target,
  BarChart2, BookMarked, Hash, Bell, Lock, LogOut, Loader2, Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  doc, getDoc, updateDoc, serverTimestamp,
  collection, query, orderBy, limit,
  onSnapshot                              // ← real-time listener
} from 'firebase/firestore';
import { db, storage } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { isAdminEmail } from '@/config/adminConfig';
import { Link, useNavigate } from 'react-router-dom';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/* ─── Types ─────────────────────────────────────────────── */
interface UserStats {
  hadithsRead: number;
  hadithsLiked: number;
  hadithsShared: number;
  commentsPosted: number;
  studyStreak: number;
  totalStudyTime: number;
  lastActive: Date | null;
}

/* ─── Helpers ────────────────────────────────────────────── */
const getInitials = (name?: string | null, email?: string | null) => {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  if (email) return email[0].toUpperCase();
  return 'U';
};

const formatDate = (ts: any) => {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const StatCard = ({
  icon: Icon, label, value, color, sub
}: { icon: any; label: string; value: number | string; color: string; sub?: string }) => (
  <div className={`rounded-2xl p-5 bg-gradient-to-br ${color} flex flex-col gap-2`}>
    <div className="flex items-center justify-between">
      <Icon className="h-5 w-5 opacity-80" />
      <span className="text-3xl font-bold">{value}</span>
    </div>
    <p className="text-sm font-medium opacity-90">{label}</p>
    {sub && <p className="text-xs opacity-70">{sub}</p>}
  </div>
);

/* ─── Component ──────────────────────────────────────────── */
const Profile = () => {
  const { currentUser, profile: authProfile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUserAdmin = authProfile?.role === 'admin' || isAdminEmail(currentUser?.email);

  const [profile, setProfile]         = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [formData, setFormData]       = useState<any>({});
  const [saving, setSaving]           = useState(false);
  const [editOpen, setEditOpen]       = useState(false);
  const [userStats, setUserStats]     = useState<UserStats | null>(null);
  const [savedHadiths, setSavedHadiths] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [avatarUploading, setAvatarUploading] = useState(false);

  /* Load profile */
  useEffect(() => {
    if (authProfile) {
      setProfile(authProfile);
      setFormData(authProfile);
      setLoading(false);
    } else if (currentUser) {
      (async () => {
        try {
          const snap = await getDoc(doc(db, 'users', currentUser.uid));
          const data = snap.exists()
            ? { role: 'user', status: 'pending', preferences: {}, ...snap.data() }
            : { uid: currentUser.uid, email: currentUser.email, displayName: currentUser.displayName || 'User', role: 'user', status: 'pending' };
          setProfile(data);
          setFormData(data);
        } catch { /* fallback */ } finally { setLoading(false); }
      })();
    } else { setLoading(false); }
  }, [authProfile, currentUser]);

  /* ── One-time sync: localStorage → Firestore ──────────────
   * Runs once per session. Reads saved hadiths from localStorage
   * and pushes any missing ones to Firestore so the profile stats work.
   */
  useEffect(() => {
    if (!currentUser) return;
    const SYNC_KEY = `ls_synced_v2_${currentUser.uid}`;
    if (sessionStorage.getItem(SYNC_KEY)) return; // already synced this session
    sessionStorage.setItem(SYNC_KEY, '1');

    (async () => {
      try {
        const { setDoc, doc: fsDoc } = await import('firebase/firestore');

        // Sync saved hadiths
        const raw = localStorage.getItem('savedHadiths');
        if (raw) {
          const saved = JSON.parse(raw) as any[];
          for (const h of saved) {
            if (!h?.id) continue;
            const englishText = typeof h.english === 'string' ? h.english : h.english?.text || '';
            await setDoc(
              fsDoc(db, 'userCollections', currentUser.uid, 'savedHadiths', String(h.id)),
              {
                ...h,
                english: typeof h.english === 'string'
                  ? { text: h.english, narrator: 'Unknown' }
                  : h.english || { text: '', narrator: 'Unknown' },
                savedAt: new Date(),
                liked: false,
                shared: false,
              },
              { merge: true }
            );
          }
          console.log(`[Profile] Synced ${saved.length} saved hadiths to Firestore`);
        }

        // Sync liked hadiths as activity entries
        const likedRaw = localStorage.getItem(`liked-hadiths-${currentUser.uid}`);
        if (likedRaw) {
          const likedIds = JSON.parse(likedRaw) as string[];
          const { setDoc, doc: fsDoc } = await import('firebase/firestore');
          for (const id of likedIds.slice(0, 100)) {
            // Use deterministic ID so re-sync doesn't create duplicates
            await setDoc(
              fsDoc(db, 'userActivity', currentUser.uid, 'activities', `liked_${id}`),
              {
                type:       'liked',
                hadithId:   id,
                hadithText: '',
                book:       '',
                timestamp:  new Date(),
              },
              { merge: true }
            );
          }
          console.log(`[Profile] Synced ${likedIds.length} likes to Firestore`);
        }
      } catch (err) {
        console.warn('[Profile] localStorage sync failed:', err);
      }
    })();
  }, [currentUser]);

  /* Load stats + activity — real-time listeners */
  useEffect(() => {
    if (!currentUser) return;

    // ── Listener 1: Saved hadiths (userCollections subcollection) ──
    const savedRef = collection(db, 'userCollections', currentUser.uid, 'savedHadiths');
    const unsubSaved = onSnapshot(savedRef, (snap) => {
      const saved = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      setSavedHadiths(saved);
      // Recalculate stats whenever saved hadiths change
      setUserStats(prev => prev
        ? {
            ...prev,
            hadithsRead:   saved.length,
            hadithsLiked:  saved.filter((h: any) => h.liked).length,
            hadithsShared: saved.filter((h: any) => h.shared).length,
          }
        : {
            hadithsRead:   saved.length,
            hadithsLiked:  saved.filter((h: any) => h.liked).length,
            hadithsShared: saved.filter((h: any) => h.shared).length,
            commentsPosted: 0,
            studyStreak:    0,
            totalStudyTime: 0,
            lastActive:     null,
          }
      );
    }, (err) => console.error('savedHadiths listener error:', err));

    // ── Listener 2: Activity log ──
    // Use a higher limit so we get all liked activities for counting
    const actRef = query(
      collection(db, 'userActivity', currentUser.uid, 'activities'),
      orderBy('timestamp', 'desc'),
      limit(200)
    );
    const unsubActivity = onSnapshot(actRef, (snap) => {
      const acts = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        timestamp: d.data().timestamp?.toDate?.() || new Date(),
      })) as any[];
      setRecentActivity(acts.slice(0, 20)); // show only 20 in activity tab
      // Recalculate all stats from activity
      const streak = calcStreak(acts);
      // Count unique liked hadith IDs (subtract unliked)
      const likedSet = new Set<string>();
      acts.forEach(a => {
        if (a.type === 'liked' && a.hadithId)   likedSet.add(a.hadithId);
        if (a.type === 'unliked' && a.hadithId) likedSet.delete(a.hadithId);
      });
      setUserStats(prev => prev
        ? {
            ...prev,
            hadithsLiked:   likedSet.size,
            commentsPosted: acts.filter(a => a.type === 'commented').length,
            hadithsShared:  acts.filter(a => a.type === 'shared').length,
            studyStreak:    streak,
            totalStudyTime: acts.length * 5,
            lastActive:     acts.length > 0 ? acts[0].timestamp : null,
          }
        : {
            hadithsRead:    0,
            hadithsLiked:   likedSet.size,
            hadithsShared:  acts.filter(a => a.type === 'shared').length,
            commentsPosted: acts.filter(a => a.type === 'commented').length,
            studyStreak:    streak,
            totalStudyTime: acts.length * 5,
            lastActive:     acts.length > 0 ? acts[0].timestamp : null,
          }
      );
    }, (err) => console.error('activity listener error:', err));

    // ── Listener 3: User profile document ──
    const profileRef = doc(db, 'users', currentUser.uid);
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile((prev: any) => ({ ...prev, ...data }));
      }
    }, (err) => console.error('profile listener error:', err));

    // Cleanup all listeners when component unmounts or user changes
    return () => {
      unsubSaved();
      unsubActivity();
      unsubProfile();
    };
  }, [currentUser]);

  const calcStreak = (acts: any[]) => {
    if (!acts.length) return 0;
    const days = new Set(acts.map(a => {
      const d = new Date(a.timestamp); d.setHours(0,0,0,0); return d.toISOString();
    }));
    let streak = 0;
    const cur = new Date(); cur.setHours(0,0,0,0);
    while (days.has(cur.toISOString())) { streak++; cur.setDate(cur.getDate() - 1); }
    return streak;
  };

  /* Avatar upload */
  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setAvatarUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateProfile(currentUser, { photoURL: url });
      await updateDoc(doc(db, 'users', currentUser.uid), { photoURL: url, updatedAt: serverTimestamp() });
      setProfile((p: any) => ({ ...p, photoURL: url }));
      toast({ title: 'Avatar updated' });
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* Save profile */
  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      if (formData.fullName !== profile?.fullName) {
        await updateProfile(currentUser, { displayName: formData.fullName });
      }
      await updateDoc(doc(db, 'users', currentUser.uid), {
        ...formData,
        displayName: formData.fullName,
        updatedAt: serverTimestamp(),
      });
      setProfile((p: any) => ({ ...p, ...formData }));
      setEditOpen(false);
      toast({ title: 'Profile saved' });
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  /* Loading */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  const displayName = profile?.fullName || profile?.displayName || 'User';
  const photoURL    = currentUser?.photoURL || profile?.photoURL;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ── Cover + Avatar ───────────────────────────────── */}
      <div className="relative">
        {/* Cover gradient */}
        <div className="h-52 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700" />

        {/* Avatar */}
        <div className="absolute left-8 bottom-0 translate-y-1/2">
          <div className="relative group">
            <Avatar className="h-28 w-28 border-4 border-background shadow-xl ring-2 ring-emerald-400">
              {photoURL && <AvatarImage src={photoURL} alt={displayName} />}
              <AvatarFallback className="text-3xl font-bold bg-emerald-100 text-emerald-700">
                {getInitials(displayName, profile?.email)}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={handleAvatarClick}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              {avatarUploading
                ? <Loader2 className="h-6 w-6 text-white animate-spin" />
                : <Camera className="h-6 w-6 text-white" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
        </div>

        {/* Top-right action buttons */}
        <div className="absolute right-6 bottom-4 flex gap-2">
          {isUserAdmin && (
            <>
              <Link to="/admin/profile">
                <Button size="sm" variant="secondary" className="shadow">
                  <Crown className="h-4 w-4 mr-1" /> Admin Profile
                </Button>
              </Link>
              <Link to="/admin/panel">
                <Button size="sm" variant="secondary" className="shadow">
                  <Shield className="h-4 w-4 mr-1" /> Admin Panel
                </Button>
              </Link>
            </>
          )}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-white text-gray-800 hover:bg-gray-100 shadow">
                <Edit3 className="h-4 w-4 mr-1" /> Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="text-sm font-medium mb-1 block">Full Name</label>
                  <Input value={formData.fullName || ''} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="Your full name" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input value={profile?.email || ''} disabled className="opacity-60" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Location</label>
                  <Input value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="City, Country" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Bio</label>
                  <textarea
                    className="w-full p-3 border rounded-lg resize-none min-h-[90px] bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.bio || ''}
                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button variant="outline" onClick={() => { setFormData(profile); setEditOpen(false); }} disabled={saving}>
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                    Save
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Profile Info ─────────────────────────────────── */}
      <div className="container mx-auto px-6 pt-20 pb-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">{displayName}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-muted-foreground text-sm">{profile?.email}</span>
              {/* Role badge */}
              {profile?.role === 'admin' && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200">⭐ Admin</Badge>
              )}
              {profile?.role === 'scholar' && (
                <Badge className="bg-purple-100 text-purple-800 border-purple-200">📚 Scholar</Badge>
              )}
              {profile?.role === 'user' && (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">🕌 Member</Badge>
              )}
              {/* Status */}
              {profile?.status === 'pending' && (
                <Badge variant="secondary">Pending Approval</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
              {profile?.location && (
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.location}</span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Joined {formatDate(profile?.createdAt)}
              </span>
              {userStats?.lastActive && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Last active {userStats.lastActive.toLocaleDateString()}
                </span>
              )}
            </div>
            {profile?.bio && (
              <p className="mt-3 text-sm text-muted-foreground max-w-2xl leading-relaxed">{profile.bio}</p>
            )}
          </div>

          {/* Sign out */}
          <Button variant="outline" size="sm" onClick={handleSignOut} className="self-start md:self-end text-destructive border-destructive/30 hover:bg-destructive/10">
            <LogOut className="h-4 w-4 mr-1" /> Sign Out
          </Button>
        </div>
      </div>

      <Separator />

      {/* ── Main Content ─────────────────────────────────── */}
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
            <TabsTrigger value="saved" className="rounded-lg">Saved Hadiths</TabsTrigger>
            <TabsTrigger value="activity" className="rounded-lg">Activity</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg">Settings</TabsTrigger>
          </TabsList>

          {/* ── Overview Tab ─────────────────────────────── */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={BookOpen}
                label="Hadiths Read"
                value={userStats?.hadithsRead ?? 0}
                color="from-emerald-500 to-teal-600 text-white"
              />
              <StatCard
                icon={Flame}
                label="Study Streak"
                value={`${userStats?.studyStreak ?? 0}d`}
                color="from-orange-400 to-red-500 text-white"
                sub={userStats?.studyStreak ? 'Keep it up! 🔥' : 'Start today!'}
              />
              <StatCard
                icon={Heart}
                label="Liked"
                value={userStats?.hadithsLiked ?? 0}
                color="from-pink-400 to-rose-500 text-white"
              />
              <StatCard
                icon={Clock}
                label="Study Time"
                value={`${userStats?.totalStudyTime ?? 0}m`}
                color="from-violet-500 to-purple-600 text-white"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Achievements */}
              <Card className="lg:col-span-2 border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="h-5 w-5 text-amber-500" /> Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { title: 'First Hadith', icon: '📖', achieved: (userStats?.hadithsRead ?? 0) >= 1 },
                      { title: '10 Hadiths',   icon: '📚', achieved: (userStats?.hadithsRead ?? 0) >= 10 },
                      { title: '3-Day Streak', icon: '🔥', achieved: (userStats?.studyStreak ?? 0) >= 3 },
                      { title: 'Shared Faith', icon: '🤝', achieved: (userStats?.hadithsShared ?? 0) >= 1 },
                      { title: '25 Hadiths',   icon: '🌟', achieved: (userStats?.hadithsRead ?? 0) >= 25 },
                      { title: 'Week Streak',  icon: '📅', achieved: (userStats?.studyStreak ?? 0) >= 7 },
                      { title: 'Scholar',      icon: '🎓', achieved: (userStats?.hadithsRead ?? 0) >= 50 },
                      { title: 'Devoted',      icon: '👑', achieved: (userStats?.studyStreak ?? 0) >= 30 },
                    ].map(b => (
                      <div
                        key={b.title}
                        className={`rounded-xl p-3 text-center border transition-all ${
                          b.achieved
                            ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700'
                            : 'bg-muted/40 border-transparent opacity-40 grayscale'
                        }`}
                      >
                        <div className="text-2xl mb-1">{b.icon}</div>
                        <p className="text-xs font-medium leading-tight">{b.title}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Progress */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-5 w-5 text-blue-500" /> Goals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {[
                    { label: 'Read 100 Hadiths', current: userStats?.hadithsRead ?? 0, goal: 100, color: 'bg-emerald-500' },
                    { label: '30-Day Streak',    current: userStats?.studyStreak ?? 0, goal: 30,  color: 'bg-orange-500' },
                    { label: 'Like 50 Hadiths',  current: userStats?.hadithsLiked ?? 0, goal: 50, color: 'bg-pink-500' },
                  ].map(g => (
                    <div key={g.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{g.label}</span>
                        <span className="font-medium">{Math.min(g.current, g.goal)}/{g.goal}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`${g.color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min((g.current / g.goal) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Saved Hadiths Tab ────────────────────────── */}
          <TabsContent value="saved">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bookmark className="h-5 w-5 text-blue-500" />
                  Saved Hadiths
                  <Badge variant="secondary" className="ml-auto">{savedHadiths.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {savedHadiths.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground">
                    <BookMarked className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No saved hadiths yet</p>
                    <p className="text-sm mt-1">Browse collections and save hadiths you love</p>
                    <Link to="/">
                      <Button className="mt-4" variant="outline" size="sm">Browse Hadiths</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedHadiths.slice(0, 10).map((h: any) => (
                      <div key={h.id} className="p-4 rounded-xl bg-muted/30 border hover:border-primary/30 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-right text-lg leading-loose font-arabic text-foreground line-clamp-2">{h.arabic}</p>
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{h.english?.text || h.english}</p>
                            {(h.book || h.reference?.book) && (
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">{h.book || h.reference?.book}</Badge>
                                {h.reference?.hadith && <span className="text-xs text-muted-foreground">#{h.reference.hadith}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {savedHadiths.length > 10 && (
                      <p className="text-center text-sm text-muted-foreground pt-2">
                        +{savedHadiths.length - 10} more saved hadiths
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Activity Tab ─────────────────────────────── */}
          <TabsContent value="activity">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-5 w-5 text-green-500" /> Recent Activity
                  <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Live
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No activity yet</p>
                    <p className="text-sm mt-1">Start reading and interacting with hadiths</p>
                  </div>
                ) : (
                  <div className="relative space-y-0">
                    {recentActivity.map((a: any, i: number) => (
                      <div key={a.id} className="flex gap-4 pb-6">
                        {/* Timeline line */}
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            a.type === 'liked'     ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30' :
                            a.type === 'shared'    ? 'bg-green-100 text-green-600 dark:bg-green-900/30' :
                            a.type === 'commented' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' :
                            'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                          }`}>
                            {a.type === 'liked'     && <Heart className="h-4 w-4" />}
                            {a.type === 'shared'    && <Share2 className="h-4 w-4" />}
                            {a.type === 'commented' && <MessageSquare className="h-4 w-4" />}
                            {a.type === 'read'      && <BookOpen className="h-4 w-4" />}
                            {!a.type               && <Star className="h-4 w-4" />}
                          </div>
                          {i < recentActivity.length - 1 && (
                            <div className="w-0.5 flex-1 bg-border mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <p className="text-sm font-medium capitalize">{a.type || 'Activity'}</p>
                          {a.hadithText && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.hadithText}</p>}
                          {a.book && <Badge variant="outline" className="text-xs mt-1">{a.book}</Badge>}
                          <p className="text-xs text-muted-foreground mt-1">
                            {a.timestamp instanceof Date ? a.timestamp.toLocaleString() : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Settings Tab ─────────────────────────────── */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account Info */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-5 w-5" /> Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: 'Display Name', value: displayName },
                    { label: 'Email',        value: profile?.email },
                    { label: 'Role',         value: profile?.role?.charAt(0).toUpperCase() + (profile?.role?.slice(1) || '') },
                    { label: 'Status',       value: profile?.status?.charAt(0).toUpperCase() + (profile?.status?.slice(1) || '') },
                    { label: 'Member Since', value: formatDate(profile?.createdAt) },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-muted last:border-0">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium">{item.value || '—'}</span>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setEditOpen(true)}>
                    <Edit3 className="h-4 w-4 mr-2" /> Edit Profile
                  </Button>
                </CardContent>
              </Card>

            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
