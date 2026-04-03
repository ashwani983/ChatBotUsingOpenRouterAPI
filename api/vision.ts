import type { VercelRequest, VercelResponse } from '@vercel/postgres';
import OpenAI from 'openai';

function getUserId(apiKey: string): string {
  return apiKey.slice(0, 16);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }

  const { image, mimeType } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'Image data is required' });
  }

  try {
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': req.headers.referer || 'https://vercel.app',
        'X-Title': 'OpenControlChat',
      },
    });

    const response = await openai.chat.completions.create({
      model: 'nvidia/nemotron-nano-12b-v2-vl',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this image and provide a detailed description. Include any text, objects, people, settings, or other notable elements you can identify.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType || 'image/jpeg'};base64,${image}`
              }
            }
          ]
        }
      ]
    });

    const analysis = response.choices[0]?.message?.content || 'Unable to analyze image.';
    res.json({ analysis });
  } catch (error: any) {
    console.error('Vision API error:', error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
}
