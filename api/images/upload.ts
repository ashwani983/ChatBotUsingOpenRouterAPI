import type { VercelRequest, VercelResponse } from '@vercel/postgres';
import { sql } from '@vercel/postgres';
import { writeFileSync, existsSync, mkdirSync, unlinkSync, readFileSync } from 'fs';
import path from 'path';

const dbUrl = process.env.opencontrolchat_DATABASE_URL || process.env.DATABASE_URL;
const useDatabase = !!dbUrl;

if (dbUrl) {
  process.env.POSTGRES_URL = dbUrl;
}

const imagesDir = path.join(process.cwd(), 'data', 'images');
if (!existsSync(imagesDir)) {
  mkdirSync(imagesDir, { recursive: true });
}

async function initImagesTable() {
  if (!useDatabase) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS images (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) DEFAULT 'default',
        data TEXT,
        file_path VARCHAR(255),
        mime_type VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
  } catch (error) {
    console.error('Init images table error:', error);
  }
}

function getUserId(apiKey: string): string {
  return apiKey.slice(0, 16);
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }

  const userId = getUserId(apiKey);
  const { image, mimeType } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'Image data is required' });
  }

  try {
    const imageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (useDatabase) {
      await initImagesTable();
      const buffer = Buffer.from(image, 'base64');
      
      if (buffer.length > MAX_IMAGE_SIZE) {
        return res.status(400).json({ error: 'Image too large. Max size is 5MB.' });
      }
      
      await sql`
        INSERT INTO images (id, user_id, data, mime_type)
        VALUES (${imageId}, ${userId}, ${image}, ${mimeType})
      `;
    } else {
      const buffer = Buffer.from(image, 'base64');
      
      if (buffer.length > MAX_IMAGE_SIZE) {
        return res.status(400).json({ error: 'Image too large. Max size is 5MB.' });
      }

      const filePath = path.join(imagesDir, `${imageId}.jpg`);
      writeFileSync(filePath, buffer);
      
      await sql`
        INSERT INTO images (id, user_id, file_path, mime_type)
        VALUES (${imageId}, ${userId}, ${filePath}, ${mimeType})
      `;
    }

    res.json({
      id: imageId
    });
  } catch (error: any) {
    console.error('Image upload error:', error.message);
    res.status(500).json({ error: 'Failed to upload image' });
  }
}
