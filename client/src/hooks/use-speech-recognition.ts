import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Keyword, ImgKeyMapping } from "@shared/schema";

interface DisplayedImage {
  id: string;
  url: string;
  keyword: string;
  timeLeft: number;
  source: 'clipdrop' | 'custom';
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [speechLines, setSpeechLines] = useState<string[]>([]);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const markKeywordUsedMutation = useMutation({
    mutationFn: async (keywordId: string) => {
      const response = await apiRequest("PUT", `/api/keywords/${keywordId}/used`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/keywords'] });
    },
  });

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
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

        setTranscript(interimTranscript);

        if (finalTranscript) {
          addToSpeechLines(finalTranscript);
          checkForKeywords(finalTranscript);
          setTranscript('');
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast({
            title: "Microphone access denied",
            description: "Please allow microphone access to use voice recognition.",
            variant: "destructive",
          });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } else {
      toast({
        title: "Speech recognition not supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      });
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  // Timer for displayed images
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayedImages(prev => 
        prev.map(img => ({ ...img, timeLeft: img.timeLeft - 1 }))
         .filter(img => img.timeLeft > 0)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const addToSpeechLines = useCallback((text: string) => {
    setSpeechLines(prev => {
      const newLines = [...prev];
      
      // If we have 6 lines, remove the first one
      if (newLines.length >= 6) {
        newLines.shift();
      }
      
      newLines.push(text);
      return newLines;
    });
  }, []);

  const checkForKeywords = useCallback((text: string) => {
    const lowerText = text.toLowerCase();
    
    if (mode === 'keyflow') {
      // Check for keywords that haven't been used yet
      keywords.forEach(keyword => {
        if (!keyword.used && 
            !detectedKeywords.has(keyword.id) && 
            lowerText.includes(keyword.keyword.toLowerCase())) {
          
          setDetectedKeywords(prev => new Set([...prev, keyword.id]));
          generateImageMutation.mutate(keyword.keyword);
          markKeywordUsedMutation.mutate(keyword.id);
        }
      });
    } else if (mode === 'imgkey') {
      // Check for img key mappings
      imgKeyMappings.forEach(mapping => {
        if (lowerText.includes(mapping.keyword.toLowerCase())) {
          if (mapping.bulletPoints) {
            setBulletPoints(prev => [...prev, text]);
          }
          
          // Display custom images
          mapping.imageUrls.forEach((url, index) => {
            const newImage: DisplayedImage = {
              id: `${mapping.id}-${index}-${Date.now()}`,
              url,
              keyword: mapping.keyword,
              timeLeft: mapping.duration || 6,
              source: 'custom'
            };
            setDisplayedImages(prev => [...prev, newImage]);
          });
        }
      });
    }
  }, [mode, keywords, imgKeyMappings, detectedKeywords, generateImageMutation, markKeywordUsedMutation]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    speechLines,
    detectedKeywords,
    bulletPoints,
    displayedImages,
    startListening,
    stopListening,
  };
}
