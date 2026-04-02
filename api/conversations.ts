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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const conversations = Object.values(conversationStore).sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    return res.json(conversations);
  }

  if (req.method === 'POST') {
    const now = new Date().toISOString();
    const id = conversationIdCounter++;
    const newConv: Conversation = {
      id,
      title: 'New Chat',
      model: 'meta-llama/llama-3.1-8b-instruct',
      created_at: now,
      updated_at: now,
    };
    conversationStore[id] = newConv;
    messageStore[id] = [];
    return res.json(newConv);
  }

  if (req.method === 'DELETE') {
    Object.keys(conversationStore).forEach(key => delete conversationStore[parseInt(key)]);
    Object.keys(messageStore).forEach(key => delete messageStore[parseInt(key)]);
    return res.json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}