import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Send, 
  AlertCircle, 
  CheckCircle,
  BookOpen,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { ADMIN_CONFIG } from '@/config/adminConfig';

interface ScholarCommentFormProps {
  hadithId: string;
  hadithText: string;
  narrator: string;
  book: string;
}

const ScholarCommentForm: React.FC<ScholarCommentFormProps> = ({
  hadithId,
  hadithText,
  narrator,
  book
}) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to submit a comment.',
        variant: 'destructive'
      });
      return;
    }

    if (comment.trim().length === 0) {
      toast({
        title: 'Empty Comment',
        description: 'Please enter a comment before submitting.',
        variant: 'destructive'
      });
      return;
    }

    if (comment.length > ADMIN_CONFIG.COMMENT_SETTINGS.MAX_COMMENT_LENGTH) {
      toast({
        title: 'Comment Too Long',
        description: `Comments must be ${ADMIN_CONFIG.COMMENT_SETTINGS.MAX_COMMENT_LENGTH} characters or less.`,
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const commentData = {
        hadithId,
        userId: currentUser.uid,
        userEmail: currentUser.email || '',
        userName: currentUser.displayName || currentUser.email || 'Anonymous',
        content: comment.trim(),
        status: 'pending', // All comments start as pending for moderation
        createdAt: serverTimestamp(),
        likes: 0,
        replies: 0,
        hadithContext: {
          text: hadithText.substring(0, 200) + '...',
          narrator,
          book
        }
      };

      await addDoc(collection(db, 'scholarComments'), commentData);

      toast({
        title: 'Comment Submitted',
        description: 'Your comment has been submitted for review and will be published once approved by our moderators.',
      });

      setComment('');
      setCharacterCount(0);
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: 'Submission Error',
        description: 'Failed to submit your comment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= ADMIN_CONFIG.COMMENT_SETTINGS.MAX_COMMENT_LENGTH) {
      setComment(text);
      setCharacterCount(text.length);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Scholar Commentary
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span>{book} - Narrated by {narrator}</span>
        </div>
      </CardHeader>
      <CardContent>
        {!currentUser ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please <a href="/login" className="text-blue-600 hover:underline">log in</a> to submit a scholarly commentary on this hadith.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">
                Commenting as: {currentUser.displayName || currentUser.email}
              </span>
              <Badge variant="outline" className="text-xs">
                Pending Review
              </Badge>
            </div>
            
            <div className="space-y-2">
              <Textarea
                value={comment}
                onChange={handleCommentChange}
                placeholder="Share your scholarly insights, interpretations, or contextual information about this hadith..."
                className="min-h-[120px] resize-none"
                disabled={isSubmitting}
              />
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>
                  {characterCount}/{ADMIN_CONFIG.COMMENT_SETTINGS.MAX_COMMENT_LENGTH} characters
                </span>
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>All comments are reviewed before publication</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Comment Guidelines:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Provide scholarly context and references</li>
                    <li>• Be respectful and constructive</li>
                    <li>• Cite sources when appropriate</li>
                    <li>• Comments are reviewed by Islamic scholars</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting || comment.trim().length === 0}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit for Review
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default ScholarCommentForm;
