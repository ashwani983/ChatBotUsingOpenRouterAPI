import type { VercelRequest, VercelResponse } from '@vercel/postgres';
import { sql } from '@vercel/postgres';

const dbUrl = process.env.opencontrolchat_DATABASE_URL || process.env.DATABASE_URL;
if (dbUrl) {
  process.env.POSTGRES_URL = dbUrl;
}

function getUserId(apiKey: string): string {
  return apiKey.slice(0, 16);
}

const DEFAULT_SETTINGS = {
  theme: 'dark',
  model: 'meta-llama/llama-3.1-8b-instruct',
  temperature: '0.7',
  max_tokens: '2048',
  system_prompt: 'You are a helpful AI assistant.',
  voice_enabled: 'false',
  tts_enabled: 'false',
  language: 'en-US',
  font_size: '16',
  code_auto_run: 'false'
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }
  const userId = getUserId(apiKey);
  const userPrefix = `user_${userId}_`;

  try {
    if (req.method === 'GET') {
      try {
        const result = await sql`
          SELECT key, value FROM settings WHERE key LIKE ${userPrefix + '%'}
        `;
        
        const settings: any = { ...DEFAULT_SETTINGS };
        for (const row of result.rows) {
          settings[row.key.replace(userPrefix, '')] = row.value;
        }
        return res.json(settings);
      } catch {
        return res.json(DEFAULT_SETTINGS);
      }
    }

    if (req.method === 'PUT') {
      const updates = req.body;
      
      for (const [key, value] of Object.entries(updates)) {
        const dbKey = `${userPrefix}${key}`;
        await sql`
          INSERT INTO settings (key, value) VALUES (${dbKey}, ${String(value)})
          ON CONFLICT (key) DO UPDATE SET value = ${String(value)}
        `;
      }
      
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}