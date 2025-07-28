import { useState, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface WhisperSpeechResult {
  text: string;
  correctedText: string;
  confidence: number;
}

export function useWhisperSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [speechLines, setSpeechLines] = useState<string[]>(["", "", "", ""]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const addToSpeechLines = useCallback((text: string) => {
    if (!text.trim()) return;

    setSpeechLines(prev => {
      const words = text.trim().split(' ');
      let currentLines = [...prev];
      let wordIndex = 0;

      // Process words to fill lines properly
      while (wordIndex < words.length) {
        // Find the first line that can accommodate more words
        let targetLineIndex = 0;
        for (let i = 0; i < currentLines.length; i++) {
          if (currentLines[i].split(' ').length < 12) { // Max 12 words per line
            targetLineIndex = i;
            break;
          }
        }

        // If all lines are full, shift everything up
        if (currentLines[targetLineIndex].split(' ').length >= 12) {
          currentLines = ["", ...currentLines.slice(0, 3)];
          targetLineIndex = 0;
        }

        // Add words to the target line
        const currentWords = currentLines[targetLineIndex].split(' ').filter(w => w);
        while (wordIndex < words.length && currentWords.length < 12) {
          currentWords.push(words[wordIndex]);
          wordIndex++;
        }
        
        currentLines[targetLineIndex] = currentWords.join(' ');
      }

      return currentLines;
    });
  }, []);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        setIsProcessing(true);
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await processAudioBlob(audioBlob);
        } catch (error) {
          console.error('Error processing audio:', error);
          toast({
            title: "Speech processing failed",
            description: "Could not process your speech. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
      
      // Auto-stop recording after 10 seconds to process chunks
      setTimeout(() => {
        if (mediaRecorderRef.current && isListening) {
          mediaRecorderRef.current.stop();
          // Restart immediately for continuous listening
          setTimeout(() => startListening(), 100);
        }
      }, 10000);
      
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      toast({
        title: "Microphone access failed",
        description: "Please allow microphone access to use voice recognition.",
        variant: "destructive",
      });
    }
  }, [isListening, toast]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const processAudioBlob = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');

      const response = await fetch('/api/speech/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const result: WhisperSpeechResult = await response.json();
      
      if (result.correctedText.trim()) {
        addToSpeechLines(result.correctedText);
        setTranscript(result.correctedText);
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      // Fallback to Web Speech API if Whisper fails
      fallbackToWebSpeech();
    }
  };

  const fallbackToWebSpeech = () => {
    // Implement Web Speech API fallback here if needed
    console.log('Falling back to Web Speech API');
  };

  const clearSpeech = useCallback(() => {
    setSpeechLines(["", "", "", ""]);
    setTranscript("");
  }, []);

  return {
    isListening,
    transcript,
    speechLines,
    isProcessing,
    startListening,
    stopListening,
    clearSpeech,
  };
}