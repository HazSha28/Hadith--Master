import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RefreshCw, Share2, Check } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

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

export default function VoiceRecorder({ hadith }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [downloadLink, setDownloadLink] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const { toast } = useToast();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>();

  // Handle recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioURL(url);
        clearInterval(timerRef.current);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      setDownloadLink('');

      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast({
        title: 'Microphone Error',
        description: 'Could not access microphone. Please ensure permissions are granted.',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleShare = async () => {
    const linkToShare = downloadLink || audioURL;
    if (!linkToShare) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Hadith Recitation Practice',
          text: `Check out my recitation for Hadith ${hadith?.reference?.hadith || ''}`,
          url: linkToShare
        });
      } else {
        await navigator.clipboard.writeText(linkToShare);
        toast({
          title: 'Copied!',
          description: 'Link copied to clipboard.',
        });
      }
    } catch (err) {
      console.error('Share error:', err);
    }
  };


  const resetRecording = () => {
    setAudioURL('');
    setAudioBlob(null);
    setRecordingTime(0);
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
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
        <div className="flex flex-col items-center w-full">
          <audio src={audioURL} controls className="w-full mb-5" />

          <div className="flex flex-wrap items-center justify-center gap-3 mb-2 w-full">
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex items-center gap-2 flex-1 min-w-[120px] max-w-[160px]"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={resetRecording}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground mt-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Record Again
          </Button>
        </div>
      )}
    </div>
  );
}
