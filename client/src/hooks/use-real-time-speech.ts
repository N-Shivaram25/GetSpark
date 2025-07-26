import { useState, useRef, useCallback, useEffect } from 'react';
import { useEnhancedSpeech } from './use-enhanced-speech';

interface SpeechHook {
  isListening: boolean;
  speechLines: string[];
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  clearSpeech: () => void;
  
  // Enhanced speech features
  accuracyScore: number;
  corrections: Array<{
    original: string;
    corrected: string;
    reason: string;
  }>;
  isProcessingAccuracy: boolean;
  correctText: (text: string) => Promise<string>;
  detectKeywords: (text: string, keywords: string[]) => Promise<any>;
}

export const useRealTimeSpeech = (): SpeechHook => {
  const [isListening, setIsListening] = useState(false);
  const [speechLines, setSpeechLines] = useState<string[]>(['', '', '', '']);
  const [transcript, setTranscript] = useState('');
  
  // Enhanced speech processing
  const enhancedSpeech = useEnhancedSpeech();
  
  const recognitionRef = useRef<any>(null);
  const displayTextRef = useRef('');
  const animationRef = useRef<number>();
  const lastSpeechTimeRef = useRef<number>(Date.now());
  const pauseTimeoutRef = useRef<NodeJS.Timeout>();
  const silenceTimeoutRef = useRef<NodeJS.Timeout>();
  const isListeningRef = useRef(false);
  
  const CHARS_PER_LINE = 100; // Increased to fill more space
  const MAX_LINES = 4;
  const MAX_TOTAL_CHARS = CHARS_PER_LINE * MAX_LINES; // 400 total chars
  const SHORT_PAUSE_MS = 5000; // 5 seconds for comma
  const LONG_PAUSE_MS = 10000; // 10 seconds for period

  const updateDisplay = useCallback(() => {
    const text = displayTextRef.current;
    
    // If text exceeds capacity, remove characters from the beginning (LIFO)
    if (text.length > MAX_TOTAL_CHARS) {
      displayTextRef.current = text.slice(-MAX_TOTAL_CHARS);
    }
    
    const finalText = displayTextRef.current;
    const lines = ['', '', '', ''];
    
    // Fill lines with proper word wrapping to utilize full width
    let charIndex = 0;
    for (let lineIndex = 0; lineIndex < MAX_LINES && charIndex < finalText.length; lineIndex++) {
      const remainingText = finalText.substring(charIndex);
      
      if (remainingText.length <= CHARS_PER_LINE) {
        // Remaining text fits in current line
        lines[lineIndex] = remainingText;
        break;
      } else {
        // Find the best break point at a word boundary
        let breakPoint = CHARS_PER_LINE;
        const segment = remainingText.substring(0, CHARS_PER_LINE + 20);
        const lastSpaceIndex = segment.lastIndexOf(' ', CHARS_PER_LINE);
        
        if (lastSpaceIndex > CHARS_PER_LINE - 15 && lastSpaceIndex !== -1) {
          breakPoint = lastSpaceIndex;
        }
        
        lines[lineIndex] = remainingText.substring(0, breakPoint);
        charIndex += breakPoint;
        
        // Skip leading spaces on next line
        while (charIndex < finalText.length && finalText[charIndex] === ' ') {
          charIndex++;
        }
      }
    }
    
    setSpeechLines(lines);
  }, []);

  const processCharacter = useCallback((char: string) => {
    displayTextRef.current += char;
    updateDisplay();
  }, [updateDisplay]);

  const addPunctuation = useCallback((punctuation: string) => {
    // Only add punctuation if the last character isn't already punctuation
    const lastChar = displayTextRef.current.slice(-1);
    if (lastChar && !/[,.!?;:]/.test(lastChar)) {
      displayTextRef.current += punctuation;
      updateDisplay();
    }
  }, [updateDisplay]);

  const handlePauseDetection = useCallback(() => {
    // Clear existing timeouts
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    
    console.log('Setting up pause detection timeouts');
    
    // Set up comma timeout (5 seconds)
    pauseTimeoutRef.current = setTimeout(() => {
      console.log('Adding comma after 5 second pause');
      addPunctuation(',');
      
      // After adding comma, set up period timeout (additional 5 seconds = 10 total)
      silenceTimeoutRef.current = setTimeout(() => {
        console.log('Converting comma to period after 10 second total pause');
        // Replace the last comma with a period
        const text = displayTextRef.current;
        if (text.endsWith(',')) {
          displayTextRef.current = text.slice(0, -1) + '.';
          updateDisplay();
        } else {
          addPunctuation('.');
        }
      }, SHORT_PAUSE_MS); // Additional 5 seconds after comma
      
    }, SHORT_PAUSE_MS);
  }, [addPunctuation, updateDisplay]);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return;
    }

    setIsListening(true);
    isListeningRef.current = true; // Track in ref for closures

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.maxAlternatives = 1;

    let lastProcessedLength = 0;

    recognitionRef.current.onstart = () => {
      console.log('Speech recognition started');
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

      // Update last speech time and clear pause timeouts when actively speaking
      lastSpeechTimeRef.current = Date.now();
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

      setTranscript(currentTranscript);

      // Process new characters one by one for real-time typing effect
      if (currentTranscript.length > lastProcessedLength) {
        const newText = currentTranscript.slice(lastProcessedLength);
        
        // Add characters immediately for real-time typing
        for (let i = 0; i < newText.length; i++) {
          processCharacter(newText[i]);
        }
        
        // Add to enhanced speech buffer for processing
        enhancedSpeech.addToBuffer(newText);
        
        lastProcessedLength = currentTranscript.length;
      }

      // Handle final results
      if (event.results[event.results.length - 1].isFinal) {
        // Update last speech time for pause detection
        lastSpeechTimeRef.current = Date.now();
        
        // Add space after final result
        setTimeout(() => {
          processCharacter(' ');
          setTranscript('');
          // Start pause detection after final result
          handlePauseDetection();
          lastProcessedLength = 0;
        }, 100);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      // Don't stop listening for network or aborted errors - restart instead
      if (event.error === 'network' || event.error === 'aborted') {
        console.log('Restarting speech recognition after error:', event.error);
        setTimeout(() => {
          if (recognitionRef.current && isListeningRef.current) {
            recognitionRef.current.start();
          }
        }, 1000);
      } else {
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognitionRef.current.onend = () => {
      console.log('Speech recognition ended, isListening:', isListeningRef.current);
      // Automatically restart if we're still supposed to be listening
      if (isListeningRef.current) {
        console.log('Restarting speech recognition to maintain continuous listening');
        setTimeout(() => {
          if (recognitionRef.current && isListeningRef.current) {
            try {
              recognitionRef.current.start();
            } catch (error) {
              console.error('Failed to restart speech recognition:', error);
              setIsListening(false);
              isListeningRef.current = false;
            }
          }
        }, 100);
      } else {
        setTranscript('');
      }
    };

    recognitionRef.current.start();
  }, [processCharacter, handlePauseDetection]);

  const stopListening = useCallback(() => {
    console.log('Manually stopping speech recognition');
    setIsListening(false);
    isListeningRef.current = false; // Set this first to prevent auto-restart
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    // Clear timeouts when stopping
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    
    setTranscript('');
  }, []);

  const clearSpeech = useCallback(() => {
    displayTextRef.current = '';
    setSpeechLines(['', '', '', '']);
    setTranscript('');
    // Clear timeouts when clearing speech
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
  }, []);

  return {
    isListening,
    speechLines,
    transcript,
    startListening,
    stopListening,
    clearSpeech,
    
    // Enhanced speech data
    accuracyScore: enhancedSpeech.accuracyScore,
    corrections: enhancedSpeech.corrections,
    isProcessingAccuracy: enhancedSpeech.isProcessing,
    correctText: enhancedSpeech.correctText,
    detectKeywords: enhancedSpeech.detectKeywords
  };
};