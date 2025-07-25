import { useEffect, useState } from 'react';
import { useKeywords } from './use-keywords';
import { useQuery } from '@tanstack/react-query';

interface DetectedKeyword {
  keyword: string;
  timestamp: number;
}

export function useKeywordDetection(transcript: string, mode: 'keyflow' | 'imgkey') {
  const { keywords } = useKeywords();
  const [detectedKeywords, setDetectedKeywords] = useState<DetectedKeyword[]>([]);
  const [triggeredImages, setTriggeredImages] = useState<Set<string>>(new Set());

  // Get image mappings for Img Key mode
  const { data: imgKeyMappings = [] } = useQuery({
    queryKey: ['/api/img-key-mappings'],
    enabled: mode === 'imgkey'
  });

  useEffect(() => {
    if (!transcript) return;

    const currentTime = Date.now();
    const searchText = transcript.toLowerCase();
    
    if (mode === 'keyflow') {
      // Check for keywords in Keyflow mode
      keywords.forEach(keywordObj => {
        const keyword = keywordObj.keyword.toLowerCase();
        
        // Check if keyword exists in the transcript and hasn't been triggered yet
        if (searchText.includes(keyword) && !triggeredImages.has(keyword)) {
          setDetectedKeywords(prev => [...prev, { 
            keyword: keywordObj.keyword, 
            timestamp: currentTime 
          }]);
          setTriggeredImages(prev => new Set([...prev, keyword]));
        }
      });
    } else if (mode === 'imgkey') {
      // Check for mapped keywords in Img Key mode
      imgKeyMappings.forEach((mapping: any) => {
        const keyword = mapping.keyword.toLowerCase();
        
        // Check if keyword exists in the transcript and hasn't been triggered yet
        if (searchText.includes(keyword) && !triggeredImages.has(keyword)) {
          setDetectedKeywords(prev => [...prev, { 
            keyword: mapping.keyword, 
            timestamp: currentTime 
          }]);
          setTriggeredImages(prev => new Set([...prev, keyword]));
        }
      });
    }
  }, [transcript, keywords, imgKeyMappings, mode, triggeredImages]);

  // Clear triggered images when transcript is cleared or mode changes
  useEffect(() => {
    if (!transcript) {
      setTriggeredImages(new Set());
      setDetectedKeywords([]);
    }
  }, [transcript]);

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