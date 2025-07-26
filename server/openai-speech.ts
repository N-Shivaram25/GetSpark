import OpenAI from 'openai';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface SpeechCorrectionResult {
  correctedText: string;
  confidenceScore: number;
  corrections: Array<{
    original: string;
    corrected: string;
    reason: string;
  }>;
}

export async function correctSpeechText(rawText: string): Promise<SpeechCorrectionResult> {
  try {
    const prompt = `You are an expert speech recognition text correction system. Your task is to fix errors in speech-to-text transcription while preserving the speaker's intent and natural flow.

RULES:
1. Fix obvious speech recognition errors (garbled words, missing letters, wrong words)
2. Correct grammar and punctuation naturally
3. Preserve the speaker's tone and meaning
4. Don't add or remove significant content
5. Return valid JSON only

Original text: "${rawText}"

Analyze and correct this text, then respond with JSON in this exact format:
{
  "correctedText": "the fully corrected text",
  "confidenceScore": 0.95,
  "corrections": [
    {
      "original": "garbled word",
      "corrected": "correct word", 
      "reason": "speech recognition error"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 1000
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      correctedText: result.correctedText || rawText,
      confidenceScore: Math.max(0, Math.min(1, result.confidenceScore || 0.5)),
      corrections: result.corrections || []
    };
  } catch (error) {
    console.error('OpenAI speech correction error:', error);
    return {
      correctedText: rawText,
      confidenceScore: 0.1,
      corrections: []
    };
  }
}

export async function enhancedKeywordDetection(text: string, keywords: string[]): Promise<{
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
}> {
  if (keywords.length === 0) {
    return { detectedKeywords: [], semanticMatches: [] };
  }

  try {
    const prompt = `You are a keyword detection expert. Analyze the text for keywords, including semantic and fuzzy matches.

Text: "${text}"
Keywords to find: ${keywords.map(k => `"${k}"`).join(', ')}

Find:
1. Exact matches (word boundaries)
2. Semantic matches (similar meaning)
3. Fuzzy matches (similar spelling, 80%+ accuracy)

Return JSON:
{
  "detectedKeywords": [
    {
      "keyword": "original keyword",
      "confidence": 0.95,
      "position": 42,
      "matchType": "exact"
    }
  ],
  "semanticMatches": [
    {
      "keyword": "original keyword",
      "matchedPhrase": "phrase that matches semantically",
      "confidence": 0.8
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 800
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      detectedKeywords: result.detectedKeywords || [],
      semanticMatches: result.semanticMatches || []
    };
  } catch (error) {
    console.error('Enhanced keyword detection error:', error);
    return { detectedKeywords: [], semanticMatches: [] };
  }
}

export class AccuracyBuffer {
  private buffer: Array<{
    text: string;
    timestamp: number;
    processed: boolean;
  }> = [];
  
  private readonly BUFFER_SIZE = 10;
  private readonly PROCESSING_DELAY = 2000; // 2 seconds

  addText(text: string): void {
    this.buffer.push({
      text,
      timestamp: Date.now(),
      processed: false
    });

    // Keep buffer size manageable
    if (this.buffer.length > this.BUFFER_SIZE) {
      this.buffer.shift();
    }
  }

  async processBufferedText(): Promise<string> {
    const now = Date.now();
    const textToProcess = this.buffer
      .filter(item => 
        !item.processed && 
        (now - item.timestamp) > this.PROCESSING_DELAY
      )
      .map(item => {
        item.processed = true;
        return item.text;
      })
      .join(' ');

    if (textToProcess.trim()) {
      const corrected = await correctSpeechText(textToProcess);
      return corrected.correctedText;
    }

    return '';
  }

  getRecentText(seconds: number = 10): string {
    const cutoff = Date.now() - (seconds * 1000);
    return this.buffer
      .filter(item => item.timestamp > cutoff)
      .map(item => item.text)
      .join(' ');
  }
}