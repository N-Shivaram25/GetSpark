import { useEffect, useRef } from "react";

interface SpeechDisplayProps {
  speechLines: string[];
  transcript: string;
}

export default function SpeechDisplay({ speechLines, transcript }: SpeechDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [speechLines, transcript]);

  return (
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
              <div key={index} className="text-card-foreground">
                {line}
              </div>
            ))}
            {transcript && (
              <div className="text-card-foreground opacity-75">
                {transcript}
              </div>
            )}
            {/* Ensure we always have 4 lines */}
            {Array.from({ length: Math.max(0, 4 - speechLines.length - (transcript ? 1 : 0)) }).map((_, index) => (
              <div key={`empty-${index}`} className="opacity-0">Line {speechLines.length + (transcript ? 1 : 0) + index + 1}</div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
