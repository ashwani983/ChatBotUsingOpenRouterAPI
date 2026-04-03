import type { VercelRequest, VercelResponse } from '@vercel/postgres';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
        WHERE id = ${convId}
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
        WHERE id = ${convId}
        RETURNING id, title, model, created_at, updated_at
      `;
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      return res.json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      await sql`DELETE FROM messages WHERE conversation_id = ${convId}`;
      await sql`DELETE FROM conversations WHERE id = ${convId}`;
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}