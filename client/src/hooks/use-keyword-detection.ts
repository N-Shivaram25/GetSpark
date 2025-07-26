import { useEffect, useState } from 'react';
import { useKeywords } from './use-keywords';
import { useQuery } from '@tanstack/react-query';

interface DetectedKeyword {
  keyword: string;
  timestamp: number;
}

interface KeywordDetectionProps {
  transcript: string;
  speechLines: string[];
  mode: 'keyflow' | 'imgkey';
  onKeywordDetected: (keyword: string, mode: 'keyflow' | 'imgkey', duration?: number) => void;
}

export function useKeywordDetection({ transcript, speechLines, mode, onKeywordDetected }: KeywordDetectionProps) {
  const { keywords } = useKeywords();
  const [detectedKeywords, setDetectedKeywords] = useState<DetectedKeyword[]>([]);
  const [triggeredImages, setTriggeredImages] = useState<Set<string>>(new Set());

  // Get image mappings for Img Key mode
  const { data: imgKeyMappings = [] } = useQuery({
    queryKey: ['/api/img-key-mappings'],
    enabled: mode === 'imgkey'
  });

  useEffect(() => {
    // Combine current transcript with all speech lines for full context
    const allText = [...speechLines, transcript].join(' ').toLowerCase();
    
    console.log('Checking text for keywords:', allText);
    console.log('Available keywords:', keywords);
    console.log('Mode:', mode);
    
    if (!allText.trim()) return;

    const currentTime = Date.now();
    
    if (mode === 'keyflow') {
      // Check for keywords in Keyflow mode
      keywords.forEach(keywordObj => {
        const keyword = keywordObj.keyword.toLowerCase();
        
        // More flexible keyword matching - check for word boundaries
        const keywordRegex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        const isKeywordFound = keywordRegex.test(allText) || allText.includes(keyword);
        
        // Check if keyword exists in the text and hasn't been triggered yet
        if (isKeywordFound && !triggeredImages.has(keyword)) {
          console.log(`Detected keyword in Keyflow mode: ${keyword}`);
          
          setDetectedKeywords(prev => [...prev, { 
            keyword: keywordObj.keyword, 
            timestamp: currentTime 
          }]);
          setTriggeredImages(prev => new Set(Array.from(prev).concat(keyword)));
          
          // Trigger image generation with keyword duration
          onKeywordDetected(keywordObj.keyword, 'keyflow', keywordObj.duration);
        }
      });
    } else if (mode === 'imgkey') {
      // Check for mapped keywords in Img Key mode
      (imgKeyMappings as any[]).forEach((mapping: any) => {
        const keyword = mapping.keyword.toLowerCase();
        
        // Check if keyword exists in the text and hasn't been triggered yet
        if (allText.includes(keyword) && !triggeredImages.has(keyword)) {
          console.log(`Detected keyword in Img Key mode: ${keyword}`);
          
          setDetectedKeywords(prev => [...prev, { 
            keyword: mapping.keyword, 
            timestamp: currentTime 
          }]);
          setTriggeredImages(prev => new Set(Array.from(prev).concat(keyword)));
          
          // Trigger custom image display
          onKeywordDetected(mapping.keyword, 'imgkey');
        }
      });
    }
  }, [transcript, speechLines, keywords, imgKeyMappings, mode, triggeredImages, onKeywordDetected]);

  // Clear triggered images when speech is cleared or mode changes
  useEffect(() => {
    if (speechLines.length === 0 && !transcript) {
      setTriggeredImages(new Set());
      setDetectedKeywords([]);
    }
  }, [speechLines, transcript]);

  useEffect(() => {
    setTriggeredImages(new Set());
    setDetectedKeywords([]);
  }, [mode]);

  return {
    detectedKeywords,
    clearDetectedKeywords: () => {
      setDetectedKeywords([]);
      setTriggeredImages(new Set());
    }
  };
}