import type { VercelRequest, VercelResponse } from '@vercel/postgres';
import { sql } from '@vercel/postgres';

const dbUrl = process.env.opencontrolchat_DATABASE_URL || process.env.DATABASE_URL;
if (dbUrl) {
  process.env.POSTGRES_URL = dbUrl;
}

function getUserId(apiKey: string): string {
  return apiKey.slice(0, 8);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
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
  const convId = parseInt(id as string);

  if (isNaN(convId)) {
    return res.status(400).json({ error: 'Invalid conversation ID' });
  }

  try {
    if (req.method === 'GET') {
      const result = await sql`
        SELECT id, title, model, created_at, updated_at 
        FROM conversations 
        WHERE id = ${convId} AND user_id = ${userId}
      `;
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      return res.json(result.rows[0]);
    }

    if (req.method === 'PUT') {
      const { title } = req.body;
      const result = await sql`
        UPDATE conversations 
        SET title = COALESCE(${title}, title), updated_at = NOW()
        WHERE id = ${convId} AND user_id = ${userId}
        RETURNING id, title, model, created_at, updated_at
      `;
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      return res.json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      await sql`DELETE FROM messages WHERE conversation_id = ${convId}`;
      await sql`DELETE FROM conversations WHERE id = ${convId} AND user_id = ${userId}`;
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}