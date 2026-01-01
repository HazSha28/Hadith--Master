import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { VoiceSearch } from "@/components/VoiceSearch";
import { FileUpload } from "@/components/FileUpload";

type HadithSearchBarProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
  disabled?: boolean;
};

export function HadithSearchBar({
  value,
  onValueChange,
  onSearch,
  placeholder,
  disabled,
}: HadithSearchBarProps) {
  return (
    <div className="relative">
      <Input
        placeholder={placeholder || "Search hadiths by keywords, narrator, or topic..."}
        className="bg-input border-border pl-10 pr-28"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSearch();
          }
        }}
        disabled={disabled}
      />

      <div className="absolute left-3 top-1/2 -translate-y-1/2">
        <Search className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        <VoiceSearch
          onTranscript={(text) => onValueChange((value + " " + text).trim())}
        />
        <FileUpload
          onExtractedText={(text) => onValueChange((value + " " + text).trim())}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={onSearch}
          disabled={disabled}
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
