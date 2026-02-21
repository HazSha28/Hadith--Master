import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  ThumbsUp, 
  Reply, 
  Share2,
  User,
  Calendar,
  BookOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface ScholarComment {
  id: string;
  hadithId: string;
  userId: string;
  userEmail: string;
  userName: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  approvedBy?: string;
  approvedAt?: any;
  rejectionReason?: string;
  likes?: number;
  replies?: number;
  hadithContext?: {
    text: string;
    narrator: string;
    book: string;
  };
}

interface ScholarCommentsProps {
  hadithId: string;
  hadithText: string;
  narrator: string;
  book: string;
}

const ScholarComments: React.FC<ScholarCommentsProps> = ({
  hadithId,
  hadithText,
  narrator,
  book
}) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [comments, setComments] = useState<ScholarComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllComments, setShowAllComments] = useState(false);
  const [likingComments, setLikingComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadComments();
  }, [hadithId]);

  const loadComments = async () => {
    try {
      const commentsRef = collection(db, 'scholarComments');
      const q = query(
        commentsRef,
        where('hadithId', '==', hadithId),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ScholarComment[];

      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!currentUser) {
      toast({
        title: 'Login Required',
        description: 'Please log in to like comments.',
        variant: 'destructive'
      });
      return;
    }

    if (likingComments.has(commentId)) return;

    setLikingComments(prev => new Set(prev).add(commentId));

    try {
      const commentRef = doc(db, 'scholarComments', commentId);
      await updateDoc(commentRef, {
        likes: (comments.find(c => c.id === commentId)?.likes || 0) + 1,
        likedBy: arrayUnion(currentUser.uid)
      });

      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, likes: (comment.likes || 0) + 1 }
          : comment
      ));

      toast({
        title: 'Comment Liked',
        description: 'You liked this scholarly commentary.',
      });
    } catch (error) {
      console.error('Error liking comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to like comment.',
        variant: 'destructive'
      });
    } finally {
      setLikingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

  const handleShare = async (comment: ScholarComment) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Scholar Commentary by ${comment.userName}`,
          text: `${comment.content.substring(0, 200)}...`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(
          `Scholar Commentary by ${comment.userName}:\n${comment.content}\n\n${window.location.href}`
        );
        toast({
          title: 'Copied to Clipboard',
          description: 'Comment link copied to clipboard.',
        });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const displayedComments = showAllComments ? comments : comments.slice(0, 3);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (comments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            Scholar Commentaries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No scholarly commentaries yet for this hadith.</p>
            <p className="text-sm">Be the first to share your insights!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Scholar Commentaries ({comments.length})
          </div>
          <Badge variant="secondary" className="text-xs">
            Verified Scholars
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayedComments.map((comment) => (
          <div key={comment.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${comment.userName}`} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{comment.userName}</p>
                    <Badge variant="outline" className="text-xs">
                      Scholar
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(comment.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-sm leading-relaxed">
              {comment.content}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(comment.id)}
                  disabled={likingComments.has(comment.id)}
                  className="h-8 px-2"
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  {comment.likes || 0}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShare(comment)}
                  className="h-8 px-2"
                >
                  <Share2 className="h-3 w-3" />
                </Button>
              </div>
              
              {comment.replies && comment.replies > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Reply className="h-3 w-3" />
                  <span>{comment.replies} replies</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {comments.length > 3 && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllComments(!showAllComments)}
              className="flex items-center gap-2"
            >
              {showAllComments ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show {comments.length - 3} More
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScholarComments;
