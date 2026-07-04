import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, MessageSquare, Shield, CheckCircle, XCircle, AlertTriangle,
  UserCheck, UserX, Trash2, Eye, Settings, BarChart3, Clock,
  Mail, Calendar, Send, Loader2, MessageCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  collection, addDoc, serverTimestamp, query, orderBy,
  limit, onSnapshot, collectionGroup, Timestamp, getDocs
} from 'firebase/firestore';
import { db } from '@/firebase';
import { 
  isAdmin, getAllUsers, getPendingUsers, approveUser, rejectUser,
  suspendUser, updateUserRole, getScholarComments, getPendingComments,
  approveComment, rejectComment, deleteComment, getAdminStats,
  UserApproval, ScholarComment
} from '@/services/adminService';

const AdminPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<UserApproval[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserApproval[]>([]);
  const [comments, setComments] = useState<ScholarComment[]>([]);
  const [pendingComments, setPendingComments] = useState<ScholarComment[]>([]);
  
  const [selectedUser, setSelectedUser] = useState<UserApproval | null>(null);
  const [selectedComment, setSelectedComment] = useState<ScholarComment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'user' | 'comment' | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'suspend' | null>(null);

  // ── Support chat state ────────────────────────────────
  const [supportThreads, setSupportThreads] = useState<{ uid: string; displayName: string; lastMsg: string; lastAt: Timestamp | null; unread: number }[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const threadBottomRef = useRef<HTMLDivElement>(null);
  const displayName = currentUser?.displayName || 'Admin';

  useEffect(() => {
    if (currentUser) {
      setIsAdminUser(true);
      loadAdminData();
      loadSupportThreads();
    }
    setLoading(false);
  }, [currentUser]);

  // Load list of all user support threads
  const loadSupportThreads = async () => {
    setLoadingThreads(true);
    try {
      // Get all users first to map uid → name
      const usersSnap = await getDocs(collection(db, 'users'));
      const userMap: Record<string, string> = {};
      usersSnap.docs.forEach(d => {
        const data = d.data();
        userMap[d.id] = data.displayName || data.fullName || data.email || d.id;
      });

      // Listen to all supportChats (collectionGroup doesn't work for subcollections without index)
      // Instead poll each user's thread — simpler approach: list supportChats docs
      const supportSnap = await getDocs(collection(db, 'supportChats'));
      const threads = await Promise.all(supportSnap.docs.map(async (threadDoc) => {
        const uid = threadDoc.id;
        const msgsSnap = await getDocs(
          query(collection(db, 'supportChats', uid, 'messages'), orderBy('createdAt', 'desc'), limit(1))
        );
        const last = msgsSnap.docs[0]?.data();
        return {
          uid,
          displayName: userMap[uid] || uid,
          lastMsg: last?.text || '',
          lastAt: last?.createdAt || null,
          unread: 0,
        };
      }));

      // Sort by most recent
      threads.sort((a, b) => {
        const aT = a.lastAt?.toMillis() || 0;
        const bT = b.lastAt?.toMillis() || 0;
        return bT - aT;
      });

      setSupportThreads(threads);
    } catch (err) {
      console.error('Error loading support threads:', err);
    } finally {
      setLoadingThreads(false);
    }
  };

  // Real-time listener for selected thread messages
  useEffect(() => {
    if (!selectedThread) return;
    setLoadingMsgs(true);
    const q = query(
      collection(db, 'supportChats', selectedThread, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
    const unsub = onSnapshot(q, (snap) => {
      setThreadMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingMsgs(false);
    });
    return () => unsub();
  }, [selectedThread]);

  // Scroll to bottom when messages load
  useEffect(() => {
    threadBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedThread || !currentUser) return;
    setSendingReply(true);
    const text = replyText.trim();
    setReplyText('');
    try {
      await addDoc(collection(db, 'supportChats', selectedThread, 'messages'), {
        uid:         currentUser.uid,
        displayName: displayName,
        text,
        createdAt:   serverTimestamp(),
        senderType:  'admin',
      });
      // Refresh thread list to update lastMsg
      loadSupportThreads();
    } catch (err) {
      console.error('Reply error:', err);
      setReplyText(text);
      toast({ title: 'Failed to send reply', variant: 'destructive' });
    } finally {
      setSendingReply(false);
    }
  };

  const loadAdminData = async () => {
    try {
      const [statsData, allUsersData, pendingUsersData, commentsData, pendingCommentsData] = await Promise.all([
        getAdminStats(),
        getAllUsers(),
        getPendingUsers(),
        getScholarComments(),
        getPendingComments()
      ]);

      setStats(statsData);
      setUsers(allUsersData);
      setPendingUsers(pendingUsersData);
      setComments(commentsData);
      setPendingComments(pendingCommentsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin data',
        variant: 'destructive'
      });
    }
  };

  const handleUserAction = async (user: UserApproval, action: 'approve' | 'reject' | 'suspend') => {
    setSelectedUser(user);
    setActionType(action);
    setDialogType('user');
    
    if (action === 'approve') {
      await performUserAction(user, action);
    } else {
      setIsDialogOpen(true);
    }
  };

  const performUserAction = async (user: UserApproval, action: 'approve' | 'reject' | 'suspend') => {
    if (!currentUser) return;

    try {
      switch (action) {
        case 'approve':
          await approveUser(user.uid, currentUser.uid);
          toast({
            title: 'User Approved',
            description: `${user.email} has been approved successfully.`
          });
          break;
        case 'reject':
          await rejectUser(user.uid, rejectionReason, currentUser.uid);
          toast({
            title: 'User Rejected',
            description: `${user.email} has been rejected.`
          });
          break;
        case 'suspend':
          await suspendUser(user.uid, rejectionReason, currentUser.uid);
          toast({
            title: 'User Suspended',
            description: `${user.email} has been suspended.`
          });
          break;
      }
      
      loadAdminData();
      setIsDialogOpen(false);
      setRejectionReason('');
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} user`,
        variant: 'destructive'
      });
    }
  };

  const handleCommentAction = async (comment: ScholarComment, action: 'approve' | 'reject' | 'delete') => {
    setSelectedComment(comment);
    setActionType(action);
    setDialogType('comment');
    
    if (action === 'approve') {
      await performCommentAction(comment, action);
    } else if (action === 'delete') {
      await performCommentAction(comment, action);
    } else {
      setIsDialogOpen(true);
    }
  };

  const performCommentAction = async (comment: ScholarComment, action: 'approve' | 'reject' | 'delete') => {
    if (!currentUser) return;

    try {
      switch (action) {
        case 'approve':
          await approveComment(comment.id, currentUser.uid);
          toast({
            title: 'Comment Approved',
            description: 'Comment has been approved and published.'
          });
          break;
        case 'reject':
          await rejectComment(comment.id, rejectionReason, currentUser.uid);
          toast({
            title: 'Comment Rejected',
            description: 'Comment has been rejected.'
          });
          break;
        case 'delete':
          await deleteComment(comment.id);
          toast({
            title: 'Comment Deleted',
            description: 'Comment has been permanently deleted.'
          });
          break;
      }
      
      loadAdminData();
      setIsDialogOpen(false);
      setRejectionReason('');
    } catch (error) {
      console.error(`Error ${action}ing comment:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} comment`,
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      suspended: 'outline'
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAdminUser) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground">Manage users and moderate scholar comments</p>
        </div>
        <Button variant="outline" onClick={loadAdminData}>
          <Settings className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingUsers} pending approval
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scholars</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalScholars}</div>
              <p className="text-xs text-muted-foreground">Verified scholars</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comments</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalComments}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingComments} pending review
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalComments > 0 
                  ? Math.round((stats.approvedComments / stats.totalComments) * 100) 
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Comment approval rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="comments">Comment Moderation</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="support" onClick={loadSupportThreads}>
            Support Messages
            {supportThreads.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">{supportThreads.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="community">
            Community Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.uid} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{user.displayName || user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(user.status)}
                          {getRoleBadge(user.role)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUserAction(user, 'approve')}
                        disabled={user.status === 'approved'}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUserAction(user, 'suspend')}
                        disabled={user.status === 'suspended'}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Scholar Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{comment.userName}</p>
                        <p className="text-sm text-muted-foreground">{comment.userEmail}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(comment.status)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt.toDate()).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCommentAction(comment, 'approve')}
                          disabled={comment.status === 'approved'}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCommentAction(comment, 'reject')}
                          disabled={comment.status === 'rejected'}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCommentAction(comment, 'delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Pending Users ({pendingUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingUsers.map((user) => (
                    <div key={user.uid} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{user.displayName || user.email}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined: {new Date(user.createdAt.toDate()).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction(user, 'approve')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction(user, 'reject')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Pending Comments ({pendingComments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingComments.map((comment) => (
                    <div key={comment.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{comment.userName}</p>
                          <p className="text-sm text-muted-foreground">{comment.userEmail}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt.toDate()).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCommentAction(comment, 'approve')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCommentAction(comment, 'reject')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Support Messages Tab ───────────────────────────── */}
        <TabsContent value="support" className="space-y-4">
          <div className="flex h-[600px] border rounded-lg overflow-hidden">

            {/* Thread list */}
            <div className="w-72 border-r flex flex-col bg-muted/20">
              <div className="p-3 border-b flex items-center justify-between">
                <span className="font-semibold text-sm">User Threads</span>
                <Button size="sm" variant="ghost" onClick={loadSupportThreads}>
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                {loadingThreads ? (
                  <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : supportThreads.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 px-4 text-center text-muted-foreground">
                    <MessageCircle className="h-8 w-8 opacity-30" />
                    <p className="text-xs">No support messages yet</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {supportThreads.map(thread => (
                      <button
                        key={thread.uid}
                        onClick={() => setSelectedThread(thread.uid)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedThread === thread.uid
                            ? 'bg-primary/10 border border-primary/20'
                            : 'hover:bg-muted/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-7 w-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {thread.displayName[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium text-sm truncate">{thread.displayName}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate pl-9">{thread.lastMsg || 'No messages'}</p>
                        {thread.lastAt && (
                          <p className="text-[10px] text-muted-foreground pl-9 mt-0.5">
                            {thread.lastAt.toDate().toLocaleDateString()}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Conversation */}
            <div className="flex-1 flex flex-col">
              {!selectedThread ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <MessageSquare className="h-10 w-10 opacity-30" />
                  <p className="text-sm">Select a user thread to view messages</p>
                </div>
              ) : (
                <>
                  {/* Thread header */}
                  <div className="px-4 py-2.5 border-b bg-muted/20 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">
                      Conversation with {supportThreads.find(t => t.uid === selectedThread)?.displayName || selectedThread}
                    </span>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 px-4 py-3">
                    {loadingMsgs ? (
                      <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                    ) : threadMessages.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                        <p className="text-sm">No messages in this thread yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {threadMessages.map(msg => {
                          const isAdminMsg = msg.senderType === 'admin';
                          return (
                            <div key={msg.id} className={`flex gap-2 ${isAdminMsg ? 'flex-row-reverse' : 'flex-row'}`}>
                              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0
                                ${isAdminMsg ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                                {isAdminMsg ? <Shield className="h-3.5 w-3.5" /> : msg.displayName?.[0]?.toUpperCase()}
                              </div>
                              <div className={`flex flex-col max-w-[70%] ${isAdminMsg ? 'items-end' : 'items-start'}`}>
                                <span className="text-xs text-muted-foreground mb-0.5 px-1">
                                  {isAdminMsg ? `${msg.displayName} (Admin)` : msg.displayName}
                                </span>
                                <div className={`rounded-2xl px-3 py-2 text-sm break-words
                                  ${isAdminMsg
                                    ? 'bg-blue-600 text-white rounded-tr-sm'
                                    : 'bg-muted rounded-tl-sm'
                                  }`}>
                                  {msg.text}
                                </div>
                                {msg.createdAt && (
                                  <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                                    {msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        <div ref={threadBottomRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Reply input */}
                  <div className="border-t px-4 py-3 flex gap-2 bg-background">
                    <Input
                      placeholder="Type a reply..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                      disabled={sendingReply}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || sendingReply}
                      size="icon"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {sendingReply
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Send className="h-4 w-4" />
                      }
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Community Chat Tab ─────────────────────────────── */}
        <TabsContent value="community" className="space-y-4">
          <AdminCommunityChat currentUser={currentUser} adminDisplayName={displayName} />
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'user' ? (
                actionType === 'reject' ? 'Reject User' : 'Suspend User'
              ) : (
                'Reject Comment'
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for this action..."
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (dialogType === 'user' && selectedUser) {
                    performUserAction(selectedUser, actionType as 'reject' | 'suspend');
                  } else if (dialogType === 'comment' && selectedComment) {
                    performCommentAction(selectedComment, 'reject');
                  }
                }}
                disabled={!rejectionReason.trim()}
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;

/* ─── AdminCommunityChat ─────────────────────────────────────
 * Embedded community chat for the admin panel.
 * Admins can read, post, and delete any message.
 * ─────────────────────────────────────────────────────────── */
const AdminCommunityChat: React.FC<{ currentUser: any; adminDisplayName: string }> = ({
  currentUser, adminDisplayName
}) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Real-time listener
  useEffect(() => {
    const q = query(
      collection(db, 'communityChat', 'general', 'messages'),
      orderBy('createdAt', 'asc'),
      limit(200)
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !currentUser) return;
    setSending(true);
    setText('');
    try {
      await addDoc(collection(db, 'communityChat', 'general', 'messages'), {
        uid:         currentUser.uid,
        displayName: adminDisplayName,
        text:        trimmed,
        createdAt:   serverTimestamp(),
        isAdmin:     true,
      });
    } catch (err) {
      setText(trimmed);
      toast({ title: 'Failed to send', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId: string) => {
    const { deleteDoc, doc } = await import('firebase/firestore');
    try {
      await deleteDoc(doc(db, 'communityChat', 'general', 'messages', msgId));
      toast({ title: 'Message deleted' });
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const formatTime = (ts: any) => {
    if (!ts) return '';
    return ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="border rounded-lg overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-muted/20">
        <Users className="h-4 w-4 text-emerald-600" />
        <span className="text-sm font-medium">Community Chat — General</span>
        <Badge variant="outline" className="ml-auto text-xs">{messages.length} messages</Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <MessageCircle className="h-8 w-8 opacity-30" />
            <p className="text-sm">No community messages yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map(msg => {
              const isOwn = msg.uid === currentUser?.uid;
              return (
                <div key={msg.id} className="flex gap-2 group items-start">
                  {/* Avatar */}
                  <div className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5
                    ${msg.isAdmin ? 'bg-amber-500' : 'bg-slate-500'}`}>
                    {msg.isAdmin ? <Shield className="h-3.5 w-3.5" /> : msg.displayName?.[0]?.toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium">{msg.displayName}</span>
                      {msg.isAdmin && (
                        <Badge className="h-4 px-1 text-[10px] bg-amber-100 text-amber-800 border-amber-200">Admin</Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">{formatTime(msg.createdAt)}</span>
                    </div>
                    <p className="text-sm break-words leading-relaxed">{msg.text}</p>
                  </div>

                  {/* Admin delete button */}
                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity self-start mt-1 text-destructive hover:text-destructive/80 flex-shrink-0"
                    title="Delete message"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t px-4 py-3 flex gap-2 bg-background">
        <Input
          ref={inputRef}
          placeholder="Post to community as admin..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }}
          disabled={sending}
          className="flex-1"
        />
        <Button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          size="icon"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};
