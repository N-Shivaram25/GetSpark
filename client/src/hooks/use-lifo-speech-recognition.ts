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
  const finalTranscriptRef = useRef('');
  const currentWordBuffer = useRef('');
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingText = useRef('');
  
  const WORDS_PER_LINE = 10;
  const TOTAL_LINES = 4;
  const TYPING_SPEED = 50; // milliseconds per character

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
        finalTranscriptRef.current += ' ' + newText;
        
        // Add to pending text for typing animation
        pendingText.current += ' ' + newText;
        
        // Start typing animation if not already running
        if (!typingIntervalRef.current) {
          startTypingAnimation();
        }
        
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
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  // Letter-by-letter typing animation with LIFO
  const startTypingAnimation = useCallback(() => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    typingIntervalRef.current = setInterval(() => {
      if (pendingText.current.length === 0) {
        clearInterval(typingIntervalRef.current!);
        typingIntervalRef.current = null;
        return;
      }

      // Get next character
      const nextChar = pendingText.current[0];
      pendingText.current = pendingText.current.slice(1);
      
      // Add character to current word buffer
      if (nextChar === ' ') {
        // Word complete, add to display
        if (currentWordBuffer.current.trim()) {
          addWordToDisplay(currentWordBuffer.current.trim());
          currentWordBuffer.current = '';
        }
      } else {
        currentWordBuffer.current += nextChar;
      }

      // If this is the last character and we have a remaining word
      if (pendingText.current.length === 0 && currentWordBuffer.current.trim()) {
        addWordToDisplay(currentWordBuffer.current.trim());
        currentWordBuffer.current = '';
      }
    }, TYPING_SPEED);
  }, []);

  // Add word to display with LIFO logic
  const addWordToDisplay = useCallback((word: string) => {
    setSpeechLines(prev => {
      const newLines = [...prev];
      
      // Find the last line with space
      let targetLineIndex = TOTAL_LINES - 1;
      let targetLine = newLines[targetLineIndex];
      
      // Check if current line has space (less than WORDS_PER_LINE words)
      const currentWords = targetLine.trim().split(/\s+/).filter(w => w.length > 0);
      
      if (currentWords.length < WORDS_PER_LINE) {
        // Add to current line
        newLines[targetLineIndex] = targetLine ? targetLine + ' ' + word : word;
      } else {
        // Need to flow backward - implement LIFO
        // Remove first word from line 1
        const line1Words = newLines[0].trim().split(/\s+/).filter(w => w.length > 0);
        if (line1Words.length > 0) {
          line1Words.shift(); // Remove first word
          newLines[0] = line1Words.join(' ');
        }
        
        // Shift all lines up
        for (let i = 0; i < TOTAL_LINES - 1; i++) {
          const currentLineWords = newLines[i].trim().split(/\s+/).filter(w => w.length > 0);
          const nextLineWords = newLines[i + 1].trim().split(/\s+/).filter(w => w.length > 0);
          
          if (currentLineWords.length < WORDS_PER_LINE && nextLineWords.length > 0) {
            // Move first word from next line to current line
            const wordToMove = nextLineWords.shift()!;
            currentLineWords.push(wordToMove);
            newLines[i] = currentLineWords.join(' ');
            newLines[i + 1] = nextLineWords.join(' ');
          }
        }
        
        // Add new word to last line
        const lastLineWords = newLines[TOTAL_LINES - 1].trim().split(/\s+/).filter(w => w.length > 0);
        lastLineWords.push(word);
        newLines[TOTAL_LINES - 1] = lastLineWords.join(' ');
        
        // If last line is still too full, remove from beginning of line 1
        if (lastLineWords.length > WORDS_PER_LINE) {
          const line1WordsUpdate = newLines[0].trim().split(/\s+/).filter(w => w.length > 0);
          if (line1WordsUpdate.length > 0) {
            line1WordsUpdate.shift();
            newLines[0] = line1WordsUpdate.join(' ');
          }
        }
      }
      
      return newLines;
    });
  }, []);

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
    finalTranscriptRef.current = '';
    currentWordBuffer.current = '';
    pendingText.current = '';
    
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
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