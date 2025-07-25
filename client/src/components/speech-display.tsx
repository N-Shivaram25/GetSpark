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
      className="border border-purple-500/30 rounded-xl p-6 glass-morph min-h-[180px] font-mono text-sm leading-relaxed overflow-hidden shadow-2xl"
    >
      <div className="space-y-1 text-white">
        {speechLines.length === 0 && !transcript ? (
          <div className="text-purple-300 italic">Start speaking to see your words appear here...</div>
        ) : (
          <>
            {speechLines.map((line, index) => (
              <div key={index} className="text-white">
                {line}
              </div>
            ))}
            {transcript && (
              <div className="text-white opacity-75">
                {transcript}
              </div>
            )}
            {/* Ensure we always have 6 lines */}
            {Array.from({ length: Math.max(0, 6 - speechLines.length - (transcript ? 1 : 0)) }).map((_, index) => (
              <div key={`empty-${index}`} className="opacity-0">Line {speechLines.length + (transcript ? 1 : 0) + index + 1}</div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
