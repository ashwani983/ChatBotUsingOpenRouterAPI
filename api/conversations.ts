import type { VercelRequest, VercelResponse } from '@vercel/postgres';
import { sql } from '@vercel/postgres';

const MAX_MESSAGES_PER_CONVERSATION = 100;
const DELETE_OLD_DAYS = 7;

const dbUrl = process.env.opencontrolchat_DATABASE_URL || process.env.DATABASE_URL;
if (dbUrl) {
  process.env.POSTGRES_URL = dbUrl;
}

function getUserId(apiKey: string): string {
  return apiKey.slice(0, 8);
}

async function initDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        title VARCHAR(255) DEFAULT 'New Chat',
        model VARCHAR(100) DEFAULT 'meta-llama/llama-3.1-8b-instruct',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT
      )
    `;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)`;
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

async function cleanupOldData(userId: string) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DELETE_OLD_DAYS);
    
    await sql`
      DELETE FROM messages 
      WHERE conversation_id IN (
        SELECT id FROM conversations WHERE user_id = ${userId} AND updated_at < ${cutoffDate.toISOString()}
      )
    `;
    
    await sql`
      DELETE FROM conversations WHERE user_id = ${userId} AND updated_at < ${cutoffDate.toISOString()}
    `;
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

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
      await sql`
        DELETE FROM messages 
        WHERE id IN (${idsToDelete.join(',')})
      `;
    }
  } catch (error) {
    console.error('Limit messages error:', error);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }
  
  const userId = getUserId(apiKey);

  try {
    await initDatabase();
    await cleanupOldData(userId);

    if (req.method === 'GET') {
      const result = await sql`
        SELECT id, title, model, created_at, updated_at 
        FROM conversations 
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC
      `;
      return res.json(result.rows);
    }

    if (req.method === 'POST') {
      const result = await sql`
        INSERT INTO conversations (user_id, title, model) 
        VALUES (${userId}, 'New Chat', 'meta-llama/llama-3.1-8b-instruct')
        RETURNING id, title, model, created_at, updated_at
      `;
      const newConv = {
        id: result.rows[0].id,
        title: result.rows[0].title,
        model: result.rows[0].model,
        created_at: result.rows[0].created_at,
        updated_at: result.rows[0].updated_at
      };
      return res.json(newConv);
    }

    if (req.method === 'DELETE') {
      await sql`DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE user_id = ${userId})`;
      await sql`DELETE FROM conversations WHERE user_id = ${userId}`;
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

    if (req.method === 'POST') {
      const result = await sql`
        INSERT INTO conversations (title, model) 
        VALUES ('New Chat', 'meta-llama/llama-3.1-8b-instruct')
        RETURNING id, title, model, created_at, updated_at
      `;
      const newConv = result.rows[0];
      return res.json(newConv);
    }

    if (req.method === 'DELETE') {
      await sql`DELETE FROM messages`;
      await sql`DELETE FROM conversations`;
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}