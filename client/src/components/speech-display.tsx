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
      className="border border-blue-200 rounded-xl p-6 bg-white/80 backdrop-blur-sm min-h-[180px] font-mono text-sm leading-relaxed overflow-hidden shadow-sm"
    >
      <div className="space-y-1 text-blue-900">
        {speechLines.length === 0 && !transcript ? (
          <div className="text-blue-600 italic">Start speaking to see your words appear here...</div>
        ) : (
          <>
            {speechLines.map((line, index) => (
              <div key={index} className="text-blue-900">
                {line}
              </div>
            ))}
            {transcript && (
              <div className="text-blue-900 opacity-75">
                {transcript}
              </div>
            )}
          </>
        )}
        {/* Ensure we always have 6 lines */}
        {Array.from({ length: Math.max(0, 6 - speechLines.length - (transcript ? 1 : 0)) }).map((_, index) => (
          <div key={`empty-${index}`} className="opacity-0">Line {speechLines.length + (transcript ? 1 : 0) + index + 1}</div>
        ))}
      </div>
    </div>
  );
}
