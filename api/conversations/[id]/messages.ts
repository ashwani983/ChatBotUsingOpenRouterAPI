import type { VercelRequest, VercelResponse } from '@vercel/node';

interface Message {
  id: number;
  conversation_id: number;
  role: string;
  content: string;
  created_at: string;
}

const messageStore: Record<number, Message[]> = {};
let messageIdCounter = 1;

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  const convId = typeof id === 'string' ? parseInt(id) : 0;

  if (req.method === 'GET') {
    const messages = messageStore[convId] || [];
    return res.json(messages);
  }

  res.status(405).json({ error: 'Method not allowed' });
}