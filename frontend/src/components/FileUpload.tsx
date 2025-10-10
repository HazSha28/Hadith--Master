import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onExtractedText: (text: string) => void;
}

export const FileUpload = ({ onExtractedText }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Processing file",
        description: "Extracting text from image...",
      });

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64File = reader.result as string;

        const { data, error } = await supabase.functions.invoke('process-upload', {
          body: { 
            file: base64File,
            fileType: file.type 
          }
        });

        if (error) throw error;

        if (data?.text) {
          onExtractedText(data.text);
          toast({
            title: "Text extracted",
            description: "Content has been added to search",
          });
        }
      };
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Failed to process file",
        variant: "destructive",
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={handleFileClick}
      >
        <Upload className="h-5 w-5 text-muted-foreground hover:text-accent" />
      </Button>
    </>
  );
};
