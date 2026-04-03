import type { VercelRequest, VercelResponse } from '@vercel/postgres';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  const msgId = parseInt(id as string);

  if (isNaN(msgId)) {
    return res.status(400).json({ error: 'Invalid message ID' });
  }

  try {
    if (req.method === 'DELETE') {
      const result = await sql`
        DELETE FROM messages WHERE id = ${msgId} RETURNING id
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