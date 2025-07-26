import { useState, useEffect, useRef, useCallback } from 'react';

interface LifoSpeechRecognitionState {
  isListening: boolean;
  displayText: string;
  speechLines: string[];
  startListening: () => void;
  stopListening: () => void;
  clearSpeech: () => void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export function useLifoSpeechRecognition(): LifoSpeechRecognitionState {
  const [isListening, setIsListening] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [speechLines, setSpeechLines] = useState<string[]>(['', '', '', '']);
  
  const recognitionRef = useRef<any | null>(null);
  const allTextBuffer = useRef('');
  
  const CHARS_PER_LINE = 50; // Approximately 10 words per line
  const TOTAL_LINES = 4;

  // Initialize speech recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
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

      // Update display with interim results
      setDisplayText(interimTranscript);

      // Process final transcript
      if (finalTranscript.trim()) {
        const newText = finalTranscript.trim();
        allTextBuffer.current += (allTextBuffer.current ? ' ' : '') + newText;
        
        // Update display with all text
        updateDisplayLines();
        
        setDisplayText(''); // Clear interim display
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  // Update display lines with proper flow
  const updateDisplayLines = () => {
    const text = allTextBuffer.current;
    if (!text) {
      setSpeechLines(['', '', '', '']);
      return;
    }

    const maxTotalChars = CHARS_PER_LINE * TOTAL_LINES; // 200 chars total (4 lines × 50 chars each)
    
    let displayText = text;
    
    // If text exceeds capacity, implement LIFO (remove from beginning)
    if (text.length > maxTotalChars) {
      // Keep only the last maxTotalChars characters
      displayText = text.slice(-maxTotalChars);
      allTextBuffer.current = displayText; // Update buffer to reflect trimmed text
    }
    
    // Break text into lines
    const lines = ['', '', '', ''];
    let currentIndex = 0;
    
    for (let lineIndex = 0; lineIndex < TOTAL_LINES && currentIndex < displayText.length; lineIndex++) {
      const remainingText = displayText.slice(currentIndex);
      
      if (remainingText.length <= CHARS_PER_LINE) {
        // Remaining text fits in current line
        lines[lineIndex] = remainingText;
        break;
      } else {
        // Find the best break point (preferably at a space)
        let breakPoint = CHARS_PER_LINE;
        const segment = remainingText.slice(0, CHARS_PER_LINE + 10); // Look ahead a bit
        const lastSpaceIndex = segment.lastIndexOf(' ', CHARS_PER_LINE);
        
        if (lastSpaceIndex > CHARS_PER_LINE - 20 && lastSpaceIndex !== -1) {
          // Use space break if it's not too far back
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

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const clearSpeech = useCallback(() => {
    setDisplayText('');
    setSpeechLines(['', '', '', '']);
    allTextBuffer.current = '';
  }, []);

  return {
    isListening,
    displayText,
    speechLines,
    startListening,
    stopListening,
    clearSpeech
  };
}