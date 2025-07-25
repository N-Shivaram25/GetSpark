import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface DisplayedImage {
  id: string;
  url: string;
  keyword: string;
  timeLeft: number;
  source: 'clipdrop' | 'custom';
}

export function useImageGeneration() {
  const [displayedImages, setDisplayedImages] = useState<DisplayedImage[]>([]);

  const generateImageMutation = useMutation({
    mutationFn: async (keyword: string) => {
      const response = await apiRequest("POST", "/api/generate-image", { keyword });
      return response.json();
    },
    onSuccess: (data, keyword) => {
      const newImage: DisplayedImage = {
        id: Date.now().toString(),
        url: data.imageUrl,
        keyword,
        timeLeft: 6,
        source: 'clipdrop'
      };
      setDisplayedImages(prev => [...prev, newImage]);
    },
    onError: (error) => {
      console.error('Failed to generate image:', error);
    },
  });

  // Countdown timer for images
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayedImages(prev => prev.map(image => ({
        ...image,
        timeLeft: Math.max(0, image.timeLeft - 1)
      })).filter(image => image.timeLeft > 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const generateImage = (keyword: string) => {
    generateImageMutation.mutate(keyword);
  };

  return {
    displayedImages,
    generateImage,
    isGenerating: generateImageMutation.isPending
  };
}