import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onExtractedText: (text: string) => void;
}

export const FileUpload = ({ onExtractedText }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  // Read a plain text / markdown file directly
  const extractFromTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || "");
      reader.onerror = reject;
      reader.readAsText(file, "utf-8");
    });
  };

  // OCR — English only, Engine 2 (best for printed Latin text)
  const extractFromImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", "eng");          // English only
    formData.append("isOverlayRequired", "false");
    formData.append("detectOrientation", "true");
    formData.append("scale", "true");
    formData.append("OCREngine", "2");            // Engine 2: best for English printed text

    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: { apikey: "helloworld" },          // free public key — 25k req/month
      body: formData,
    });

    if (!response.ok) throw new Error("OCR request failed");

    const data = await response.json();
    if (data.IsErroredOnProcessing) {
      throw new Error(data.ErrorMessage?.[0] || "OCR processing failed");
    }

    const extracted = data.ParsedResults?.[0]?.ParsedText?.trim() || "";
    if (!extracted) throw new Error("No English text found in image");
    return extracted;
  };

  // Clean OCR output for use as a search query
  // Goal: remove noise (book refs, numbers, quotes) but keep enough
  // natural language so the AI search can understand the intent
  const cleanForSearch = (text: string): string => {
    return text
      .replace(/\r?\n/g, " ")                         // newlines → spaces
      .replace(/\s+/g, " ")                            // collapse whitespace
      .replace(/^["'""'']+|["'""'']+$/g, "")           // strip surrounding quotes
      .replace(/["""'']/g, "")                         // strip all quote chars
      // Remove book/reference noise OCR often picks up at image edges
      .replace(/\b(sahih|sunan|jami|musnad|muwatta|vol|volume|book|no|number|pg|page|hadith)\b[^\.\?!]*/gi, " ")
      .replace(/\b\d{3,}\b/g, " ")                    // remove large standalone numbers
      .replace(/[^\w\s\-']/g, " ")                    // remove remaining punctuation
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300);                                  // 300 chars is plenty for AI search
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isText =
      file.type === "text/plain" ||
      file.name.endsWith(".txt") ||
      file.name.endsWith(".md");

    if (!isImage && !isText) {
      toast({
        title: "Unsupported file type",
        description: "Please upload an English image (JPG, PNG) or a text file (.txt)",
        variant: "destructive",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setLoading(true);
    toast({
      title: isImage ? "Reading image..." : "Reading file...",
      description: isImage
        ? "Extracting English text via OCR..."
        : "Loading text from file...",
    });

    try {
      let rawText = "";

      if (isText) {
        rawText = await extractFromTextFile(file);
      } else {
        rawText = await extractFromImage(file);
        console.log("OCR raw output:", rawText);
      }

      const finalQuery = cleanForSearch(rawText);

      if (!finalQuery.trim()) {
        toast({
          title: "Nothing extracted",
          description: "Could not find readable English text. Try a clearer image.",
          variant: "destructive",
        });
        return;
      }

      onExtractedText(finalQuery.trim());
      toast({
        title: "Text extracted",
        description: `"${finalQuery.trim().slice(0, 70)}${finalQuery.length > 70 ? "..." : ""}"`,
      });
    } catch (error: any) {
      console.error("File upload error:", error);
      toast({
        title: "Extraction failed",
        description:
          error?.message ||
          "Could not read text. Try a clearer English image or a .txt file.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,.txt,.md"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={handleFileClick}
        disabled={loading}
        title="Upload English image or text file to search"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="h-5 w-5 text-muted-foreground hover:text-accent" />
        )}
      </Button>
    </>
  );
};

export default FileUpload;
