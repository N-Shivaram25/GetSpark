import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface SpeechTranscriptionResult {
  text: string;
  confidence: number;
  correctedText: string;
}

export async function transcribeAudioWithOpenAI(audioBlob: Buffer): Promise<SpeechTranscriptionResult> {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: new File([audioBlob], "audio.webm", { type: "audio/webm" }),
      model: "whisper-1",
      response_format: "verbose_json",
      language: "en"
    });

    // Use GPT-4o for advanced grammar correction and text enhancement
    const correctionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an advanced grammar correction and text enhancement AI. Your job is to:
1. Correct any speech recognition errors
2. Add proper punctuation and capitalization
3. Ensure sentences are grammatically correct
4. Maintain the original meaning and intent
5. Format text to occupy complete lines without breaking sentences mid-way
6. Return only the corrected text, no explanations or additional commentary

Rules for line formatting:
- Each sentence should be complete and occupy full lines
- Don't break sentences in the middle
- Use proper paragraph structure
- Maximum 12 words per line for optimal readability`
        },
        {
          role: "user",
          content: `Please correct and enhance this transcribed text: "${transcription.text}"`
        }
      ],
      response_format: { type: "json_object" },
    });

    const correctedResult = JSON.parse(correctionResponse.choices[0].message.content || '{"corrected_text": ""}');

    return {
      text: transcription.text,
      confidence: transcription.segments?.[0]?.avg_logprob ? Math.exp(transcription.segments[0].avg_logprob) : 0.8,
      correctedText: correctedResult.corrected_text || transcription.text
    };
  } catch (error) {
    console.error('OpenAI speech transcription error:', error);
    throw new Error('Failed to transcribe audio with OpenAI');
  }
}

export async function enhanceTextAccuracy(text: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a speech-to-text accuracy enhancer. Improve the given text by:
1. Correcting speech recognition errors
2. Adding proper punctuation and capitalization
3. Ensuring grammatical correctness
4. Maintaining original meaning
5. Formatting for complete line occupancy (12 words max per line)
6. Never breaking sentences mid-way

Return the enhanced text in JSON format with the key "enhanced_text".`
        },
        {
          role: "user",
          content: `Enhance this text: "${text}"`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"enhanced_text": ""}');
    return result.enhanced_text || text;
  } catch (error) {
    console.error('Text enhancement error:', error);
    return text;
  }
}