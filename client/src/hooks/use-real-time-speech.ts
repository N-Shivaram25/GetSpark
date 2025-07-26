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
  const lastSpeechTimeRef = useRef<number>(Date.now());
  const pauseTimeoutRef = useRef<NodeJS.Timeout>();
  const silenceTimeoutRef = useRef<NodeJS.Timeout>();
  const isListeningRef = useRef(false);
  
  const CHARS_PER_LINE = 100; // Increased to fill more space
  const MAX_LINES = 4;
  const MAX_TOTAL_CHARS = CHARS_PER_LINE * MAX_LINES; // 400 total chars
  const SHORT_PAUSE_MS = 5000; // 5 seconds for comma
  const LONG_PAUSE_MS = 10000; // 10 seconds for period
  const TYPING_DELAY_BASE = 30; // Base typing delay in ms
  const TYPING_DELAY_VARIANCE = 20; // Random variance in typing speed

  // Enhanced transcript accuracy improvement function
  const enhanceTranscriptAccuracy = useCallback((transcript: string): string => {
    if (!transcript) return transcript;
    
    // Common speech recognition corrections
    let enhanced = transcript
      // Fix common homophone errors
      .replace(/\bthere\b/gi, (match, offset, string) => {
        // Context-aware replacement
        const beforeWord = string.substring(Math.max(0, offset - 10), offset).toLowerCase();
        const afterWord = string.substring(offset + match.length, offset + match.length + 10).toLowerCase();
        
        if (beforeWord.includes('over') || afterWord.includes('is') || afterWord.includes('are')) {
          return 'there';
        }
        return match;
      })
      // Fix capitalization after periods
      .replace(/\.\s*([a-z])/g, (match, letter) => `. ${letter.toUpperCase()}`)
      // Fix common contractions
      .replace(/\bcant\b/gi, "can't")
      .replace(/\bdont\b/gi, "don't")
      .replace(/\bwont\b/gi, "won't")
      .replace(/\bitsnt\b/gi, "isn't")
      .replace(/\bwhats\b/gi, "what's")
      // Fix common word recognition errors and homophones
      .replace(/\brecognised\b/gi, "recognized")
      .replace(/\bcolour\b/gi, "color")
      .replace(/\bto\b(?=\s+\w+ing\b)/gi, "too") // "to walking" -> "too walking"
      .replace(/\byour\b(?=\s+(welcome|right|correct))/gi, "you're")
      .replace(/\bits\b(?=\s+(been|going|time))/gi, "it's")
      .replace(/\bwere\b(?=\s+(going|coming))/gi, "we're")
      .replace(/\btheir\b(?=\s+(is|are|was))/gi, "there")
      // Fix numbers and common tech terms
      .replace(/\bone\b/gi, (match, offset, string) => {
        const afterWord = string.substring(offset + match.length, offset + match.length + 10).toLowerCase();
        if (afterWord.includes('more') || afterWord.includes('time')) return 'one';
        return match;
      })
      // Clean up multiple spaces and normalize punctuation
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.!?;:])/g, '$1') // Remove spaces before punctuation
      .replace(/([,.!?;:])\s*([a-z])/g, (match, punct, letter) => `${punct} ${letter.toUpperCase()}`)
      .trim();
      
    return enhanced;
  }, []);

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

  // Realistic typing animation function
  const simulateTypingAnimation = useCallback((text: string, startDelay: number = 0) => {
    let charIndex = 0;
    
    const typeNextChar = () => {
      if (charIndex < text.length) {
        processCharacter(text[charIndex]);
        charIndex++;
        
        // Calculate realistic typing delay
        const baseDelay = TYPING_DELAY_BASE;
        const variance = Math.random() * TYPING_DELAY_VARIANCE;
        const isSpace = text[charIndex - 1] === ' ';
        const isPunctuation = /[,.!?;:]/.test(text[charIndex - 1]);
        
        // Longer delays after punctuation and spaces for realism
        let delay = baseDelay + variance;
        if (isPunctuation) delay += 50;
        if (isSpace) delay += 20;
        
        setTimeout(typeNextChar, delay);
      }
    };
    
    if (startDelay > 0) {
      setTimeout(typeNextChar, startDelay);
    } else {
      typeNextChar();
    }
  }, [processCharacter]);

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
    
    // Enhanced speech recognition settings for better accuracy
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.maxAlternatives = 3; // Consider multiple alternatives
    recognitionRef.current.serviceURI = 'wss://api.speechmatics.com/v2'; // Fallback service
    
    // Enhanced grammar and language model
    if (recognitionRef.current.grammars) {
      recognitionRef.current.grammars.addFromString('#JSGF V1.0; grammar speech; public <speech> = * ;', 1);
    }

    let lastProcessedLength = 0;

    recognitionRef.current.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event: any) => {
      let bestTranscript = '';
      let confidence = 0;
      
      // Enhanced transcript processing with confidence scoring
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        
        // Get the best alternative with highest confidence
        let bestAlternative = result[0];
        let bestConfidence = result[0].confidence || 0.8;
        
        // Check all alternatives for better accuracy
        for (let j = 0; j < Math.min(result.length, 3); j++) {
          const alternative = result[j];
          const altConfidence = alternative.confidence || 0.5;
          if (altConfidence > bestConfidence) {
            bestAlternative = alternative;
            bestConfidence = altConfidence;
          }
        }
        
        bestTranscript += bestAlternative.transcript;
        confidence = Math.max(confidence, bestConfidence);
      }

      // Apply post-processing for common speech recognition errors
      bestTranscript = enhanceTranscriptAccuracy(bestTranscript);

      // Update last speech time and clear pause timeouts when actively speaking
      lastSpeechTimeRef.current = Date.now();
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

      setTranscript(bestTranscript);

      // Enhanced typing animation with realistic delays
      if (bestTranscript.length > lastProcessedLength) {
        const newText = bestTranscript.slice(lastProcessedLength);
        
        // Use immediate character processing for real-time effect instead of animation
        // simulateTypingAnimation provides too much delay - use direct processing
        for (let i = 0; i < newText.length; i++) {
          processCharacter(newText[i]);
        }
        
        lastProcessedLength = bestTranscript.length;
      }

      // Handle final results with better processing
      if (event.results[event.results.length - 1].isFinal) {
        console.log(`Final result with confidence: ${confidence}`);
        lastSpeechTimeRef.current = Date.now();
        
        // Add space after final result immediately
        setTimeout(() => {
          processCharacter(' ');
          setTranscript('');
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
    clearSpeech
  };
};