import type { VercelRequest, VercelResponse } from '@vercel/postgres';
import { sql } from '@vercel/postgres';
import OpenAI from 'openai';

const dbUrl = process.env.opencontrolchat_DATABASE_URL || process.env.DATABASE_URL;
if (dbUrl) {
  process.env.POSTGRES_URL = dbUrl;
}

async function initImagesTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS images (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) DEFAULT 'default',
        data TEXT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
  } catch (error) {
    console.error('Init images table error:', error);
  }
}

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

  const userId = getUserId(apiKey);
  const { imageId, mimeType } = req.body;

  if (!imageId) {
    return res.status(400).json({ error: 'Image ID is required' });
  }

  try {
    await initImagesTable();
    
    const result = await sql`
      SELECT data, mime_type FROM images WHERE id = ${imageId} AND user_id = ${userId}
    `;

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const image = result.rows[0].data;
    const imgMimeType = result.rows[0].mime_type;

    await sql`DELETE FROM images WHERE id = ${imageId}`;

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
                url: `data:${imgMimeType || 'image/jpeg'};base64,${image}`
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
