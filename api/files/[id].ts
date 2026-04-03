import type { VercelRequest, VercelResponse } from '@vercel/postgres';
import { readFileSync, existsSync, readdirSync } from 'fs';
import path from 'path';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'File ID is required' });
  }

  try {
    const filesDir = path.join(process.cwd(), 'data', 'files');
    
    if (!existsSync(filesDir)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const files = readdirSync(filesDir);
    const file = files.find(f => f.startsWith(id as string));

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(filesDir, file);
    const buffer = readFileSync(filePath);
    const ext = path.extname(file);
    
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.md': 'text/markdown',
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file}"`);
    res.send(buffer);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
}
