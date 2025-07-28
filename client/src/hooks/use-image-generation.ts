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
    mutationFn: async ({ keyword, duration }: { keyword: string; duration: number }) => {
      const response = await apiRequest("POST", "/api/generate-image", { keyword, duration });
      return response.json();
    },
    onSuccess: (data, { keyword, duration }) => {
      const newImage: DisplayedImage = {
        id: Date.now().toString(),
        url: data.imageUrl,
        keyword,
        timeLeft: duration || data.duration || 6,
        source: data.source || 'clipdrop'
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

  const generateImage = (keyword: string, duration: number = 6, customImageUrl?: string) => {
    if (customImageUrl) {
      // Display custom uploaded image directly
      const newImage: DisplayedImage = {
        id: Date.now().toString(),
        url: customImageUrl,
        keyword,
        timeLeft: duration,
        source: 'custom'
      };
      setDisplayedImages(prev => [...prev, newImage]);
    } else {
      // Generate AI image
      generateImageMutation.mutate({ keyword, duration });
    }
  };

  return {
    displayedImages,
    generateImage,
    isGenerating: generateImageMutation.isPending
  };
}