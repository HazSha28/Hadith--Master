import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
// import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VoiceSearchProps {
  onTranscript: (text: string) => void;
}

export const VoiceSearch = ({ onTranscript }: VoiceSearchProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({
        title: "Recording started",
        description: "Speak now...",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];

        // TODO: Replace with your backend service
        // const { data, error } = await supabase.functions.invoke('voice-to-text', {
        //   body: { audio: base64Audio }
        // });

        // if (error) throw error;

        // if (data?.text) {
        //   onTranscript(data.text);
        //   toast({
        //     title: "Transcription complete",
        //     description: "Text has been added to search",
        //   });
        // }

        console.log('Voice data ready:', base64Audio.substring(0, 50) + '...');
        toast({
          title: "Voice feature disabled",
          description: "Backend integration needed",
          variant: "destructive",
        });
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Error",
        description: "Failed to process audio",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-8 w-8"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isProcessing}
    >
      <Mic className={`h-5 w-5 ${isRecording ? 'text-destructive animate-pulse' : 'text-muted-foreground hover:text-accent'}`} />
    </Button>
  );
};
