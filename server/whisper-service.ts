import OpenAI from "openai";
import { Request, Response } from "express";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export interface WhisperTranscriptionResult {
  text: string;
  correctedText: string;
  confidence: number;
}

export async function transcribeAudioWithWhisper(audioBuffer: Buffer): Promise<WhisperTranscriptionResult> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    // Create a File object from the buffer
    const audioFile = new File([audioBuffer], "audio.webm", { type: "audio/webm" });

    // Use Whisper for transcription
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "verbose_json",
      language: "en"
    });

    // Use GPT-4o for grammar correction and enhancement
    const correctionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an advanced grammar correction AI. Your job is to:
1. Correct any speech recognition errors
2. Add proper punctuation and capitalization
3. Ensure sentences are grammatically correct and natural
4. Maintain the original meaning and intent
5. Format text for optimal readability (12 words max per line)
6. Return only the corrected text as a JSON object with "corrected_text" key

Important: Never break sentences mid-way. Each sentence should be complete and flow naturally.`
        },
        {
          role: "user",
          content: `Please correct and enhance this transcribed text: "${transcription.text}"`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    let correctedText = transcription.text;
    try {
      const correctionResult = JSON.parse(correctionResponse.choices[0].message.content || '{}');
      correctedText = correctionResult.corrected_text || transcription.text;
    } catch (parseError) {
      console.warn('Failed to parse correction response, using original text');
    }

    // Calculate confidence from segments if available
    let confidence = 0.8; // Default confidence
    if (transcription.segments && transcription.segments.length > 0) {
      const avgLogProb = transcription.segments.reduce((sum, segment) => sum + (segment.avg_logprob || 0), 0) / transcription.segments.length;
      confidence = Math.max(0.1, Math.min(1.0, Math.exp(avgLogProb)));
    }

    return {
      text: transcription.text,
      correctedText,
      confidence
    };
  } catch (error) {
    console.error('Whisper transcription error:', error);
    throw new Error('Failed to transcribe audio with Whisper');
  }
}

export async function correctGrammarWithLanguageTool(text: string): Promise<string> {
  const apiKey = process.env.LANGUAGETOOL_API_KEY;
  
  if (!apiKey) {
    console.log('LanguageTool API key not configured, skipping grammar correction');
    return text;
  }

  try {
    const response = await fetch('https://api.languagetoolplus.com/v2/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text: text,
        language: 'en-US',
        enabledRules: '',
        disabledRules: '',
      }),
    });

    if (!response.ok) {
      throw new Error(`LanguageTool API error: ${response.status}`);
    }

    const result = await response.json();
    
    // Apply corrections
    let correctedText = text;
    if (result.matches && result.matches.length > 0) {
      // Sort matches by offset in descending order to avoid offset issues
      const sortedMatches = result.matches.sort((a: any, b: any) => b.offset - a.offset);
      
      for (const match of sortedMatches) {
        if (match.replacements && match.replacements.length > 0) {
          const replacement = match.replacements[0].value;
          correctedText = correctedText.substring(0, match.offset) + 
                          replacement + 
                          correctedText.substring(match.offset + match.length);
        }
      }
    }

    return correctedText;
  } catch (error) {
    console.error('LanguageTool correction error:', error);
    return text; // Return original text if correction fails
  }
}