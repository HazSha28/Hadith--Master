/**
 * AdminChat
 *
 * - Regular users: see their own private thread with admins
 * - Admins: see a list of all user threads and can reply to any
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Shield, Loader2, Clock, Users, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  collection, addDoc, serverTimestamp,
  query, orderBy, limit, onSnapshot,
  getDocs, Timestamp, doc, setDoc,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { isAdminEmail } from '@/config/adminConfig';

/* ─── Types ─────────────────────────────────────────────── */
interface SupportMessage {
  id: string;
  uid: string;
  displayName: string;
  text: string;
  createdAt: Timestamp | null;
  senderType: 'user' | 'admin';
}

interface Thread {
  uid: string;
  displayName: string;
  lastMsg: string;
  lastAt: Timestamp | null;
}

/* ─── Helpers ────────────────────────────────────────────── */
const fmt = (ts: Timestamp | null) =>
  ts ? ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

const fmtDate = (ts: Timestamp | null) =>
  ts ? ts.toDate().toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';

/* ─── User view — own thread with admin ─────────────────── */
const UserSupportChat: React.FC<{
  currentUser: any;
  displayName: string;
}> = ({ currentUser, displayName }) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText]         = useState('');
  const [sending, setSending]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(
      collection(db, 'supportChats', currentUser.uid, 'messages'),
      orderBy('createdAt', 'asc'), limit(100)
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as SupportMessage)));
      setLoading(false);
    }, err => { console.error(err); setLoading(false); });
    return () => unsub();
  }, [currentUser?.uid]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !currentUser) return;
    setSending(true); setText('');
    try {
      // Write message to subcollection
      await addDoc(collection(db, 'supportChats', currentUser.uid, 'messages'), {
        uid: currentUser.uid, displayName, text: trimmed,
        createdAt: serverTimestamp(), senderType: 'user',
      });
      // Update/create parent document so admin can list threads
      await setDoc(doc(db, 'supportChats', currentUser.uid), {
        uid:         currentUser.uid,
        displayName: displayName,
        lastMsg:     trimmed,
        lastAt:      serverTimestamp(),
        unread:      true,
      }, { merge: true });
      inputRef.current?.focus();
    } catch {
      setText(trimmed);
      toast({ title: 'Failed to send', variant: 'destructive' });
    } finally { setSending(false); }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
        <Shield className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium">Private — Admin Support</span>
        <Badge variant="outline" className="ml-auto text-xs border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300">
          Only admins can see this
        </Badge>
      </div>

      <ScrollArea className="flex-1 px-4 py-3">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground text-center px-4">
            <Shield className="h-10 w-10 opacity-30" />
            <p className="text-sm font-medium">Send a message to our admin team</p>
            <p className="text-xs">Ask questions, report issues, or request support.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(msg => {
              const isOwn = msg.senderType === 'user';
              return (
                <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white
                    ${isOwn ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                    {isOwn ? msg.displayName[0]?.toUpperCase() : <Shield className="h-3.5 w-3.5" />}
                  </div>
                  <div className={`flex flex-col max-w-[72%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-muted-foreground mb-0.5 px-1">
                      {isOwn ? 'You' : `${msg.displayName} (Admin)`}
                    </span>
                    <div className={`rounded-2xl px-3 py-2 text-sm break-words
                      ${isOwn
                        ? 'bg-emerald-600 text-white rounded-tr-sm'
                        : 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100 rounded-tl-sm'
                      }`}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5 px-1 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />{fmt(msg.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      <div className="border-t px-4 py-3 flex gap-2 bg-background">
        <Input ref={inputRef} placeholder="Message admin support..."
          value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          disabled={sending} maxLength={1000} className="flex-1" />
        <Button onClick={handleSend} disabled={!text.trim() || sending}
          size="icon" className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

/* ─── Admin view — list of user threads ─────────────────── */
const AdminSupportChat: React.FC<{
  currentUser: any;
  displayName: string;
}> = ({ currentUser, displayName }) => {
  const { toast } = useToast();
  const [threads, setThreads]       = useState<Thread[]>([]);
  const [selected, setSelected]     = useState<Thread | null>(null);
  const [messages, setMessages]     = useState<SupportMessage[]>([]);
  const [text, setText]             = useState('');
  const [sending, setSending]       = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  /* Load all threads — listen to supportChats collection in real-time */
  useEffect(() => {
    setLoadingList(true);
    const unsub = onSnapshot(
      query(collection(db, 'supportChats'), orderBy('lastAt', 'desc'), limit(50)),
      (snap) => {
        const list: Thread[] = snap.docs.map(d => {
          const data = d.data();
          return {
            uid:         d.id,
            displayName: data.displayName || d.id,
            lastMsg:     data.lastMsg || '',
            lastAt:      data.lastAt || null,
          };
        });
        setThreads(list);
        setLoadingList(false);
      },
      (err) => { console.error('Thread listener error:', err); setLoadingList(false); }
    );
    return () => unsub();
  }, []);

  /* Real-time messages for selected thread */
  useEffect(() => {
    if (!selected) return;
    setLoadingMsgs(true);
    const q = query(
      collection(db, 'supportChats', selected.uid, 'messages'),
      orderBy('createdAt', 'asc'), limit(100)
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as SupportMessage)));
      setLoadingMsgs(false);
    });
    return () => unsub();
  }, [selected?.uid]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !currentUser || !selected) return;
    setSending(true); setText('');
    try {
      await addDoc(collection(db, 'supportChats', selected.uid, 'messages'), {
        uid: currentUser.uid, displayName, text: trimmed,
        createdAt: serverTimestamp(), senderType: 'admin',
      });
      // Update parent doc so thread list shows latest admin reply
      await setDoc(doc(db, 'supportChats', selected.uid), {
        lastMsg:    trimmed,
        lastAt:     serverTimestamp(),
        unread:     false,
      }, { merge: true });
      inputRef.current?.focus();
    } catch {
      setText(trimmed);
      toast({ title: 'Failed to send reply', variant: 'destructive' });
    } finally { setSending(false); }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
        <Shield className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-medium">Admin — Support Inbox</span>
        <Badge variant="outline" className="ml-auto text-xs border-amber-200 text-amber-700 dark:text-amber-300">
          {threads.length} thread{threads.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {!selected ? (
        /* Thread list */
        <ScrollArea className="flex-1 px-3 py-2">
          {loadingList ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground text-center">
              <Users className="h-10 w-10 opacity-30" />
              <p className="text-sm">No support messages yet</p>
              <p className="text-xs">Users will appear here when they send a message</p>
            </div>
          ) : (
            <div className="space-y-1">
              {threads.map(t => (
                <button key={t.uid} onClick={() => setSelected(t)}
                  className="w-full text-left p-3 rounded-xl hover:bg-muted/60 transition-colors border border-transparent hover:border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {t.displayName[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{t.displayName}</span>
                        {t.lastAt && <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">{fmtDate(t.lastAt)}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{t.lastMsg || 'No messages'}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      ) : (
        /* Conversation */
        <>
          <div className="flex items-center gap-2 px-4 py-2 border-b">
            <button onClick={() => { setSelected(null); setMessages([]); }}
              className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="h-7 w-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
              {selected.displayName[0]?.toUpperCase()}
            </div>
            <span className="text-sm font-medium">{selected.displayName}</span>
          </div>

          <ScrollArea className="flex-1 px-4 py-3">
            {loadingMsgs ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <p className="text-sm">No messages yet in this thread</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map(msg => {
                  const isAdminMsg = msg.senderType === 'admin';
                  return (
                    <div key={msg.id} className={`flex gap-2 ${isAdminMsg ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white
                        ${isAdminMsg ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                        {isAdminMsg ? <Shield className="h-3.5 w-3.5" /> : msg.displayName[0]?.toUpperCase()}
                      </div>
                      <div className={`flex flex-col max-w-[72%] ${isAdminMsg ? 'items-end' : 'items-start'}`}>
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
                        <span className="text-[10px] text-muted-foreground mt-0.5 px-1 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />{fmt(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </ScrollArea>

          <div className="border-t px-4 py-3 flex gap-2 bg-background">
            <Input ref={inputRef} placeholder={`Reply to ${selected.displayName}...`}
              value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={sending} maxLength={1000} className="flex-1" />
            <Button onClick={handleSend} disabled={!text.trim() || sending}
              size="icon" className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

/* ─── Main component — switches based on role ────────────── */
const AdminChat: React.FC = () => {
  const { currentUser, profile } = useAuth();
  const navigate = useNavigate();

  const isAdmin = profile?.role === 'admin' || isAdminEmail(currentUser?.email);
  const displayName = profile?.fullName || profile?.displayName || currentUser?.displayName || 'User';

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
        <Shield className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Sign in to contact admin support</p>
        <Button onClick={() => navigate('/login')}>Sign In</Button>
      </div>
    );
  }

  if (isAdmin) {
    return <AdminSupportChat currentUser={currentUser} displayName={displayName} />;
  }

  return <UserSupportChat currentUser={currentUser} displayName={displayName} />;
};

export default AdminChat;
