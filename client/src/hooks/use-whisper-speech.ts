import { useState, useEffect, useRef, useCallback } from 'react';

interface WhisperSpeechHook {
  isListening: boolean;
  transcript: string;
  speechLines: string[];
  startListening: () => void;
  stopListening: () => void;
  clearSpeech: () => void;
  isProcessing: boolean;
}

export function useWhisperSpeech(): WhisperSpeechHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechLines, setSpeechLines] = useState<string[]>(['', '', '', '']);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const finalTranscriptRef = useRef('');
  const restartTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize Web Speech API with continuous recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      

      
      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsProcessing(false);
      };
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscriptRef.current += result[0].transcript + ' ';
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        
        const currentTranscript = finalTranscriptRef.current + interimTranscript;
        setTranscript(currentTranscript.trim());
        updateSpeechLines(currentTranscript.trim());
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        // Don't restart on certain errors
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setIsListening(false);
          setIsProcessing(false);
          return;
        }
        
        // Auto-restart for other errors if still listening
        if (isListening) {
          restartTimeoutRef.current = setTimeout(() => {
            if (recognitionRef.current && isListening) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.error('Failed to restart recognition:', e);
              }
            }
          }, 100);
        }
      };
      
      recognition.onend = () => {
        console.log('Speech recognition ended');
        
        // Auto-restart if we're still supposed to be listening
        if (isListening) {
          restartTimeoutRef.current = setTimeout(() => {
            if (recognitionRef.current && isListening) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.error('Failed to restart recognition:', e);
                setIsListening(false);
                setIsProcessing(false);
              }
            }
          }, 100);
        } else {
          setIsProcessing(false);
        }
      };
      
      recognitionRef.current = recognition;
    }
  }, []);

  const updateSpeechLines = useCallback((text: string) => {
    if (!text.trim()) {
      setSpeechLines(['', '', '', '']);
      return;
    }
    
    // Sequential line filling: fill lines 1-4, then restart from line 1
    const maxCharsPerLine = 80;
    const words = text.split(' ');
    const lines = ['', '', '', ''];
    let currentLine = 0;
    let currentLineLength = 0;
    let totalWords = 0;
    
    // Calculate how many complete cycles we need to skip
    const wordsPerCycle = words.length;
    const linesPerCycle = 4;
    const wordsProcessed = Math.floor(totalWords / (maxCharsPerLine * linesPerCycle)) * (maxCharsPerLine * linesPerCycle);
    
    words.forEach((word, index) => {
      const wordWithSpace = (lines[currentLine] ? ' ' : '') + word;
      
      if (currentLineLength + wordWithSpace.length <= maxCharsPerLine) {
        lines[currentLine] += wordWithSpace;
        currentLineLength += wordWithSpace.length;
      } else {
        // Move to next line, cycle back to line 0 after line 3
        currentLine = (currentLine + 1) % 4;
        
        // If we're back to line 0, clear all lines to start fresh
        if (currentLine === 0) {
          lines[0] = word;
          lines[1] = '';
          lines[2] = '';
          lines[3] = '';
          currentLineLength = word.length;
        } else {
          lines[currentLine] = word;
          currentLineLength = word.length;
        }
      }
    });
    
    setSpeechLines(lines);
  }, []);

  const startListening = useCallback(async () => {
    try {
      setIsProcessing(true);
      
      // Try to get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Start Web Speech API
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      }
      
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsProcessing(false);
      alert('Microphone access denied or not available');
    }
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
    setIsProcessing(false);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const clearSpeech = useCallback(() => {
    setTranscript('');
    setSpeechLines(['', '', '', '']);
    finalTranscriptRef.current = '';
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    speechLines,
    startListening,
    stopListening,
    clearSpeech,
    isProcessing,
  };
}