import type { VercelRequest, VercelResponse } from '@vercel/postgres';
import { sql } from '@vercel/postgres';
import { writeFileSync, existsSync, mkdirSync, unlinkSync, readFileSync } from 'fs';
import path from 'path';

const dbUrl = process.env.opencontrolchat_DATABASE_URL || process.env.DATABASE_URL;
const useDatabase = !!dbUrl;

if (dbUrl) {
  process.env.POSTGRES_URL = dbUrl;
}

const filesDir = path.join(process.cwd(), 'data', 'files');
if (!existsSync(filesDir)) {
  mkdirSync(filesDir, { recursive: true });
}

async function initFilesTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS files (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) DEFAULT 'default',
        filename VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        data TEXT,
        file_path VARCHAR(255),
        size INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
  } catch (error) {
    console.error('Init files table error:', error);
  }
}

function getUserId(apiKey: string): string {
  return apiKey.slice(0, 16);
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/json',
  'text/plain',
  'text/html',
  'text/css',
  'text/javascript',
  'text/markdown',
];

const MAX_FILE_SIZE = 2 * 1024 * 1024;

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
  const userId = apiKey ? getUserId(apiKey) : 'default';

  const { file, filename, mimeType } = req.body;

  if (!file || !filename) {
    return res.status(400).json({ error: 'File data and filename are required' });
  }

  if (!ALLOWED_TYPES.includes(mimeType)) {
    return res.status(400).json({ error: 'File type not allowed. Allowed: PDF, JSON, TXT, HTML, CSS, JS, MD' });
  }

  try {
    const buffer = Buffer.from(file, 'base64');
    
    if (buffer.length > MAX_FILE_SIZE) {
      return res.status(400).json({ error: 'File too large. Max size is 2MB.' });
    }

    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (useDatabase) {
      await initFilesTable();
      await sql`
        INSERT INTO files (id, user_id, filename, mime_type, data, size)
        VALUES (${fileId}, ${userId}, ${filename}, ${mimeType}, ${file}, ${buffer.length})
      `;
    } else {
      const filePath = path.join(filesDir, `${fileId}.${path.extname(filename)}`);
      writeFileSync(filePath, buffer);
      
      await sql`
        INSERT INTO files (id, user_id, filename, file_path, mime_type, size)
        VALUES (${fileId}, ${userId}, ${filename}, ${filePath}, ${mimeType}, ${buffer.length})
      `;
    }

    res.json({
      id: fileId,
      filename,
      mimeType,
      size: buffer.length,
      url: `/api/files/${fileId}`
    });
  } catch (error: any) {
    console.error('File upload error:', error.message);
    res.status(500).json({ error: 'Failed to upload file' });
  }
}
