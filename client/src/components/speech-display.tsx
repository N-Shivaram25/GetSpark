import { useEffect, useRef } from "react";
import { useKeywords } from "@/hooks/use-keywords";
import { useQuery } from "@tanstack/react-query";

interface SpeechDisplayProps {
  speechLines: string[];
  transcript: string;
  isListening?: boolean;
  mode: 'keyflow' | 'imgkey';
  detectedKeywords: Array<{ keyword: string; timestamp: number }>;
  isEnhancing?: boolean;
}

export default function SpeechDisplay({ 
  speechLines, 
  transcript, 
  isListening = false, 
  mode, 
  detectedKeywords,
  isEnhancing = false
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
        className="rounded-xl p-6 bg-card min-h-[200px] font-mono text-base leading-relaxed overflow-hidden shadow-lg mx-auto"
        style={{ width: '80vw' }}
      >
        <div className="text-card-foreground" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {speechLines.length === 0 && !transcript ? (
            <div className="text-muted-foreground italic">Start speaking to see your words appear here...</div>
          ) : (
            <>
              {/* Always render exactly 4 lines with natural flow and LIFO */}
              {speechLines.map((line, index) => {
                const isLastLine = index === 3;
                
                return (
                  <div 
                    key={index} 
                    className="text-card-foreground flex items-start"
                    style={{ height: '32px', lineHeight: '32px', minHeight: '32px' }}
                  >
                    <div className="flex-1" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                      {line ? (
                        <span 
                          dangerouslySetInnerHTML={{ 
                            __html: highlightKeywords(line) 
                          }}
                        />
                      ) : (
                        <span className="text-gray-300 select-none">&nbsp;</span>
                      )}

                    </div>
                    
                    {/* Colorful indicator at end of line 4 */}
                    {isLastLine && (
                      <div className="flex items-center">
                        <div className={`
                          w-4 h-6 rounded-sm transition-all duration-200 ml-2
                          ${isListening 
                            ? 'bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 shadow-lg' 
                            : 'bg-gradient-to-br from-green-300 via-blue-400 to-purple-500 shadow-sm'
                          }
                          ${isListening ? 'animate-pulse' : ''}
                        `}>
                          {/* Blinking effect when listening */}
                          {isListening && (
                            <div className="w-full h-full bg-white opacity-30 animate-ping rounded-sm"></div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

            </>
          )}
        </div>
      </div>

      {/* Speech Status and Detected Keywords */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">


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
    </div>
  );
}
