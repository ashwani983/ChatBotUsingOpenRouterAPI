import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const home = process.env.HOME || process.env.USERPROFILE || '';
const dataDir = path.join(home, '.chatbot');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, 'data.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT 'New Chat',
    model TEXT DEFAULT 'meta-llama/llama-3.1-8b-instruct',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

const defaultSettings = [
  ['theme', 'dark'],
  ['model', 'meta-llama/llama-3.1-8b-instruct'],
  ['temperature', '0.7'],
  ['max_tokens', '2048'],
  ['system_prompt', 'You are a helpful AI assistant. You provide clear, concise, and accurate responses. When providing code examples, use proper formatting and explain your reasoning.']
];

const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
for (const [key, value] of defaultSettings) {
  insertSetting.run(key, value);
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
  const conversations = db.prepare(`
    SELECT id, title, model, created_at, updated_at 
    FROM conversations 
    ORDER BY updated_at DESC
  `).all();
  res.json(conversations);
});

app.post('/api/conversations', (req, res) => {
  const result = db.prepare(`
    INSERT INTO conversations (title, model) VALUES (?, ?)
  `).run('New Chat', 'meta-llama/llama-3.1-8b-instruct');
  
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(result.lastInsertRowid);
  res.json(conversation);
});

app.get('/api/conversations/:id', (req, res) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  res.json(conversation);
});

app.put('/api/conversations/:id', (req, res) => {
  const { title } = req.body;
  db.prepare(`
    UPDATE conversations SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(title, req.params.id);
  
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
  res.json(conversation);
});

app.delete('/api/conversations/:id', (req, res) => {
  db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(req.params.id);
  db.prepare('DELETE FROM conversations WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.delete('/api/conversations', (req, res) => {
  db.prepare('DELETE FROM messages').run();
  db.prepare('DELETE FROM conversations').run();
  res.json({ success: true });
});

app.get('/api/conversations/:id/messages', (req, res) => {
  const messages = db.prepare(`
    SELECT id, role, content, created_at 
    FROM messages 
    WHERE conversation_id = ? 
    ORDER BY created_at ASC
  `).all(req.params.id);
  res.json(messages);
});

app.delete('/api/messages/:id', (req, res) => {
  db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/settings', (req, res) => {
  const settings = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settingsObj: Record<string, string> = {};
  for (const s of settings) {
    settingsObj[s.key] = s.value;
  }
  res.json(settingsObj);
});

app.put('/api/settings', (req, res) => {
  const updates = req.body;
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  
  for (const [key, value] of Object.entries(updates)) {
    stmt.run(key, String(value));
  }
  
  res.json({ success: true });
});

app.post('/api/chat', async (req, res) => {
  const { message, conversationId, model, temperature, max_tokens, system_prompt } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  let convId = conversationId;
  if (!convId) {
    const result = db.prepare('INSERT INTO conversations (title, model) VALUES (?, ?)').run('New Chat', model || 'meta-llama/llama-3.1-8b-instruct');
    convId = result.lastInsertRowid;
  }

  const settingGet = db.prepare('SELECT value FROM settings WHERE key = ?') as any;
  const sysPromptSetting = settingGet.get('system_prompt') as { value: string } | undefined;
  const modelSetting = settingGet.get('model') as { value: string } | undefined;
  const tempSetting = settingGet.get('temperature') as { value: string } | undefined;
  const maxTokensSetting = settingGet.get('max_tokens') as { value: string } | undefined;
  
  const sysPrompt = system_prompt || sysPromptSetting?.value || 'You are a helpful AI assistant.';
  const modelUsed = model || modelSetting?.value || 'meta-llama/llama-3.1-8b-instruct';
  const temp = temperature || parseFloat(tempSetting?.value || '0.7');
  const maxTok = max_tokens || parseInt(maxTokensSetting?.value || '2048');

  const dbMessages = db.prepare(`
    SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC
  `).all(convId);

  const messages: { role: string; content: string }[] = [
    { role: 'system', content: sysPrompt },
    ...dbMessages.map((m: any) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message }
  ];

  db.prepare('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)').run(convId, 'user', message);

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

    db.prepare('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)').run(convId, 'assistant', assistantMessage);
    
    const firstWord = assistantMessage.split(' ')[0].toLowerCase();
    if (firstWord && assistantMessage.length > 20) {
      db.prepare('UPDATE conversations SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(firstWord.charAt(0).toUpperCase() + firstWord.slice(1) + (assistantMessage.length > 20 ? '...' : ''), convId);
    }

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
    db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(conversationId);
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database initialized at: ${dbPath}`);
});
