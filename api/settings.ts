import type { VercelRequest, VercelResponse } from '@vercel/node';

const settingsStore: Record<string, string> = {
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

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.json(settingsStore);
  }

  if (req.method === 'PUT') {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      settingsStore[key] = String(value);
    }
    return res.json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}