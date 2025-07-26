import { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface SpeechCorrectionResult {
  correctedText: string;
  confidenceScore: number;
  corrections: Array<{
    original: string;
    corrected: string;
    reason: string;
  }>;
}

interface EnhancedKeywordDetection {
  detectedKeywords: Array<{
    keyword: string;
    confidence: number;
    position: number;
    matchType: 'exact' | 'semantic' | 'fuzzy';
  }>;
  semanticMatches: Array<{
    keyword: string;
    matchedPhrase: string;
    confidence: number;
  }>;
}

export function useEnhancedSpeech() {
  const [accuracyScore, setAccuracyScore] = useState(0);
  const [corrections, setCorrections] = useState<SpeechCorrectionResult['corrections']>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Buffer for collecting speech before processing
  const speechBufferRef = useRef<Array<{
    text: string;
    timestamp: number;
    processed: boolean;
  }>>([]);
  
  const bufferTimeoutRef = useRef<NodeJS.Timeout>();

  // Mutation for speech correction
  const correctSpeechMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch('/api/correct-speech', {
        method: 'POST',
        body: JSON.stringify({ text }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to correct speech text');
      }
      
      return await response.json() as SpeechCorrectionResult;
    }
  });

  // Mutation for enhanced keyword detection
  const detectKeywordsMutation = useMutation({
    mutationFn: async ({ text, keywords }: { text: string; keywords: string[] }) => {
      const response = await fetch('/api/detect-keywords', {
        method: 'POST',
        body: JSON.stringify({ text, keywords }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to detect keywords');
      }
      
      return await response.json() as EnhancedKeywordDetection;
    }
  });

  // Add speech text to buffer for processing
  const addToBuffer = useCallback((text: string) => {
    speechBufferRef.current.push({
      text,
      timestamp: Date.now(),
      processed: false
    });

    // Keep buffer size manageable
    if (speechBufferRef.current.length > 20) {
      speechBufferRef.current.shift();
    }

    // Clear existing timeout and set new one
    if (bufferTimeoutRef.current) {
      clearTimeout(bufferTimeoutRef.current);
    }

    // Process buffer after 3 seconds of no new text
    bufferTimeoutRef.current = setTimeout(() => {
      processBuffer();
    }, 3000);
  }, []);

  // Process buffered speech text
  const processBuffer = useCallback(async () => {
    const unprocessedText = speechBufferRef.current
      .filter(item => !item.processed && item.text.trim())
      .map(item => {
        item.processed = true;
        return item.text;
      })
      .join(' ')
      .trim();

    if (!unprocessedText) return null;

    setIsProcessing(true);
    
    try {
      const result = await correctSpeechMutation.mutateAsync(unprocessedText);
      setAccuracyScore(result.confidenceScore);
      setCorrections(result.corrections);
      setIsProcessing(false);
      
      return result.correctedText;
    } catch (error) {
      console.error('Failed to process speech buffer:', error);
      setIsProcessing(false);
      return unprocessedText;
    }
  }, [correctSpeechMutation]);

  // Enhanced keyword detection function
  const detectKeywords = useCallback(async (text: string, keywords: string[]) => {
    if (!keywords.length || !text.trim()) {
      return { detectedKeywords: [], semanticMatches: [] };
    }

    try {
      const result = await detectKeywordsMutation.mutateAsync({ text, keywords });
      return result;
    } catch (error) {
      console.error('Enhanced keyword detection failed:', error);
      return { detectedKeywords: [], semanticMatches: [] };
    }
  }, [detectKeywordsMutation]);

  // Manual correction function for immediate processing
  const correctText = useCallback(async (text: string) => {
    if (!text.trim()) return text;

    try {
      const result = await correctSpeechMutation.mutateAsync(text);
      setAccuracyScore(result.confidenceScore);
      setCorrections(result.corrections);
      return result.correctedText;
    } catch (error) {
      console.error('Text correction failed:', error);
      return text;
    }
  }, [correctSpeechMutation]);

  // Get recent buffer text for context
  const getRecentContext = useCallback((seconds: number = 30) => {
    const cutoff = Date.now() - (seconds * 1000);
    return speechBufferRef.current
      .filter(item => item.timestamp > cutoff)
      .map(item => item.text)
      .join(' ')
      .trim();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Functions
    addToBuffer,
    processBuffer,
    detectKeywords,
    correctText,
    getRecentContext,
    
    // State
    accuracyScore,
    corrections,
    isProcessing,
    
    // Mutation states
    isCorrectingText: correctSpeechMutation.isPending,
    isDetectingKeywords: detectKeywordsMutation.isPending,
    
    // Error states
    correctionError: correctSpeechMutation.error,
    detectionError: detectKeywordsMutation.error
  };
}