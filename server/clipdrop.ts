// Enhanced prompt creation for better image accuracy
function createEnhancedPrompt(keyword: string): string {
  const cleanKeyword = keyword.trim().toLowerCase();
  
  // Define category-specific enhancements
  const categoryEnhancements: Record<string, string> = {
    // Nature
    'sunset': 'beautiful golden sunset over horizon, warm colors, dramatic sky, professional photography',
    'ocean': 'crystal clear ocean waves, blue water, peaceful seascape, high quality',
    'mountain': 'majestic mountain peak, snow-capped, dramatic landscape, beautiful vista',
    'forest': 'lush green forest, tall trees, natural lighting, serene woodland',
    'beach': 'pristine sandy beach, blue water, tropical paradise, clear sky',
    
    // Animals
    'cat': 'cute domestic cat, furry, adorable pet, high detail',
    'dog': 'friendly dog, beautiful pet, detailed fur, happy expression',
    'bird': 'colorful bird, beautiful feathers, nature photography',
    'butterfly': 'colorful butterfly, delicate wings, flower garden',
    
    // Objects
    'car': 'modern car, sleek design, automotive photography, detailed',
    'house': 'beautiful house, architectural design, well-lit, detailed',
    'flower': 'beautiful blooming flower, colorful petals, garden photography',
    
    // Abstract concepts
    'love': 'heart symbol, warm colors, romantic atmosphere, soft lighting',
    'peace': 'serene landscape, calm water, peaceful scene, soft colors',
    'joy': 'bright colors, happy scene, cheerful atmosphere, vibrant'
  };
  
  // Check for specific keyword enhancement
  if (categoryEnhancements[cleanKeyword]) {
    return categoryEnhancements[cleanKeyword];
  }
  
  // Check for partial matches
  for (const [key, enhancement] of Object.entries(categoryEnhancements)) {
    if (cleanKeyword.includes(key) || key.includes(cleanKeyword)) {
      return enhancement.replace(key, cleanKeyword);
    }
  }
  
  // Default enhancement with intelligent categorization
  if (cleanKeyword.match(/\b(tree|flower|plant|garden|nature|leaf|grass)\b/)) {
    return `beautiful ${cleanKeyword}, natural setting, vibrant colors, detailed nature photography`;
  } else if (cleanKeyword.match(/\b(water|sea|lake|river|wave)\b/)) {
    return `${cleanKeyword}, crystal clear water, peaceful scene, high quality photography`;
  } else if (cleanKeyword.match(/\b(sky|cloud|sun|moon|star)\b/)) {
    return `beautiful ${cleanKeyword}, dramatic sky, atmospheric, professional photography`;
  } else if (cleanKeyword.match(/\b(city|building|street|urban)\b/)) {
    return `${cleanKeyword}, modern architecture, urban scene, detailed photography`;
  } else if (cleanKeyword.match(/\b(food|meal|restaurant|cooking)\b/)) {
    return `delicious ${cleanKeyword}, appetizing food photography, detailed, well-lit`;
  } else {
    return `high quality, detailed, realistic, beautiful ${cleanKeyword}, professional photography, vibrant colors`;
  }
}

export async function generateImageWithClipDrop(prompt: string): Promise<string> {
  const apiKey = process.env.CLIPDROP_API_KEY;
  
  console.log('ClipDrop API Key present:', !!apiKey);
  
  if (!apiKey) {
    throw new Error('ClipDrop API key not configured');
  }

  try {
    // Advanced prompt enhancement for maximum accuracy
    const enhancedPrompt = createEnhancedPrompt(prompt);
    
    const form = new FormData();
    form.append('prompt', enhancedPrompt);

    console.log('Attempting ClipDrop generation for enhanced prompt:', enhancedPrompt);
    
    const response = await fetch('https://clipdrop-api.co/text-to-image/v1', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ClipDrop API error:', response.status, errorText);
      throw new Error(`ClipDrop API error: ${response.status} - ${errorText}`);
    }

    console.log('ClipDrop generation successful for:', prompt);
    
    // Get the image as a buffer
    const imageBuffer = await response.arrayBuffer();
    
    // Convert to base64 for easy transmission
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;
    
    return dataUrl;
  } catch (error) {
    console.error('Error generating image with ClipDrop:', error);
    throw error;
  }
}