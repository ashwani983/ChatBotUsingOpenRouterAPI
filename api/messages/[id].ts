import type { VercelRequest, VercelResponse } from '@vercel/postgres';
import { sql } from '@vercel/postgres';

const dbUrl = process.env.opencontrolchat_DATABASE_URL || process.env.DATABASE_URL;
if (dbUrl) {
  process.env.POSTGRES_URL = dbUrl;
}

function getUserId(apiKey: string): string {
  return apiKey.slice(0, 16);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }
  const userId = getUserId(apiKey);

  const { id } = req.query;
  const msgId = parseInt(id as string);

  if (isNaN(msgId)) {
    return res.status(400).json({ error: 'Invalid message ID' });
  }

  try {
    if (req.method === 'DELETE') {
      const result = await sql`
        DELETE FROM messages m 
        WHERE m.id = ${msgId} 
        AND m.conversation_id IN (SELECT id FROM conversations WHERE user_id = ${userId})
        RETURNING id
      `;
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}