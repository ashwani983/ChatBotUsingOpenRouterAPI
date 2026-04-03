import type { VercelRequest, VercelResponse } from '@vercel/postgres';
import { sql } from '@vercel/postgres';
import OpenAI from 'openai';

const MAX_MESSAGES_PER_CONVERSATION = 100;

async function limitMessages(conversationId: number) {
  try {
    const result = await sql`
      SELECT id FROM messages 
      WHERE conversation_id = ${conversationId} 
      ORDER BY created_at DESC 
      OFFSET ${MAX_MESSAGES_PER_CONVERSATION}
    `;
    
    if (result.rows.length > 0) {
      const idsToDelete = result.rows.map((row: any) => row.id);
      for (const id of idsToDelete) {
        await sql`DELETE FROM messages WHERE id = ${id}`;
      }
    }
  } catch (error) {
    console.error('Limit messages error:', error);
  }
}

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

  const { message, conversationId, model, temperature, max_tokens, system_prompt } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  let convId = conversationId;

  try {
    if (!convId) {
      const result = await sql`
        INSERT INTO conversations (title, model) 
        VALUES ('New Chat', ${model || 'meta-llama/llama-3.1-8b-instruct'})
        RETURNING id
      `;
      convId = result.rows[0].id;
    }

    const title = message.length > 30 ? message.substring(0, 30) + '...' : message;
    await sql`
      UPDATE conversations 
      SET title = ${title}, updated_at = NOW() 
      WHERE id = ${convId}
    `;

    await sql`
      INSERT INTO messages (conversation_id, role, content)
      VALUES (${convId}, 'user', ${message})
    `;

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

    let assistantMessage = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        assistantMessage += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    await sql`
      INSERT INTO messages (conversation_id, role, content)
      VALUES (${convId}, 'assistant', ${assistantMessage})
    `;

    await limitMessages(convId);

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Error:', error.message);
    res.write(`data: ${JSON.stringify({ error: error.message || 'Failed to get response' })}\n\n`);
    res.end();
  }
}