import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechHook {
  isListening: boolean;
  speechLines: string[];
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  clearSpeech: () => void;
}

export const useRealTimeSpeech = (): SpeechHook => {
  const [isListening, setIsListening] = useState(false);
  const [speechLines, setSpeechLines] = useState<string[]>(['', '', '', '']);
  const [transcript, setTranscript] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const displayTextRef = useRef('');
  const animationRef = useRef<number>();
  
  const CHARS_PER_LINE = 80;
  const MAX_LINES = 4;
  const MAX_TOTAL_CHARS = CHARS_PER_LINE * MAX_LINES; // 320 total chars

  const updateDisplay = useCallback(() => {
    const text = displayTextRef.current;
    
    // If text exceeds capacity, remove characters from the beginning (LIFO)
    if (text.length > MAX_TOTAL_CHARS) {
      displayTextRef.current = text.slice(-MAX_TOTAL_CHARS);
    }
    
    const finalText = displayTextRef.current;
    const lines = ['', '', '', ''];
    
    // Fill lines character by character
    let charIndex = 0;
    for (let lineIndex = 0; lineIndex < MAX_LINES && charIndex < finalText.length; lineIndex++) {
      const remainingChars = finalText.length - charIndex;
      const charsForThisLine = Math.min(CHARS_PER_LINE, remainingChars);
      lines[lineIndex] = finalText.substring(charIndex, charIndex + charsForThisLine);
      charIndex += charsForThisLine;
    }
    
    setSpeechLines(lines);
  }, []);

  const processCharacter = useCallback((char: string) => {
    displayTextRef.current += char;
    updateDisplay();
  }, [updateDisplay]);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.maxAlternatives = 1;

    let lastProcessedLength = 0;

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event: any) => {
      let currentTranscript = '';
      
      // Get the latest transcript
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          currentTranscript += transcript;
        } else {
          currentTranscript += transcript;
        }
      }

      setTranscript(currentTranscript);

      // Process new characters one by one
      if (currentTranscript.length > lastProcessedLength) {
        const newText = currentTranscript.slice(lastProcessedLength);
        
        // Add characters immediately for real-time typing
        for (let i = 0; i < newText.length; i++) {
          processCharacter(newText[i]);
        }
        
        lastProcessedLength = currentTranscript.length;
      }

      // Handle final results
      if (event.results[event.results.length - 1].isFinal) {
        // Add space after final result
        setTimeout(() => {
          processCharacter(' ');
          setTranscript('');
          lastProcessedLength = 0;
        }, 100);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      setTranscript('');
    };

    recognitionRef.current.start();
  }, [processCharacter]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setTranscript('');
  }, []);

  const clearSpeech = useCallback(() => {
    displayTextRef.current = '';
    setSpeechLines(['', '', '', '']);
    setTranscript('');
  }, []);

  return {
    isListening,
    speechLines,
    transcript,
    startListening,
    stopListening,
    clearSpeech
  };
};