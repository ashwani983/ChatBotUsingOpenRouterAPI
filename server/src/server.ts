import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import initSqlJs from 'sql.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const home = process.env.HOME || process.env.USERPROFILE || '';
const dataDir = path.join(home, '.occhat');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, 'occhat.db');

let db: any;

async function initDatabase() {
  const SQL = await initSqlJs();
  
  let data: Buffer | undefined;
  if (fs.existsSync(dbPath)) {
    data = fs.readFileSync(dbPath);
  }
  
  db = new SQL.Database(data);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT 'New Chat',
      model TEXT DEFAULT 'meta-llama/llama-3.1-8b-instruct',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
  
  const defaultSettings = [
    ['theme', 'dark'],
    ['model', 'meta-llama/llama-3.1-8b-instruct'],
    ['temperature', '0.7'],
    ['max_tokens', '2048'],
    ['system_prompt', 'You are a helpful AI assistant. You provide clear, concise, and accurate responses. When providing code examples, use proper formatting and explain your reasoning.'],
    ['voice_enabled', 'false'],
    ['tts_enabled', 'false'],
    ['language', 'en-US'],
    ['font_size', '16'],
    ['code_auto_run', 'false']
  ];
  
  for (const [key, value] of defaultSettings) {
    db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, value]);
  }
  
  saveDatabase();
  
  console.log('Database initialized at:', dbPath);
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

let apiKey = process.env.OPENROUTER_API_KEY;
let clientApiKey: string | null = null;

if (!apiKey) {
  const configPath = path.join(home, '.occhatrc');
  try {
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      apiKey = config.apiKey;
    }
  } catch (e) {
    console.error('Error reading config file:', e);
  }
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  const apiKeyHeader = req.headers['x-api-key'] as string;
  if (apiKeyHeader) {
    clientApiKey = apiKeyHeader;
  }
  next();
});

function getApiKey(): string {
  return clientApiKey || apiKey || '';
}

const AVAILABLE_MODELS = [
  { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', provider: 'Meta' },
  { id: 'google/gemma-2-9b-it', name: 'Gemma 2 9B', provider: 'Google' },
  { id: 'mistralai/mistral-7b-instruct', name: 'Mistral 7B', provider: 'Mistral' },
  { id: 'microsoft/phi-3-mini-128k-instruct', name: 'Phi 3 Mini', provider: 'Microsoft' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek' },
];

function createOpenAIClient(key: string) {
  return new OpenAI({
    apiKey: key,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'http://localhost:3001',
      'X-Title': 'OpenControlChat',
    },
  });
}

// API Routes
app.get('/api/models', (req, res) => {
  res.json(AVAILABLE_MODELS);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/conversations', (req, res) => {
  const result = db.exec('SELECT id, title, model, created_at, updated_at FROM conversations ORDER BY updated_at DESC');
  const conversations = result.length > 0 ? result[0].values.map((row: any) => ({
    id: row[0],
    title: row[1],
    model: row[2],
    created_at: row[3],
    updated_at: row[4]
  })) : [];
  res.json(conversations);
});

app.post('/api/conversations', (req, res) => {
  db.run('INSERT INTO conversations (title, model) VALUES (?, ?)', ['New Chat', 'meta-llama/llama-3.1-8b-instruct']);
  const result = db.exec('SELECT last_insert_rowid()');
  const lastId = result[0].values[0][0];
  saveDatabase();
  
  const convResult = db.exec('SELECT id, title, model, created_at, updated_at FROM conversations WHERE id = ?', [lastId]);
  const row = convResult[0].values[0];
  res.json({
    id: row[0],
    title: row[1],
    model: row[2],
    created_at: row[3],
    updated_at: row[4]
  });
});

app.get('/api/conversations/:id', (req, res) => {
  const result = db.exec('SELECT id, title, model, created_at, updated_at FROM conversations WHERE id = ?', [req.params.id]);
  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  const row = result[0].values[0];
  res.json({
    id: row[0],
    title: row[1],
    model: row[2],
    created_at: row[3],
    updated_at: row[4]
  });
});

app.put('/api/conversations/:id', (req, res) => {
  const { title } = req.body;
  db.run('UPDATE conversations SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [title, req.params.id]);
  saveDatabase();
  
  const result = db.exec('SELECT id, title, model, created_at, updated_at FROM conversations WHERE id = ?', [req.params.id]);
  const row = result[0].values[0];
  res.json({
    id: row[0],
    title: row[1],
    model: row[2],
    created_at: row[3],
    updated_at: row[4]
  });
});

app.delete('/api/conversations/:id', (req, res) => {
  db.run('DELETE FROM messages WHERE conversation_id = ?', [req.params.id]);
  db.run('DELETE FROM conversations WHERE id = ?', [req.params.id]);
  saveDatabase();
  res.json({ success: true });
});

app.delete('/api/conversations', (req, res) => {
  db.run('DELETE FROM messages');
  db.run('DELETE FROM conversations');
  saveDatabase();
  res.json({ success: true });
});

app.get('/api/conversations/:id/messages', (req, res) => {
  const result = db.exec('SELECT id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC', [req.params.id]);
  const messages = result.length > 0 ? result[0].values.map((row: any) => ({
    id: row[0],
    role: row[1],
    content: row[2],
    created_at: row[3]
  })) : [];
  res.json(messages);
});

app.delete('/api/messages/:id', (req, res) => {
  db.run('DELETE FROM messages WHERE id = ?', [req.params.id]);
  saveDatabase();
  res.json({ success: true });
});

app.get('/api/settings', (req, res) => {
  const result = db.exec('SELECT key, value FROM settings');
  const settingsObj: Record<string, string> = {};
  if (result.length > 0) {
    for (const row of result[0].values) {
      settingsObj[row[0] as string] = row[1] as string;
    }
  }
  res.json(settingsObj);
});

app.put('/api/settings', (req, res) => {
  const updates = req.body;
  for (const [key, value] of Object.entries(updates)) {
    db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
  }
  saveDatabase();
  res.json({ success: true });
});

app.post('/api/chat', async (req, res) => {
  const { message, conversationId, model, temperature, max_tokens, system_prompt } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  let convId = conversationId;
  if (!convId) {
    db.run('INSERT INTO conversations (title, model) VALUES (?, ?)', ['New Chat', model || 'meta-llama/llama-3.1-8b-instruct']);
    const result = db.exec('SELECT last_insert_rowid()');
    convId = result[0].values[0][0];
    saveDatabase();
  }

  const getSetting = (key: string): string | null => {
    const result = db.exec('SELECT value FROM settings WHERE key = ?', [key]);
    return result.length > 0 && result[0].values.length > 0 ? result[0].values[0][0] as string : null;
  };
  
  const sysPrompt = system_prompt || getSetting('system_prompt') || 'You are a helpful AI assistant.';
  const modelUsed = model || getSetting('model') || 'meta-llama/llama-3.1-8b-instruct';
  const temp = temperature || parseFloat(getSetting('temperature') || '0.7');
  const maxTok = max_tokens || parseInt(getSetting('max_tokens') || '2048');

  const msgResult = db.exec('SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC', [convId]);
  const dbMessages: { role: string; content: string }[] = msgResult.length > 0 
    ? msgResult[0].values.map((row: any) => ({ role: row[0], content: row[1] }))
    : [];
  
  const messages = [
    { role: 'system', content: sysPrompt },
    ...dbMessages,
    { role: 'user', content: message }
  ];

  db.run('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)', [convId, 'user', message]);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const currentApiKey = getApiKey();
  if (!currentApiKey) {
    return res.status(401).json({ error: 'API key is required. Please configure your OpenRouter API key in Settings.' });
  }

  const openai = createOpenAIClient(currentApiKey);

  try {
    const stream = await openai.chat.completions.create({
      model: modelUsed,
      messages: messages as any,
      temperature: temp,
      max_tokens: maxTok,
      stream: true,
    });

    let assistantMessage = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        assistantMessage += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    db.run('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)', [convId, 'assistant', assistantMessage]);
    
    const titleMessage = message.length > 30 ? message.substring(0, 30) + '...' : message;
    db.run('UPDATE conversations SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
      [titleMessage, convId]);
    
    saveDatabase();

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('OpenRouter API error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Failed to get response' })}\n\n`);
    res.end();
  }
});

app.post('/api/chat/reset', (req, res) => {
  const { conversationId } = req.body;
  if (conversationId) {
    db.run('DELETE FROM messages WHERE conversation_id = ?', [conversationId]);
    saveDatabase();
  }
  res.json({ success: true });
});

app.post('/api/vision/analyze', async (req, res) => {
  const { image, mimeType, imageId } = req.body;

  let imageData = image;
  let imgMimeType = mimeType;

  if (imageId) {
    try {
      const files = fs.readdirSync(imagesDir);
      const imageFile = files.find(f => f.startsWith(imageId));
      if (imageFile) {
        const filePath = path.join(imagesDir, imageFile);
        const buffer = fs.readFileSync(filePath);
        imageData = buffer.toString('base64');
        const ext = path.extname(imageFile).toLowerCase();
        imgMimeType = ext === '.png' ? 'image/png' : 
                      ext === '.gif' ? 'image/gif' : 
                      ext === '.webp' ? 'image/webp' : 'image/jpeg';
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.error('Error loading image:', e);
    }
  }

  if (!imageData) {
    return res.status(400).json({ error: 'Image data is required' });
  }

  const currentApiKey = getApiKey();
  if (!currentApiKey) {
    return res.status(401).json({ error: 'API key is required. Please configure your OpenRouter API key in Settings.' });
  }

  const openai = createOpenAIClient(currentApiKey);

  try {
    const response = await openai.chat.completions.create({
      model: 'nvidia/nemotron-nano-12b-v2-vl',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this image and provide a detailed description. Include any text, objects, people, settings, or other notable elements you can identify.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${imgMimeType || 'image/jpeg'};base64,${imageData}`
              }
            }
          ]
        }
      ]
    });

    const analysis = response.choices[0]?.message?.content || 'Unable to analyze image.';
    res.json({ analysis });
  } catch (error) {
    console.error('Vision API error:', error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

const filesDir = path.join(dataDir, 'files');
if (!fs.existsSync(filesDir)) {
  fs.mkdirSync(filesDir, { recursive: true });
}

const imagesDir = path.join(dataDir, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

app.post('/api/images/upload', (req, res) => {
  const { image, mimeType } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'Image data is required' });
  }

  try {
    const buffer = Buffer.from(image, 'base64');
    
    if (buffer.length > MAX_IMAGE_SIZE) {
      return res.status(400).json({ error: 'Image too large. Max size is 5MB.' });
    }

    const imageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const ext = mimeType === 'image/png' ? '.png' : 
                mimeType === 'image/gif' ? '.gif' : 
                mimeType === 'image/webp' ? '.webp' : '.jpg';
    const filePath = path.join(imagesDir, `${imageId}${ext}`);
    
    fs.writeFileSync(filePath, buffer);

    res.json({ id: imageId });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

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

app.post('/api/files/upload', (req, res) => {
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
    const filePath = path.join(filesDir, storedFilename);

    const buffer = Buffer.from(file, 'base64');
    
    if (buffer.length > MAX_FILE_SIZE) {
      return res.status(400).json({ error: 'File too large. Max size is 10MB.' });
    }

    fs.writeFileSync(filePath, buffer);

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
});

app.get('/api/files/:id', (req, res) => {
  const { id } = req.params;

  try {
    const files = fs.readdirSync(filesDir);
    const file = files.find(f => f.startsWith(id));

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(filesDir, file);
    const buffer = fs.readFileSync(filePath);
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

    const mimeType = mimeTypes[ext.toLowerCase()] || 'application/octet-stream';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file}"`);
    res.send(buffer);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

app.get('/api/files/:id/download', (req, res) => {
  const { id } = req.params;
  const originalFilename = req.query.name as string;

  try {
    const files = fs.readdirSync(filesDir);
    const file = files.find(f => f.startsWith(id));

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(filesDir, file);
    const buffer = fs.readFileSync(filePath);
    const filename = originalFilename || file;

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

app.get('/api/conversations/search', (req, res) => {
  const q = (req.query.q as string || '').toLowerCase();
  
  const convResult = db.exec('SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC');
  let conversations = convResult.length > 0 ? convResult[0].values.map((row: any) => ({
    id: row[0],
    title: row[1],
    created_at: row[2],
    updated_at: row[3]
  })) : [];
  
  if (q) {
    const msgResult = db.exec('SELECT conversation_id, content FROM messages WHERE LOWER(content) LIKE ?', [`%${q}%`]);
    const matchingConvIds = new Set<number>();
    if (msgResult.length > 0) {
      for (const row of msgResult[0].values) {
        matchingConvIds.add(row[0] as number);
      }
    }
    
    conversations = conversations.filter((c: { id: number; title: string }) => 
      c.title.toLowerCase().includes(q) || matchingConvIds.has(c.id)
    );
  }
  
  res.json(conversations);
});

function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&#39;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&nbsp;': ' ',
    '&ndash;': '–',
    '&mdash;': '—',
    '&hellip;': '…',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
  };
  
  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'gi'), char);
  }
  
  decoded = decoded.replace(/&#([0-9]+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  return decoded;
}

function sanitizeFilename(name: string): string {
  if (!name) return 'conversation';
  return name
    .replace(/<[^>]*>/g, '')
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/[\x00-\x1f]/g, '')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 100) || 'conversation';
}

function stripHtml(html: string): string {
  if (!html) return '';
  let text = decodeHtmlEntities(html);
  text = text
    .replace(/<[^>]*>/g, '')
    .replace(/```[\s\S]*?```/gs, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_~`>]/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#[0-9]+;/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text;
}

app.get('/api/export/:id/markdown', (req, res) => {
  const convResult = db.exec('SELECT title, created_at FROM conversations WHERE id = ?', [req.params.id]);
  if (convResult.length === 0 || convResult[0].values.length === 0) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  
  const conv = convResult[0].values[0];
  const convTitle = decodeHtmlEntities(conv[0] as string);
  const createdAt = conv[1] as string;
  
  const msgResult = db.exec('SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC', [req.params.id]);
  const messages = msgResult.length > 0 ? msgResult[0].values.map((row: any) => ({
    role: row[0],
    content: row[1]
  })) : [];
  
  let markdown = `# ${convTitle}\n\n`;
  markdown += `*Created: ${new Date(createdAt).toLocaleString()}*\n\n---\n\n`;
  
  for (const msg of messages) {
    const label = msg.role === 'user' ? '**User**' : '**Assistant**';
    const cleanContent = stripHtml(msg.content);
    markdown += `${label}:\n\n${cleanContent}\n\n---\n\n`;
  }
  
  const filename = sanitizeFilename(convTitle);
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.md"; filename*=UTF-8''${encodeURIComponent(filename)}.md`);
  res.send(markdown);
});

app.get('/api/export/:id/text', (req, res) => {
  const convResult = db.exec('SELECT title, created_at FROM conversations WHERE id = ?', [req.params.id]);
  if (convResult.length === 0 || convResult[0].values.length === 0) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  
  const conv = convResult[0].values[0];
  const convTitle = decodeHtmlEntities(conv[0] as string);
  const createdAt = conv[1] as string;
  
  const msgResult = db.exec('SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC', [req.params.id]);
  const messages = msgResult.length > 0 ? msgResult[0].values.map((row: any) => ({
    role: row[0],
    content: row[1]
  })) : [];
  
  let text = `${convTitle}\n${'='.repeat(convTitle.length)}\n\n`;
  text += `Created: ${new Date(createdAt).toLocaleString()}\n\n`;
  
  for (const msg of messages) {
    const label = msg.role === 'user' ? 'USER' : 'ASSISTANT';
    const cleanContent = stripHtml(msg.content);
    text += `[${label}]\n${cleanContent}\n\n${'─'.repeat(40)}\n\n`;
  }
  
  const filename = sanitizeFilename(convTitle);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.txt"; filename*=UTF-8''${encodeURIComponent(filename)}.txt`);
  res.send(text);
});

app.get('/api/export/:id/json', (req, res) => {
  const convResult = db.exec('SELECT title, created_at FROM conversations WHERE id = ?', [req.params.id]);
  if (convResult.length === 0 || convResult[0].values.length === 0) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  
  const conv = convResult[0].values[0];
  const convTitle = decodeHtmlEntities(conv[0] as string);
  const createdAt = conv[1] as string;
  
  const msgResult = db.exec('SELECT role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC', [req.params.id]);
  const messages = msgResult.length > 0 ? msgResult[0].values.map((row: any) => ({
    role: row[0],
    content: stripHtml(row[1]),
    created_at: row[2]
  })) : [];
  
  const exportData = {
    version: '1.0',
    title: convTitle,
    created_at: createdAt,
    exported_at: new Date().toISOString(),
    messages
  };
  
  const filename = sanitizeFilename(convTitle);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"; filename*=UTF-8''${encodeURIComponent(filename)}.json`);
  res.json(exportData);
});

// Static files
const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

async function startServer() {
  await initDatabase();
  
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Database initialized at: ${dbPath}`);
  });
}

startServer();
