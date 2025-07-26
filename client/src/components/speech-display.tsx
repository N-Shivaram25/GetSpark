import { useEffect, useRef } from "react";
import { useKeywords } from "@/hooks/use-keywords";
import { useQuery } from "@tanstack/react-query";

interface SpeechDisplayProps {
  speechLines: string[];
  transcript: string;
  isListening?: boolean;
  mode: 'keyflow' | 'imgkey';
  detectedKeywords: Array<{ keyword: string; timestamp: number }>;
}

export default function SpeechDisplay({ 
  speechLines, 
  transcript, 
  isListening = false, 
  mode, 
  detectedKeywords 
}: SpeechDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { keywords } = useKeywords();
  
  // Get image mappings for Img Key mode
  const { data: imgKeyMappings = [] } = useQuery<Array<{
    id: string;
    keyword: string;
    duration: number | null;
    imageUrls: string[];
    bulletPoints: boolean | null;
  }>>({
    queryKey: ['/api/img-key-mappings'],
    enabled: mode === 'imgkey'
  });

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [speechLines, transcript]);

  // Function to highlight keywords in text
  const highlightKeywords = (text: string) => {
    if (!text) return text;
    
    let highlightedText = text;
    const keywordsToHighlight = mode === 'keyflow' 
      ? keywords.map(k => k.keyword)
      : imgKeyMappings.map(m => m.keyword);
    
    // Sort keywords by length (longest first) to avoid partial replacements
    const sortedKeywords = keywordsToHighlight.sort((a: string, b: string) => b.length - a.length);
    
    sortedKeywords.forEach((keyword: string) => {
      const isDetected = detectedKeywords.some(dk => 
        dk.keyword.toLowerCase() === keyword.toLowerCase()
      );
      
      if (isDetected) {
        // Create regex for case-insensitive matching with word boundaries
        const keywordRegex = new RegExp(
          `\\b(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 
          'gi'
        );
        
        highlightedText = highlightedText.replace(keywordRegex, (match) => {
          return `<span class="bg-green-200 text-green-800 px-1 rounded font-semibold animate-pulse">${match}</span>`;
        });
      }
    });
    
    return highlightedText;
  };

  return (
    <div className="space-y-3">
      {/* Speech Display */}
      <div
        ref={containerRef}
        className="rounded-xl p-6 bg-card min-h-[120px] font-mono text-sm leading-relaxed overflow-hidden shadow-sm"
      >
        <div className="space-y-1 text-card-foreground">
          {speechLines.length === 0 && !transcript ? (
            <div className="text-muted-foreground italic">Start speaking to see your words appear here...</div>
          ) : (
            <>
              {speechLines.map((line, index) => (
                <div 
                  key={index} 
                  className="text-card-foreground"
                  dangerouslySetInnerHTML={{ __html: highlightKeywords(line) }}
                />
              ))}
              {transcript && (
                <div 
                  className="text-card-foreground opacity-75"
                  dangerouslySetInnerHTML={{ 
                    __html: highlightKeywords(transcript) + 
                           (isListening ? '<span class="animate-pulse">|</span>' : '')
                  }}
                />
              )}
              {/* Ensure we always have 4 lines */}
              {Array.from({ length: Math.max(0, 4 - speechLines.length - (transcript ? 1 : 0)) }).map((_, index) => (
                <div key={`empty-${index}`} className="opacity-0">Line {speechLines.length + (transcript ? 1 : 0) + index + 1}</div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Detected Keywords Display */}
      {detectedKeywords.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-green-800 mb-2">
            Detected Keywords ({mode === 'keyflow' ? 'Keyflow' : 'Img Key'} Mode)
          </h4>
          <div className="flex flex-wrap gap-2">
            {detectedKeywords.map((detected, index) => (
              <span
                key={index}
                className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium border border-green-300"
              >
                {detected.keyword}
                <span className="ml-1 text-green-500">
                  {new Date(detected.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
