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
const dataDir = path.join(home, '.chatbot');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, 'chatbot.db');

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
    ['system_prompt', 'You are a helpful AI assistant. You provide clear, concise, and accurate responses. When providing code examples, use proper formatting and explain your reasoning.']
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

if (!apiKey) {
  const configPath = path.join(home, '.chatbotrc');
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

if (!apiKey) {
  console.error('ERROR: OpenRouter API key not found. Please set OPENROUTER_API_KEY environment variable or create ~/.chatbotrc config file.');
  console.error('Example config file: echo \'{"apiKey": "your_api_key"}\' > ~/.chatbotrc');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

const AVAILABLE_MODELS = [
  { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', provider: 'Meta' },
  { id: 'google/gemma-2-9b-it', name: 'Gemma 2 9B', provider: 'Google' },
  { id: 'mistralai/mistral-7b-instruct', name: 'Mistral 7B', provider: 'Mistral' },
  { id: 'microsoft/phi-3-mini-128k-instruct', name: 'Phi 3 Mini', provider: 'Microsoft' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek' },
];

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:3001',
    'X-Title': 'AI Chat',
  },
});

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
    
    const firstWord = assistantMessage.split(' ')[0].toLowerCase();
    if (firstWord && assistantMessage.length > 20) {
      db.run('UPDATE conversations SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
        [firstWord.charAt(0).toUpperCase() + firstWord.slice(1) + (assistantMessage.length > 20 ? '...' : ''), convId]);
    }
    
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
