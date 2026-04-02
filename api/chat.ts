import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required. Please add your OpenRouter API key in Settings.' });
  }

  const { message, model, temperature, max_tokens, system_prompt } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': req.headers.referer || 'https://vercel.app',
      'X-Title': 'OpenControlChat',
    },
  });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const stream = await openai.chat.completions.create({
      model: model || 'meta-llama/llama-3.1-8b-instruct',
      messages: [
        { role: 'system', content: system_prompt || 'You are a helpful AI assistant.' },
        { role: 'user', content: message }
      ],
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 2048,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('OpenRouter API error:', error.message);
    res.write(`data: ${JSON.stringify({ error: error.message || 'Failed to get response' })}\n\n`);
    res.end();
  }
}