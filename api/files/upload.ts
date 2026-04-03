import type { VercelRequest, VercelResponse } from '@vercel/postgres';
import { sql } from '@vercel/postgres';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

const dbUrl = process.env.opencontrolchat_DATABASE_URL || process.env.DATABASE_URL;
if (dbUrl) {
  process.env.POSTGRES_URL = dbUrl;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/html',
  'text/css',
  'text/javascript',
  'application/json',
  'application/xml',
  'text/markdown',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { file, filename, mimeType } = req.body;

  if (!file || !filename) {
    return res.status(400).json({ error: 'File data and filename are required' });
  }

  if (!ALLOWED_TYPES.includes(mimeType)) {
    return res.status(400).json({ error: 'File type not allowed' });
  }

  try {
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const ext = path.extname(filename);
    const storedFilename = `${fileId}${ext}`;

    const buffer = Buffer.from(file, 'base64');
    
    if (buffer.length > MAX_FILE_SIZE) {
      return res.status(400).json({ error: 'File too large. Max size is 10MB.' });
    }

    const filesDir = path.join(process.cwd(), 'data', 'files');
    if (!existsSync(filesDir)) {
      mkdirSync(filesDir, { recursive: true });
    }

    const filePath = path.join(filesDir, storedFilename);
    writeFileSync(filePath, buffer);

    res.json({
      id: fileId,
      filename,
      mimeType,
      size: buffer.length,
      url: `/api/files/${fileId}`
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
}
