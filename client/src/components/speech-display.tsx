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
        className="rounded-xl p-6 bg-card min-h-[120px] font-mono text-sm leading-relaxed overflow-hidden shadow-sm"
      >
        <div className="space-y-1 text-card-foreground">
          {speechLines.length === 0 && !transcript ? (
            <div className="text-muted-foreground italic">Start speaking to see your words appear here...</div>
          ) : (
            <>
              {/* Always render exactly 4 lines with strict line management */}
              {Array.from({ length: 4 }).map((_, index) => {
                const line = speechLines[index] || '';
                const isLastLine = index === 3;
                const hasVibrantSpace = line.includes('■');
                
                return (
                  <div 
                    key={index} 
                    className="text-card-foreground h-5 transition-all duration-300"
                  >
                    {line ? (
                      <>
                        <span 
                          dangerouslySetInnerHTML={{ 
                            __html: highlightKeywords(line.replace(' ■', '')) 
                          }}
                        />
                        {/* Vibrant space indicator at end of line 4 */}
                        {isLastLine && hasVibrantSpace && (
                          <span className="ml-2 inline-block">
                            <span className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-2 py-0.5 rounded-full text-xs animate-pulse font-bold">
                              ⟨NEW⟩
                            </span>
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-300 select-none">&nbsp;</span>
                    )}
                  </div>
                );
              })}
              
              {/* Current transcript (if any) - this should not create a 5th line */}
              {transcript && speechLines.length < 4 && (
                <div className="text-card-foreground opacity-75 text-xs text-muted-foreground">
                  Current: {transcript} {isListening && <span className="animate-pulse">|</span>}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Speech Status and Detected Keywords */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Speech Pattern Status */}
        {speechLines.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">
              Enhanced Speech Recognition Status
            </h4>
            <div className="space-y-1">
              <div className="text-xs text-blue-700">
                Lines: {speechLines.length}/4
              </div>
              {speechLines.length >= 4 && (
                <div className="text-xs text-blue-600 font-medium">
                  🔄 LIFO Mode: Words flow backward from line 1
                </div>
              )}
              <div className="text-xs text-blue-600">
                OpenAI Grammar Correction: Active
              </div>
              {isEnhancing && (
                <div className="text-xs text-blue-600 font-medium animate-pulse">
                  🤖 OpenAI Enhancement: Processing...
                </div>
              )}
              <div className="text-xs text-blue-600">
                Strict 4-line limit: Enforced
              </div>
              <div className="text-xs text-blue-600">
                Vibrant entry space: Line 4 end
              </div>
            </div>
          </div>
        )}

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
