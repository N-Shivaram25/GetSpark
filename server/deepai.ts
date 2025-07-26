export async function generateImageWithDeepAI(prompt: string): Promise<string> {
  try {
    const form = new FormData();
    form.append('text', prompt);

    const response = await fetch('https://api.deepai.org/api/text2img', {
      method: 'POST',
      headers: {
        'api-key': 'quickstart-QUdJIGlzIGNvbWluZy4uLi4K', // DeepAI's free public key for testing
      },
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepAI API error:', response.status, errorText);
      throw new Error(`DeepAI API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('DeepAI generation successful for:', prompt);
    
    return result.output_url;
  } catch (error) {
    console.error('Error generating image with DeepAI:', error);
    throw error;
  }
}