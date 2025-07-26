import { useState, useEffect, useRef, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface AdvancedSpeechRecognitionState {
  isListening: boolean;
  transcript: string;
  speechLines: string[];
  isEnhancing: boolean;
  startListening: () => void;
  stopListening: () => void;
  clearSpeech: () => void;
}

interface GrammarCorrectionRule {
  pattern: RegExp;
  replacement: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export function useAdvancedSpeechRecognition(): AdvancedSpeechRecognitionState {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechLines, setSpeechLines] = useState<string[]>([]);
  const [allWords, setAllWords] = useState<string[]>([]);
  const [isLifoMode, setIsLifoMode] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  const recognitionRef = useRef<any | null>(null);
  const interimTranscriptRef = useRef('');
  const finalTranscriptRef = useRef('');
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Grammar correction rules for better accuracy
  const grammarRules: GrammarCorrectionRule[] = [
    // Common punctuation patterns
    { pattern: /\bcomma\b/gi, replacement: ',' },
    { pattern: /\bperiod\b/gi, replacement: '.' },
    { pattern: /\bquestion mark\b/gi, replacement: '?' },
    { pattern: /\bexclamation mark\b/gi, replacement: '!' },
    { pattern: /\bcolon\b/gi, replacement: ':' },
    { pattern: /\bsemicolon\b/gi, replacement: ';' },
    
    // Fix common speech recognition errors
    { pattern: /\bi\b/g, replacement: 'I' },
    { pattern: /\bi'm\b/g, replacement: "I'm" },
    { pattern: /\bi'll\b/g, replacement: "I'll" },
    { pattern: /\bi've\b/g, replacement: "I've" },
    { pattern: /\bi'd\b/g, replacement: "I'd" },
    { pattern: /\bthere\s+are\b/gi, replacement: 'there are' },
    { pattern: /\bthere\s+is\b/gi, replacement: 'there is' },
  ];

  // Apply grammar correction and punctuation
  const applyGrammarCorrection = useCallback((text: string): string => {
    let correctedText = text;
    
    // Apply all grammar rules
    grammarRules.forEach(rule => {
      correctedText = correctedText.replace(rule.pattern, rule.replacement);
    });
    
    // Capitalize first letter
    if (correctedText) {
      correctedText = correctedText.charAt(0).toUpperCase() + correctedText.slice(1);
    }
    
    // Capitalize after punctuation
    correctedText = correctedText.replace(/([.!?])\s+([a-z])/g, (match, punct, letter) => {
      return punct + ' ' + letter.toUpperCase();
    });
    
    // Ensure proper sentence ending
    if (correctedText && !correctedText.match(/[.!?]$/)) {
      // Add period if the sentence seems complete (contains subject and verb indicators)
      if (correctedText.match(/\b(is|are|was|were|have|has|had|will|would|can|could|should|must)\b/i) ||
          correctedText.length > 20) {
        correctedText += '.';
      }
    }
    
    return correctedText.trim();
  }, [grammarRules]);

  // Enhanced text processing with OpenAI
  const enhanceTextWithOpenAI = useCallback(async (text: string): Promise<string> => {
    setIsEnhancing(true);
    try {
      const response = await fetch('/api/enhance-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.enhancedText) {
          return data.enhancedText;
        }
      }
      return text;
    } catch (error) {
      console.error('OpenAI enhancement failed, using local correction:', error);
      return applyGrammarCorrection(text);
    } finally {
      setIsEnhancing(false);
    }
  }, [applyGrammarCorrection]);

  // Handle strict 4-line management with LIFO word flow
  const manageLines = useCallback(async (text: string) => {
    const maxLines = 4;
    const maxWordsPerLine = 10; // Reduced to ensure space at end of line 4
    
    if (!text.trim()) {
      setSpeechLines([]);
      setIsLifoMode(false);
      return;
    }

    // Enhance text with OpenAI for better accuracy and formatting
    const enhancedText = await enhanceTextWithOpenAI(text);
    
    // Split into words and manage strict 4-line display
    const words = enhancedText.trim().split(/\s+/).filter(word => word.length > 0);
    const totalCapacity = maxLines * maxWordsPerLine; // 40 words total capacity
    
    if (words.length <= totalCapacity) {
      // Normal mode: distribute words across lines with vibrant space
      setIsLifoMode(false);
      const lines: string[] = [];
      
      for (let i = 0; i < maxLines; i++) {
        const startIdx = i * maxWordsPerLine;
        const endIdx = Math.min(startIdx + maxWordsPerLine, words.length);
        
        if (startIdx < words.length) {
          const lineWords = words.slice(startIdx, endIdx);
          let lineText = lineWords.join(' ');
          
          // Add vibrant space indicator at end of line 4 if it's not full
          if (i === maxLines - 1 && lineWords.length < maxWordsPerLine) {
            lineText += ' ■'; // Vibrant space indicator
          }
          
          lines.push(lineText);
        }
      }
      
      setSpeechLines(lines);
    } else {
      // LIFO mode: remove words from beginning, add to end
      setIsLifoMode(true);
      
      // Keep only the last 40 words (capacity for 4 lines)
      const displayWords = words.slice(-totalCapacity);
      
      const lines: string[] = [];
      for (let i = 0; i < maxLines; i++) {
        const startIdx = i * maxWordsPerLine;
        const endIdx = Math.min(startIdx + maxWordsPerLine, displayWords.length);
        
        if (startIdx < displayWords.length) {
          const lineWords = displayWords.slice(startIdx, endIdx);
          let lineText = lineWords.join(' ');
          
          // Add vibrant space indicator at end of line 4 if space available
          if (i === maxLines - 1 && lineWords.length < maxWordsPerLine) {
            lineText += ' ■'; // Vibrant space for new words
          }
          
          lines.push(lineText);
        }
      }
      
      setSpeechLines(lines);
    }
  }, [enhanceTextWithOpenAI]);

  // Initialize speech recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Enhanced configuration for accuracy
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3; // Get multiple alternatives for better accuracy

    recognition.onstart = () => {
      console.log('Advanced speech recognition started');
      setIsListening(true);
    };

    recognition.onend = () => {
      console.log('Advanced speech recognition ended');
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = finalTranscriptRef.current;

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        
        // Use the most confident result
        let bestTranscript = result[0].transcript;
        let bestConfidence = result[0].confidence;
        
        // Check alternatives for better confidence
        for (let j = 1; j < result.length; j++) {
          if (result[j].confidence > bestConfidence) {
            bestTranscript = result[j].transcript;
            bestConfidence = result[j].confidence;
          }
        }

        if (result.isFinal) {
          finalTranscript += bestTranscript;
        } else {
          interimTranscript += bestTranscript;
        }
      }

      // Update refs
      finalTranscriptRef.current = finalTranscript;
      interimTranscriptRef.current = interimTranscript;

      // Combine final and interim for display
      const fullText = finalTranscript + interimTranscript;
      const words = fullText.trim().split(/\s+/).filter(word => word.length > 0);
      
      // Update words and manage lines with enhanced text processing
      setAllWords(words);
      manageLines(fullText.trim());
      
      // Set current transcript (last few words for real-time display)
      const recentWords = words.slice(-8); // Show last 8 words as current
      setTranscript(recentWords.join(' '));

      // Clear pause timeout since we received new speech
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = null;
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [manageLines]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      // Clear previous transcripts
      finalTranscriptRef.current = '';
      interimTranscriptRef.current = '';
      
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
    setTranscript('');
    setSpeechLines([]);
    setAllWords([]);
    setIsLifoMode(false);
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
  }, []);

  return {
    isListening,
    transcript,
    speechLines,
    isEnhancing,
    startListening,
    stopListening,
    clearSpeech
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}