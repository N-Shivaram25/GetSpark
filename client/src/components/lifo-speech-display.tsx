import { useEffect, useRef, useState } from "react";
import { useKeywords } from "@/hooks/use-keywords";
import { useQuery } from "@tanstack/react-query";

interface LifoSpeechDisplayProps {
  speechLines: string[];
  displayText: string;
  isListening?: boolean;
  mode: 'keyflow' | 'imgkey';
  detectedKeywords: Array<{ keyword: string; timestamp: number }>;
}

export default function LifoSpeechDisplay({ 
  speechLines, 
  displayText, 
  isListening = false, 
  mode, 
  detectedKeywords
}: LifoSpeechDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { keywords } = useKeywords();
  const [vibrantAnimation, setVibrantAnimation] = useState(false);
  
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

  // Animate vibrant entry point when new text is being processed
  useEffect(() => {
    if (displayText) {
      setVibrantAnimation(true);
      const timer = setTimeout(() => setVibrantAnimation(false), 500);
      return () => clearTimeout(timer);
    }
  }, [displayText]);

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

  // Check if line 4 has space for the vibrant entry point
  const hasVibrantSpace = () => {
    const line4 = speechLines[3] || '';
    const words = line4.trim().split(/\s+/).filter(w => w.length > 0);
    return words.length < 10; // WORDS_PER_LINE = 10
  };

  return (
    <div className="space-y-3">
      {/* LIFO Speech Display - Fixed 4 Lines */}
      <div
        ref={containerRef}
        className="rounded-xl p-6 bg-card border-2 border-gray-200 min-h-[200px] font-mono text-lg leading-relaxed overflow-hidden shadow-lg"
      >
        <div className="text-card-foreground">
          <div className="text-sm text-muted-foreground mb-3 font-semibold">
            Advanced Speech Recognition - LIFO Mode
          </div>
          
          {speechLines.every(line => !line.trim()) && !displayText ? (
            <div className="text-muted-foreground italic text-center py-8">
              Start speaking to see your words appear here with letter-by-letter typing animation...
            </div>
          ) : (
            <div className="space-y-2">
              {/* Always render exactly 4 lines */}
              {speechLines.map((line, index) => {
                const isLastLine = index === 3;
                const lineWords = line.trim().split(/\s+/).filter(w => w.length > 0);
                
                return (
                  <div 
                    key={index} 
                    className="text-card-foreground h-7 flex items-center transition-all duration-300"
                  >
                    <div className="flex-1">
                      {line ? (
                        <span 
                          className="inline-block"
                          dangerouslySetInnerHTML={{ 
                            __html: highlightKeywords(line) 
                          }}
                        />
                      ) : (
                        <span className="text-gray-300 select-none">&nbsp;</span>
                      )}
                    </div>
                    
                    {/* Vibrant entry point at end of line 4 */}
                    {isLastLine && hasVibrantSpace() && (
                      <div className="ml-3 flex items-center">
                        <div className={`
                          px-3 py-1 rounded-full text-xs font-bold transition-all duration-300
                          ${vibrantAnimation || isListening 
                            ? 'bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 text-white animate-pulse shadow-lg' 
                            : 'bg-gradient-to-r from-green-300 via-blue-400 to-purple-500 text-white shadow-md'
                          }
                        `}>
                          {displayText ? (
                            <span className="animate-pulse">
                              ⟨{displayText}⟩
                            </span>
                          ) : (
                            <span>
                              ⟨NEW⟩
                            </span>
                          )}
                        </div>
                        
                        {/* Letter entry animation indicator */}
                        {isListening && (
                          <div className="ml-2 flex space-x-1">
                            <div className="w-1 h-1 bg-green-500 rounded-full animate-ping"></div>
                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-1 h-1 bg-purple-500 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Speech Status and Flow Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* LIFO Flow Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">
            LIFO Speech Flow Status
          </h4>
          <div className="space-y-1">
            <div className="text-xs text-blue-700">
              Mode: Letter-by-letter typing animation
            </div>
            <div className="text-xs text-blue-700">
              Lines: 4/4 (Fixed Structure)
            </div>
            <div className="text-xs text-blue-600">
              📝 Entry Point: Line 4 end (Vibrant Box)
            </div>
            <div className="text-xs text-blue-600">
              🔄 Exit Point: Line 1 beginning (Letters disappear)
            </div>
            <div className="text-xs text-blue-600">
              ⚡ Flow Direction: Backward (LIFO)
            </div>
            {hasVibrantSpace() && (
              <div className="text-xs text-green-600 font-medium animate-pulse">
                ✨ Vibrant Space: Available
              </div>
            )}
            {isListening && (
              <div className="text-xs text-green-600 font-medium animate-pulse">
                🎤 Listening: Active
              </div>
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
    </div>
  );
}