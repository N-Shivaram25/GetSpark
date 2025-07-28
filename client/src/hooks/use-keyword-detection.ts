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
    const allText = [...speechLines, transcript].join(' ');
    const allTextLower = allText.toLowerCase();
    
    console.log('Checking text for keywords:', allText);
    console.log('Available keywords:', keywords);
    console.log('Mode:', mode);
    
    if (!allText.trim()) return;

    const currentTime = Date.now();
    
    if (mode === 'keyflow') {
      // Enhanced keyword detection for Keyflow mode
      keywords.forEach(keywordObj => {
        const keyword = keywordObj.keyword.toLowerCase();
        
        // Improved keyword matching with multiple strategies
        let isKeywordFound = false;
        
        // Strategy 1: Exact phrase matching with word boundaries for single words
        if (keyword.split(' ').length === 1) {
          const wordBoundaryRegex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          isKeywordFound = wordBoundaryRegex.test(allText);
        } else {
          // Strategy 2: Phrase matching for multi-word keywords
          const phraseRegex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
          isKeywordFound = phraseRegex.test(allText);
        }
        
        // Strategy 3: Fuzzy matching for partial word detection
        if (!isKeywordFound) {
          // Check for partial matches (at least 80% of characters match)
          const keywordChars = keyword.replace(/\s+/g, '').split('');
          const textWords = allTextLower.split(/\s+/);
          
          for (const word of textWords) {
            let matchCount = 0;
            const cleanWord = word.replace(/[^\w]/g, '');
            
            if (cleanWord.length >= keyword.length * 0.7) {
              for (const char of keywordChars) {
                if (cleanWord.includes(char)) matchCount++;
              }
              
              if (matchCount >= keywordChars.length * 0.8) {
                isKeywordFound = true;
                break;
              }
            }
          }
        }
        
        // Check if keyword exists in the text and hasn't been triggered yet
        if (isKeywordFound && !triggeredImages.has(keyword)) {
          console.log(`Detected keyword in Keyflow mode: ${keywordObj.keyword} (${keyword})`);
          
          setDetectedKeywords(prev => [...prev, { 
            keyword: keywordObj.keyword, 
            timestamp: currentTime 
          }]);
          setTriggeredImages(prev => new Set(Array.from(prev).concat(keyword)));
          
          // Trigger image generation with keyword duration
          onKeywordDetected(keywordObj.keyword, 'keyflow', keywordObj.duration || 6);
        }
      });
    } else if (mode === 'imgkey') {
      // Enhanced keyword detection for Img Key mode
      console.log('Img Key mappings:', imgKeyMappings);
      
      if (imgKeyMappings && Array.isArray(imgKeyMappings) && imgKeyMappings.length > 0) {
        imgKeyMappings.forEach((mapping: any) => {
          const keyword = mapping.keyword.toLowerCase();
          
          // Use same enhanced matching strategy
          let isKeywordFound = false;
          
          if (keyword.split(' ').length === 1) {
            const wordBoundaryRegex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            isKeywordFound = wordBoundaryRegex.test(allText);
          } else {
            const phraseRegex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            isKeywordFound = phraseRegex.test(allText);
          }
          
          // Check if keyword exists in the text and hasn't been triggered yet
          if (isKeywordFound && !triggeredImages.has(keyword)) {
            console.log(`Detected keyword in Img Key mode: ${mapping.keyword} (${keyword})`);
            
            setDetectedKeywords(prev => [...prev, { 
              keyword: mapping.keyword, 
              timestamp: currentTime 
            }]);
            setTriggeredImages(prev => new Set(Array.from(prev).concat(keyword)));
            
            // Trigger custom image display with mapping duration
            onKeywordDetected(mapping.keyword, 'imgkey', mapping.duration || 6);
          }
        });
      } else {
        console.log('No Img Key mappings found - user needs to upload images and keywords');
      }
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