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

  // Initialize Web Speech API as fallback
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsProcessing(false);
      };
      
      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            currentTranscript += result[0].transcript + ' ';
          } else {
            currentTranscript += result[0].transcript;
          }
        }
        
        setTranscript(currentTranscript.trim());
        updateSpeechLines(currentTranscript.trim());
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsProcessing(false);
      };
      
      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        setIsProcessing(false);
      };
      
      recognitionRef.current = recognition;
    }
  }, []);

  const updateSpeechLines = useCallback((text: string) => {
    if (!text.trim()) return;
    
    const words = text.split(' ');
    const lines = ['', '', '', ''];
    const wordsPerLine = 20; // Approximate words per line
    
    let lineIndex = 0;
    let currentLineWords = 0;
    
    words.forEach((word) => {
      if (lineIndex < 4) {
        if (currentLineWords < wordsPerLine) {
          lines[lineIndex] += (lines[lineIndex] ? ' ' : '') + word;
          currentLineWords++;
        } else {
          lineIndex++;
          if (lineIndex < 4) {
            lines[lineIndex] = word;
            currentLineWords = 1;
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
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

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