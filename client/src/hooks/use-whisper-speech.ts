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
    
    // Character-based approach for better text flow
    const maxCharsPerLine = 80;
    const maxTotalChars = 320; // 4 lines * 80 chars
    
    let processedText = text;
    
    // If text exceeds capacity, use LIFO (remove from beginning)
    if (processedText.length > maxTotalChars) {
      processedText = processedText.slice(processedText.length - maxTotalChars);
      // Try to start from a word boundary
      const firstSpaceIndex = processedText.indexOf(' ');
      if (firstSpaceIndex > 0 && firstSpaceIndex < 10) {
        processedText = processedText.slice(firstSpaceIndex + 1);
      }
    }
    
    const lines = ['', '', '', ''];
    const words = processedText.split(' ');
    let currentLine = 0;
    let currentLineLength = 0;
    
    words.forEach((word) => {
      const wordWithSpace = (lines[currentLine] ? ' ' : '') + word;
      
      if (currentLine < 4) {
        if (currentLineLength + wordWithSpace.length <= maxCharsPerLine) {
          lines[currentLine] += wordWithSpace;
          currentLineLength += wordWithSpace.length;
        } else {
          // Move to next line
          currentLine++;
          if (currentLine < 4) {
            lines[currentLine] = word;
            currentLineLength = word.length;
          }
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