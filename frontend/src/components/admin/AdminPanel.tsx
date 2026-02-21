import React, { useState, useEffect } from 'react';
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
import { 
  Users, 
  MessageSquare, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  UserCheck,
  UserX,
  Trash2,
  Eye,
  Settings,
  BarChart3,
  Clock,
  Mail,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  isAdmin, 
  getAllUsers, 
  getPendingUsers, 
  approveUser, 
  rejectUser, 
  suspendUser, 
  updateUserRole,
  getScholarComments,
  getPendingComments,
  approveComment,
  rejectComment,
  deleteComment,
  getAdminStats,
  UserApproval,
  ScholarComment
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

  useEffect(() => {
    if (currentUser) {
      setIsAdminUser(true);
      loadAdminData();
    }
    setLoading(false);
  }, [currentUser]);

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
