import type { VercelRequest, VercelResponse } from '@vercel/node';

interface Conversation {
  id: number;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: number;
  conversation_id: number;
  role: string;
  content: string;
  created_at: string;
}

const conversationStore: Record<number, Conversation> = {};
const messageStore: Record<number, Message[]> = {};
let conversationIdCounter = 1;
let messageIdCounter = 1;

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  const convId = typeof id === 'string' ? parseInt(id) : 0;

  if (req.method === 'GET') {
    const conv = conversationStore[convId];
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    return res.json(conv);
  }

  if (req.method === 'PUT') {
    const { title } = req.body;
    if (!conversationStore[convId]) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    conversationStore[convId].title = title || conversationStore[convId].title;
    conversationStore[convId].updated_at = new Date().toISOString();
    return res.json(conversationStore[convId]);
  }

  if (req.method === 'DELETE') {
    if (!conversationStore[convId]) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    delete conversationStore[convId];
    delete messageStore[convId];
    return res.json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}