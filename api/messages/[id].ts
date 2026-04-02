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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  const msgId = typeof id === 'string' ? parseInt(id) : 0;

  if (req.method === 'DELETE') {
    for (const convId in messageStore) {
      const idx = messageStore[parseInt(convId)].findIndex(m => m.id === msgId);
      if (idx !== -1) {
        messageStore[parseInt(convId)].splice(idx, 1);
        return res.json({ success: true });
      }
    }
    return res.status(404).json({ error: 'Message not found' });
  }

  res.status(405).json({ error: 'Method not allowed' });
}