import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceSearchProps {
  onTranscript: (text: string) => void;
}

// Extend Window type for browser speech recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export const VoiceSearch = ({ onTranscript }: VoiceSearchProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check browser support on mount
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
    }
  }, []);

  const startRecording = () => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      toast({
        title: "Not supported",
        description:
          "Voice search is not supported in this browser. Try Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;

    // Support both English and Arabic
    recognition.lang = "en-US";
    recognition.continuous = false;       // stop after first pause
    recognition.interimResults = true;    // show live partial results
    recognition.maxAlternatives = 1;

    let finalTranscript = "";

    recognition.onstart = () => {
      setIsRecording(true);
      finalTranscript = "";
      toast({
        title: "Listening...",
        description: "Speak now. Click mic again to stop.",
      });
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      // Show interim result in real time
      if (interim || finalTranscript) {
        onTranscript((finalTranscript || interim).trim());
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      setIsProcessing(false);
      if (finalTranscript.trim()) {
        toast({
          title: "Voice captured",
          description: `"${finalTranscript.trim().slice(0, 60)}${finalTranscript.length > 60 ? "..." : ""}"`,
        });
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsRecording(false);
      setIsProcessing(false);

      const messages: Record<string, string> = {
        "no-speech": "No speech detected. Please try again.",
        "audio-capture": "Microphone not found or not accessible.",
        "not-allowed":
          "Microphone permission denied. Allow microphone access in browser settings.",
        "network": "Network error during recognition.",
        "aborted": "", // user stopped — no error toast needed
      };

      const msg = messages[event.error];
      if (msg) {
        toast({
          title: "Voice error",
          description: msg,
          variant: "destructive",
        });
      }
    };

    recognition.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsProcessing(true);
    }
  };

  if (!isSupported) {
    return (
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 opacity-40 cursor-not-allowed"
        disabled
        title="Voice search not supported in this browser"
      >
        <MicOff className="h-5 w-5 text-muted-foreground" />
      </Button>
    );
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-8 w-8"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isProcessing}
      title={isRecording ? "Stop recording" : "Start voice search"}
    >
      {isProcessing ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <Mic
          className={`h-5 w-5 transition-colors ${
            isRecording
              ? "text-red-500 animate-pulse"
              : "text-muted-foreground hover:text-accent"
          }`}
        />
      )}
    </Button>
  );
};

export default VoiceSearch;
