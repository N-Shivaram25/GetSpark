export async function generateImageWithClipDrop(prompt: string): Promise<string> {
  const apiKey = process.env.CLIPDROP_API_KEY;
  
  if (!apiKey) {
    throw new Error('ClipDrop API key not configured');
  }

  try {
    const form = new FormData();
    form.append('prompt', prompt);

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
      throw new Error(`ClipDrop API error: ${response.status}`);
    }

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