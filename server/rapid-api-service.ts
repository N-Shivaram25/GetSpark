const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

export interface ImageSearchResult {
  url: string;
  title: string;
  source: string;
}

export interface TopicInfo {
  definition: string;
  basicCode: string;
  complexCode: string;
  language: string;
}

export async function searchImagesRapidAPI(query: string): Promise<ImageSearchResult[]> {
  if (!RAPIDAPI_KEY) {
    throw new Error('RapidAPI key not configured');
  }

  try {
    const response = await fetch(`https://real-time-image-search.p.rapidapi.com/search?query=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'real-time-image-search.p.rapidapi.com',
        'x-rapidapi-key': RAPIDAPI_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`RapidAPI Image Search error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract and format image results
    const images = data.data || [];
    return images.slice(0, 3).map((img: any) => ({
      url: img.url || img.image_url || img.link,
      title: img.title || img.alt || 'Image',
      source: img.source || 'Unknown'
    }));
  } catch (error) {
    console.error('RapidAPI Image Search error:', error);
    return [];
  }
}

export async function getTopicInfoWithGemini(topic: string, isComplex: boolean = false): Promise<TopicInfo> {
  if (!RAPIDAPI_KEY) {
    throw new Error('RapidAPI key not configured');
  }

  try {
    const complexityPrompt = isComplex 
      ? "Provide a complex, real-world example with advanced concepts and detailed implementation."
      : "Provide a basic, beginner-friendly example that's easy to understand.";

    const prompt = `What is ${topic} in programming? Please provide:
1. A clear, concise definition (2-3 sentences)
2. A ${isComplex ? 'complex' : 'basic'} code example with comments
3. Specify the programming language used

${complexityPrompt}

Format your response as JSON with keys: "definition", "code", "language"`;

    const response = await fetch('https://gemini-pro-ai.p.rapidapi.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'gemini-pro-ai.p.rapidapi.com',
        'x-rapidapi-key': RAPIDAPI_KEY,
      },
      body: JSON.stringify({
        contents: [
          { 
            role: "user", 
            parts: [{ text: prompt }] 
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini Pro API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Try to parse JSON response
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch {
      // If not JSON, extract information manually
      parsedContent = {
        definition: content.substring(0, 200) + '...',
        code: 'console.log("Code example not available");',
        language: 'javascript'
      };
    }

    return {
      definition: parsedContent.definition || 'Definition not available',
      basicCode: isComplex ? '' : (parsedContent.code || 'No code example available'),
      complexCode: isComplex ? (parsedContent.code || 'No complex example available') : '',
      language: parsedContent.language || 'javascript'
    };
  } catch (error) {
    console.error('Gemini Pro API error:', error);
    return {
      definition: `${topic} is a programming concept. (Definition unavailable)`,
      basicCode: isComplex ? '' : 'console.log("Basic example not available");',
      complexCode: isComplex ? 'console.log("Complex example not available");' : '',
      language: 'javascript'
    };
  }
}