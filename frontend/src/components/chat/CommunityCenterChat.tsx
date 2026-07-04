import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Users, Loader2, Trash2, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  collection, addDoc, serverTimestamp, query,
  orderBy, limit, onSnapshot, deleteDoc, doc,
  updateDoc, arrayUnion, arrayRemove, Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { isAdminEmail } from '@/config/adminConfig';

/* ─── Types ─────────────────────────────────────────────── */
interface Message {
  id: string;
  uid: string;
  displayName: string;
  text: string;
  createdAt: Timestamp | null;
  isAdmin?: boolean;
  reactions?: Record<string, string[]>; // emoji → [uid, uid, ...]
}

/* ─── Constants ──────────────────────────────────────────── */
const REACTIONS = ['👍', '❤️', '😄', '🤲'];
const MESSAGES_LIMIT = 100;
const MAX_LENGTH = 500;

/* ─── Helpers ────────────────────────────────────────────── */
const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const formatTime = (ts: Timestamp | null) => {
  if (!ts) return '';
  return ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/* ─── Component ──────────────────────────────────────────── */
const CommunityCenterChat: React.FC = () => {
  const { currentUser, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [messages, setMessages]   = useState<Message[]>([]);
  const [text, setText]           = useState('');
  const [sending, setSending]     = useState(false);
  const [loading, setLoading]     = useState(true);
  const [onlineCount, setOnlineCount] = useState(1);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  const isAdmin = profile?.role === 'admin' || isAdminEmail(currentUser?.email);
  const displayName = profile?.fullName || profile?.displayName || currentUser?.displayName || 'Anonymous';

  /* ── Real-time listener ─────────────────────────────── */
  useEffect(() => {
    const q = query(
      collection(db, 'communityChat', 'general', 'messages'),
      orderBy('createdAt', 'asc'),
      limit(MESSAGES_LIMIT)
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs: Message[] = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Message, 'id'>),
      }));
      setMessages(msgs);
      setLoading(false);
    }, (err) => {
      console.error('Community chat listener error:', err);
      setLoading(false);
    });

    // Fake online count — in production use Firestore presence
    setOnlineCount(Math.floor(Math.random() * 8) + 2);

    return () => unsub();
  }, []);

  /* ── Scroll to bottom on new messages ───────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Send message ────────────────────────────────────── */
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !currentUser) return;
    if (trimmed.length > MAX_LENGTH) {
      toast({ title: `Message too long (max ${MAX_LENGTH} chars)`, variant: 'destructive' });
      return;
    }

    setSending(true);
    setText('');
    try {
      await addDoc(collection(db, 'communityChat', 'general', 'messages'), {
        uid:         currentUser.uid,
        displayName: displayName,
        text:        trimmed,
        createdAt:   serverTimestamp(),
        isAdmin:     isAdmin,
      });
      inputRef.current?.focus();
    } catch (err) {
      console.error('Send error:', err);
      setText(trimmed); // restore on failure
      toast({ title: 'Failed to send message', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  /* ── Delete message (admins only) ───────────────────── */
  const handleDelete = async (msgId: string) => {
    try {
      await deleteDoc(doc(db, 'communityChat', 'general', 'messages', msgId));
      toast({ title: 'Message deleted' });
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  /* ── Toggle reaction ────────────────────────────────── */
  const toggleReaction = async (msgId: string, emoji: string, currentReactions: Record<string, string[]> = {}) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const msgRef = doc(db, 'communityChat', 'general', 'messages', msgId);
    const hasReacted = (currentReactions[emoji] || []).includes(uid);
    try {
      await updateDoc(msgRef, {
        [`reactions.${emoji}`]: hasReacted ? arrayRemove(uid) : arrayUnion(uid),
      });
    } catch (err) {
      console.error('Reaction error:', err);
    }
  };

  /* ── Not logged in ───────────────────────────────────── */
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
        <Users className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Join the Community</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Sign in to chat with other learners and share Islamic knowledge.
        </p>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/login')}>Sign In</Button>
          <Button variant="outline" onClick={() => navigate('/signup')}>Sign Up</Button>
        </div>
      </div>
    );
  }

  /* ── Main UI ─────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-full bg-background">

      {/* ── Sub-header ── */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span>{onlineCount} online</span>
        </div>
        <span className="text-xs text-muted-foreground">General Discussion</span>
      </div>

      {/* ── Messages ── */}
      <ScrollArea className="flex-1 px-4 py-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <Users className="h-10 w-10 opacity-30" />
            <p className="text-sm">No messages yet. Be the first to say Assalamu Alaikum! 👋</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.uid === currentUser.uid;
              const reactions = msg.reactions || {};
              return (
                <div key={msg.id} className={`flex gap-2 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white
                    ${msg.isAdmin ? 'bg-amber-500' : isOwn ? 'bg-emerald-600' : 'bg-slate-500'}`}>
                    {getInitials(msg.displayName)}
                  </div>

                  {/* Bubble + reactions */}
                  <div className={`max-w-[72%] space-y-0.5 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    {/* Name + time */}
                    <div className={`flex items-center gap-1.5 text-xs text-muted-foreground ${isOwn ? 'flex-row-reverse' : ''}`}>
                      <span className="font-medium">{msg.displayName}</span>
                      {msg.isAdmin && (
                        <Badge className="h-4 px-1 text-[10px] bg-amber-100 text-amber-800 border-amber-200">
                          <Shield className="h-2.5 w-2.5 mr-0.5" />Admin
                        </Badge>
                      )}
                      <span>{formatTime(msg.createdAt)}</span>
                    </div>

                    {/* Text bubble */}
                    <div className={`rounded-2xl px-3 py-2 text-sm leading-relaxed break-words
                      ${isOwn
                        ? 'bg-emerald-600 text-white rounded-tr-sm'
                        : msg.isAdmin
                          ? 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-900 dark:text-amber-100 rounded-tl-sm'
                          : 'bg-muted rounded-tl-sm'
                      }`}>
                      {msg.text}
                    </div>

                    {/* Reaction picker — appears on hover */}
                    <div className={`flex items-center gap-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 bg-background border rounded-full px-1.5 py-0.5 shadow-sm">
                        {REACTIONS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(msg.id, emoji, reactions)}
                            className={`text-sm hover:scale-125 transition-transform px-0.5 rounded ${
                              (reactions[emoji] || []).includes(currentUser.uid)
                                ? 'bg-primary/10'
                                : ''
                            }`}
                            title={emoji}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Existing reactions display */}
                    {Object.keys(reactions).some(e => reactions[e]?.length > 0) && (
                      <div className={`flex flex-wrap gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        {REACTIONS.filter(e => reactions[e]?.length > 0).map(emoji => {
                          const uids = reactions[emoji] || [];
                          const iReacted = uids.includes(currentUser.uid);
                          return (
                            <button
                              key={emoji}
                              onClick={() => toggleReaction(msg.id, emoji, reactions)}
                              className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border transition-colors
                                ${iReacted
                                  ? 'bg-primary/10 border-primary/30 text-primary'
                                  : 'bg-background border-border hover:bg-muted'
                                }`}
                            >
                              <span>{emoji}</span>
                              <span className="font-medium">{uids.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Delete button */}
                  {(isOwn || isAdmin) && (
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity self-center text-destructive hover:text-destructive/80 flex-shrink-0"
                      title="Delete message"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* ── Input ── */}
      <div className="border-t px-4 py-3 flex gap-2 bg-background">
        <Input
          ref={inputRef}
          placeholder="Share your thoughts... (Enter to send)"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          disabled={sending}
          maxLength={MAX_LENGTH}
          className="flex-1"
        />
        <Button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          size="icon"
          className="bg-emerald-600 hover:bg-emerald-700 text-white flex-shrink-0"
        >
          {sending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Send className="h-4 w-4" />
          }
        </Button>
      </div>

      {/* char counter when near limit */}
      {text.length > MAX_LENGTH * 0.8 && (
        <div className="px-4 pb-2 text-right text-xs text-muted-foreground">
          {text.length}/{MAX_LENGTH}
        </div>
      )}
    </div>
  );
};

export default CommunityCenterChat;
