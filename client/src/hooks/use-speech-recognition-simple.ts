import { useState, useEffect, useRef, useCallback } from "react";

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [speechLines, setSpeechLines] = useState<string[]>(['', '', '', '']);
  
  const recognitionRef = useRef<any>(null);
  const allTextRef = useRef('');
  
  const CHARS_PER_LINE = 50;
  const MAX_LINES = 4;

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    // Enhanced speech recognition settings for better accuracy
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.maxAlternatives = 3;

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(interimTranscript);

      if (finalTranscript) {
        const text = finalTranscript.trim();
        // Add to accumulated text
        allTextRef.current += (allTextRef.current ? ' ' : '') + text;
        
        // Update display with LIFO behavior
        updateDisplayLines();
        setTranscript(''); // Clear interim transcript
      }
    };
    
    const updateDisplayLines = () => {
      const text = allTextRef.current;
      if (!text) {
        setSpeechLines(['', '', '', '']);
        return;
      }

      const maxTotalChars = CHARS_PER_LINE * MAX_LINES; // 200 chars total
      
      let displayText = text;
      
      // If text exceeds capacity, implement LIFO (remove from beginning)
      if (text.length > maxTotalChars) {
        displayText = text.slice(-maxTotalChars);
        allTextRef.current = displayText; // Update accumulated text
      }
      
      // Break text into 4 lines
      const lines = ['', '', '', ''];
      let currentIndex = 0;
      
      for (let lineIndex = 0; lineIndex < MAX_LINES && currentIndex < displayText.length; lineIndex++) {
        const remainingText = displayText.slice(currentIndex);
        
        if (remainingText.length <= CHARS_PER_LINE) {
          // Remaining text fits in current line
          lines[lineIndex] = remainingText;
          break;
        } else {
          // Find the best break point (preferably at a space)
          let breakPoint = CHARS_PER_LINE;
          const segment = remainingText.slice(0, CHARS_PER_LINE + 10);
          const lastSpaceIndex = segment.lastIndexOf(' ', CHARS_PER_LINE);
          
          if (lastSpaceIndex > CHARS_PER_LINE - 15 && lastSpaceIndex !== -1) {
            breakPoint = lastSpaceIndex;
          }
          
          lines[lineIndex] = remainingText.slice(0, breakPoint);
          currentIndex += breakPoint;
          
          // Skip leading spaces on next line
          while (currentIndex < displayText.length && displayText[currentIndex] === ' ') {
            currentIndex++;
          }
        }
      }
      
      setSpeechLines(lines);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    speechLines,
    startListening,
    stopListening,
    recognitionRef,
    setSpeechLines,
    setTranscript,
    allTextRef
  };
}