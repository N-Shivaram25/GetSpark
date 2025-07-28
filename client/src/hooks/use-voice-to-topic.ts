import { useState, useEffect, useCallback } from "react";

export function useVoiceToTopic(transcript: string) {
  const [currentTopic, setCurrentTopic] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplexMode, setIsComplexMode] = useState(false);

  // Extract topic from speech transcript
  const extractTopic = useCallback((text: string): string => {
    if (!text.trim()) return "";

    // Clean the text
    const cleanText = text.toLowerCase().trim();
    
    // Look for topic indicators
    const topicPatterns = [
      /(?:tell me about|what is|explain|define|describe)\s+(.+?)(?:\.|$)/i,
      /(?:how does|how do|what are)\s+(.+?)(?:\s+work|\s+function|\.|\?|$)/i,
      /(?:let's talk about|discuss|learn about)\s+(.+?)(?:\.|$)/i,
      /(.+?)(?:\s+in programming|\s+programming|\s+language|\s+algorithm|\s+data structure)/i,
    ];

    for (const pattern of topicPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/[^\w\s]/g, '').substring(0, 50);
      }
    }

    // Fallback: extract programming-related keywords
    const programmingKeywords = [
      'javascript', 'python', 'react', 'node', 'api', 'database', 'array', 'object',
      'function', 'class', 'variable', 'loop', 'condition', 'algorithm', 'data structure',
      'recursion', 'sorting', 'searching', 'html', 'css', 'typescript', 'framework',
      'library', 'component', 'state', 'props', 'async', 'await', 'promise', 'callback'
    ];

    const words = cleanText.split(/\s+/);
    const foundKeywords = words.filter(word => 
      programmingKeywords.some(keyword => 
        word.includes(keyword) || keyword.includes(word)
      )
    );

    if (foundKeywords.length > 0) {
      return foundKeywords.slice(0, 3).join(' ');
    }

    // Last resort: take first few meaningful words
    const meaningfulWords = words.filter(word => 
      word.length > 3 && 
      !['what', 'how', 'tell', 'explain', 'about', 'this', 'that', 'with', 'from'].includes(word)
    );

    return meaningfulWords.slice(0, 2).join(' ').substring(0, 30);
  }, []);

  // Check for complexity triggers
  const checkComplexityTrigger = useCallback((text: string): boolean => {
    const complexTriggers = [
      'complex example',
      'advanced example', 
      'complex implementation',
      'advanced implementation',
      'real world example',
      'production example',
      'enterprise example',
      'detailed example',
      'comprehensive example'
    ];

    return complexTriggers.some(trigger => 
      text.toLowerCase().includes(trigger)
    );
  }, []);

  // Process transcript changes
  useEffect(() => {
    if (!transcript.trim()) return;

    setIsProcessing(true);
    
    // Extract topic
    const newTopic = extractTopic(transcript);
    
    // Check for complexity triggers
    const shouldBeComplex = checkComplexityTrigger(transcript);
    
    if (newTopic && newTopic !== currentTopic) {
      setCurrentTopic(newTopic);
    }
    
    if (shouldBeComplex !== isComplexMode) {
      setIsComplexMode(shouldBeComplex);
    }

    // Reset processing state after a short delay
    const timer = setTimeout(() => {
      setIsProcessing(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [transcript, currentTopic, isComplexMode, extractTopic, checkComplexityTrigger]);

  const toggleComplexMode = useCallback(() => {
    setIsComplexMode(prev => !prev);
  }, []);

  const clearTopic = useCallback(() => {
    setCurrentTopic("");
    setIsComplexMode(false);
    setIsProcessing(false);
  }, []);

  return {
    currentTopic,
    isProcessing,
    isComplexMode,
    toggleComplexMode,
    clearTopic,
  };
}