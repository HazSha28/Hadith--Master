import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
        clearInterval(timerRef.current);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please ensure you have granted microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // Handle playback
  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const resetRecording = () => {
    setAudioURL('');
    setRecordingTime(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Format time in MM:SS format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md w-full max-w-md mx-auto">
      <h3 className="text-xl font-semibold mb-4">Hadith Recorder</h3>
      
      <div className="flex items-center justify-center gap-4 mb-6 w-full">
        {!isRecording && !audioURL ? (
          <Button
            onClick={startRecording}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white"
          >
            <Mic className="h-5 w-5" />
            Start Recording
          </Button>
        ) : isRecording ? (
          <Button
            onClick={stopRecording}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white"
          >
            <Square className="h-5 w-5" />
            Stop ({formatTime(recordingTime)})
          </Button>
        ) : (
          <div className="flex items-center gap-4">
            <Button
              onClick={togglePlayback}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button
              variant="outline"
              onClick={resetRecording}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              New Recording
            </Button>
          </div>
        )}
      </div>

      {audioURL && (
        <div className="w-full">
          <audio
            ref={audioRef}
            src={audioURL}
            onEnded={() => setIsPlaying(false)}
            className="w-full"
          />
        </div>
      )}
      
      <p className="mt-4 text-sm text-gray-500 text-center">
        Record your recitation of the hadith to practice pronunciation and memorization.
      </p>
    </div>
  );
}
