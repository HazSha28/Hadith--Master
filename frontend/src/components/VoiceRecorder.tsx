import { useState, useRef, useEffect } from 'react';
import { Mic, Square, RefreshCw, Share2, Save, Loader2, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db, storage } from '@/firebase';

interface VoiceRecorderProps {
  hadith?: {
    id: number | string;
    bookName?: string;
    chapter?: string;
    reference?: {
      book: number | string;
      hadith: number | string;
    };
  };
}

interface SavedRecording {
  id: string;
  url: string;
  storagePath: string;
  hadithId: string | number;
  hadithNumber: string | number;
  book: string;
  createdAt: any;
  durationSecs: number;
}

export default function VoiceRecorder({ hadith }: VoiceRecorderProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [isRecording, setIsRecording]     = useState(false);
  const [audioURL, setAudioURL]           = useState('');
  const [audioBlob, setAudioBlob]         = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [saving, setSaving]               = useState(false);
  const [saved, setSaved]                 = useState(false);
  const [pastRecordings, setPastRecordings] = useState<SavedRecording[]>([]);
  const [loadingPast, setLoadingPast]     = useState(false);
  const [deletingId, setDeletingId]       = useState<string | null>(null);

  const mediaRecorderRef  = useRef<MediaRecorder | null>(null);
  const audioChunksRef    = useRef<Blob[]>([]);
  const timerRef          = useRef<number>();

  /* ── Load past recordings for this hadith ── */
  useEffect(() => {
    if (!currentUser || !hadith?.id) return;
    loadPastRecordings();
  }, [currentUser, hadith?.id]);

  const loadPastRecordings = async () => {
    if (!currentUser || !hadith?.id) return;
    setLoadingPast(true);
    try {
      const q = query(
        collection(db, 'userRecordings', currentUser.uid, 'recordings'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const all = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as SavedRecording))
        .filter(r => String(r.hadithId) === String(hadith.id));
      setPastRecordings(all);
    } catch (err) {
      console.error('Failed to load recordings:', err);
    } finally {
      setLoadingPast(false);
    }
  };

  /* ── Start recording ── */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        clearInterval(timerRef.current);
        setSaved(false);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      setAudioURL('');
      setAudioBlob(null);

      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch {
      toast({ title: 'Microphone Error', description: 'Could not access microphone. Please grant permission.', variant: 'destructive' });
    }
  };

  /* ── Stop recording ── */
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
    }
  };

  /* ── Save to Firebase ── */
  const saveRecording = async () => {
    if (!audioBlob || !currentUser) {
      toast({ title: 'Sign in to save recordings', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      // Upload to Firebase Storage
      const timestamp  = Date.now();
      const path       = `recordings/${currentUser.uid}/${hadith?.id || 'unknown'}_${timestamp}.webm`;
      const sRef       = storageRef(storage, path);
      await uploadBytes(sRef, audioBlob);
      const url        = await getDownloadURL(sRef);

      // Save metadata to Firestore
      await addDoc(collection(db, 'userRecordings', currentUser.uid, 'recordings'), {
        url,
        storagePath:  path,
        hadithId:     hadith?.id || '',
        hadithNumber: hadith?.reference?.hadith || '',
        book:         hadith?.bookName || hadith?.reference?.book || '',
        durationSecs: recordingTime,
        createdAt:    serverTimestamp(),
      });

      setSaved(true);
      toast({ title: '✅ Recording saved to your profile!' });
      loadPastRecordings();
    } catch (err: any) {
      console.error('Save recording error:', err);
      toast({ title: err?.message || 'Failed to save recording', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete a past recording ── */
  const deleteRecording = async (recording: SavedRecording) => {
    if (!currentUser) return;
    setDeletingId(recording.id);
    try {
      // Delete from Storage
      await deleteObject(storageRef(storage, recording.storagePath));
      // Delete from Firestore
      await deleteDoc(doc(db, 'userRecordings', currentUser.uid, 'recordings', recording.id));
      setPastRecordings(prev => prev.filter(r => r.id !== recording.id));
      toast({ title: 'Recording deleted' });
    } catch (err) {
      console.error('Delete error:', err);
      toast({ title: 'Failed to delete', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Share ── */
  const handleShare = async () => {
    if (!audioURL) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Hadith Recitation Practice',
          text: `My recitation for Hadith ${hadith?.reference?.hadith || ''}`,
          url: audioURL,
        });
      } else {
        await navigator.clipboard.writeText(audioURL);
        toast({ title: 'Link copied to clipboard' });
      }
    } catch {}
  };

  const resetRecording = () => {
    setAudioURL('');
    setAudioBlob(null);
    setRecordingTime(0);
    setSaved(false);
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      }
      clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center w-full gap-4">

      {/* ── Recorder UI ── */}
      <div className="flex flex-col items-center p-5 bg-background/50 rounded-lg border border-border w-full max-w-lg mx-auto">

        {!isRecording && !audioURL ? (
          <div className="flex flex-col items-center w-full">
            <Button
              onClick={startRecording}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground min-w-[200px]"
              size="lg"
            >
              <Mic className="h-5 w-5" />
              Start Recording
            </Button>
            <p className="mt-3 text-xs text-muted-foreground text-center">
              Record your recitation to practice pronunciation.
            </p>
          </div>

        ) : isRecording ? (
          <div className="flex flex-col items-center w-full">
            <div className="flex items-center justify-center h-16 w-16 bg-destructive/10 rounded-full mb-3 animate-pulse">
              <Mic className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-2xl font-mono font-medium mb-4">{formatTime(recordingTime)}</p>
            <Button
              onClick={stopRecording}
              className="flex items-center gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground min-w-[200px]"
              size="lg"
            >
              <Square className="h-5 w-5" />
              Stop Recording
            </Button>
          </div>

        ) : (
          <div className="flex flex-col items-center w-full gap-3">
            <audio src={audioURL} controls className="w-full" />
            <p className="text-xs text-muted-foreground">Duration: {formatTime(recordingTime)}</p>

            <div className="flex flex-wrap items-center justify-center gap-2 w-full">
              {/* Save */}
              {!saved ? (
                <Button
                  onClick={saveRecording}
                  disabled={saving || !currentUser}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? 'Saving...' : 'Save Recording'}
                </Button>
              ) : (
                <span className="text-sm text-emerald-600 font-medium">✅ Saved!</span>
              )}

              {/* Share */}
              <Button onClick={handleShare} variant="outline" className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={resetRecording}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Record Again
            </Button>

            {!currentUser && (
              <p className="text-xs text-muted-foreground">Sign in to save recordings permanently.</p>
            )}
          </div>
        )}
      </div>

      {/* ── Past Recordings ── */}
      {currentUser && (
        <div className="w-full max-w-lg">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
            Saved Recordings for this Hadith
          </h3>

          {loadingPast ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : pastRecordings.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">
              No saved recordings yet.
            </p>
          ) : (
            <div className="space-y-2">
              {pastRecordings.map((rec) => (
                <div key={rec.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <audio src={rec.url} controls className="flex-1 h-8" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTime(rec.durationSecs || 0)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRecording(rec)}
                    disabled={deletingId === rec.id}
                    className="text-destructive hover:text-destructive/80 flex-shrink-0"
                  >
                    {deletingId === rec.id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Trash2 className="h-4 w-4" />
                    }
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
