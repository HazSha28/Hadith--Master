import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  User, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Star,
  Share2,
  Bookmark,
  Volume2,
  Copy,
  ExternalLink
} from "lucide-react";
import { type EnhancedHadith } from "@/lib/enhancedHadithService";

interface EnhancedHadithCardProps {
  hadith: EnhancedHadith;
  showCrossReferences?: boolean;
  className?: string;
}

export function EnhancedHadithCard({ 
  hadith, 
  showCrossReferences = true, 
  className 
}: EnhancedHadithCardProps) {
  const [showTranslation, setShowTranslation] = useState<'arabic' | 'english' | 'urdu' | 'all'>('all');
  const [copied, setCopied] = useState(false);

  const getAuthenticityColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getGradeIcon = (grade: string) => {
    switch (grade) {
      case 'Sahih': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Hasan': return <Star className="h-4 w-4 text-yellow-600" />;
      case 'Da\'if': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const copyToClipboard = async () => {
    const text = `${hadith.arabic_text}\n\n${hadith.english_translation}\n\n${hadith.source_reference}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareHadith = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Hadith from ${hadith.book_name}`,
          text: `${hadith.arabic_text}\n\n${hadith.english_translation}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{hadith.book_name}</span>
              <Badge variant="outline" className="text-xs">
                Hadith {hadith.hadith_number}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{hadith.kitab}</span>
              <span>•</span>
              <span>{hadith.bab}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1">
              {getGradeIcon(hadith.grade)}
              <Badge className={getAuthenticityColor(hadith.authenticity_level)}>
                {hadith.grade} ({hadith.authenticity_level})
              </Badge>
            </div>
            
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500" />
              <span className="text-xs text-muted-foreground">
                Quality: {hadith.metadata.quality_score}%
              </span>
            </div>
          </div>
        </div>

        {/* Themes */}
        <div className="flex flex-wrap gap-1">
          {hadith.themes.map((theme, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {theme}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Narrator */}
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Narrated by:</span>
          <span>{hadith.narrator}</span>
        </div>

        {/* Translation Toggle */}
        <div className="flex gap-2">
          <Button
            variant={showTranslation === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowTranslation('all')}
          >
            All
          </Button>
          <Button
            variant={showTranslation === 'arabic' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowTranslation('arabic')}
          >
            Arabic
          </Button>
          <Button
            variant={showTranslation === 'english' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowTranslation('english')}
          >
            English
          </Button>
          <Button
            variant={showTranslation === 'urdu' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowTranslation('urdu')}
          >
            Urdu
          </Button>
        </div>

        {/* Hadith Text */}
        <div className="space-y-3">
          {(showTranslation === 'all' || showTranslation === 'arabic') && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Arabic:</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Volume2 className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-right leading-relaxed text-lg font-arabic" dir="rtl">
                {hadith.arabic_text}
              </p>
            </div>
          )}

          {(showTranslation === 'all' || showTranslation === 'english') && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">English:</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Volume2 className="h-3 w-3" />
                </Button>
              </div>
              <p className="leading-relaxed">
                {hadith.english_translation}
              </p>
            </div>
          )}

          {(showTranslation === 'all' || showTranslation === 'urdu') && hadith.urdu_translation && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Urdu:</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Volume2 className="h-3 w-3" />
                </Button>
              </div>
              <p className="leading-relaxed" dir="rtl">
                {hadith.urdu_translation}
              </p>
            </div>
          )}
        </div>

        {/* Isnad and Matn */}
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-muted-foreground">Isnad:</span>
            <p className="text-muted-foreground">{hadith.isnad}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Matn:</span>
            <p className="text-muted-foreground">{hadith.matn}</p>
          </div>
        </div>

        {/* Scholar Verification */}
        {hadith.scholar_verification && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <span className="text-sm font-medium text-blue-800">Scholar Verification:</span>
                <p className="text-sm text-blue-700 mt-1">{hadith.scholar_verification}</p>
              </div>
            </div>
          </div>
        )}

        {/* Cross References */}
        {showCrossReferences && hadith.cross_references.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <div>
              <span className="text-sm font-medium">Cross References:</span>
              <div className="mt-2 space-y-1">
                {hadith.cross_references.map((ref, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                    <ExternalLink className="h-3 w-3" />
                    <span>
                      <strong>{ref.book}:</strong> {ref.reference} - {ref.description}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {ref.theme}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Keywords */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground">Keywords:</span>
          <div className="flex flex-wrap gap-1">
            {hadith.keywords.map((keyword, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>

        {/* Source Reference */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">{hadith.source_reference}</span>
          
          {/* Action Buttons */}
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={copyToClipboard}>
              {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={shareHadith}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Verification Warning */}
        {hadith.metadata.verification_required && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                This hadith requires scholarly verification
              </span>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-muted-foreground border-t pt-2">
          <div className="flex justify-between">
            <span>Source: {hadith.metadata.source_api}</span>
            <span>Updated: {new Date(hadith.metadata.last_updated).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
