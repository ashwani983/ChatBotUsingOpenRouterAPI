import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:5173',
    'X-Title': 'AI Chat',
  },
});

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const chatHistory: Message[] = [
  {
    role: 'system',
    content: 'You are a helpful AI assistant. You provide clear, concise, and accurate responses. When providing code examples, use proper formatting and explain your reasoning.',
  },
];

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  chatHistory.push({ role: 'user', content: message });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const stream = await openai.chat.completions.create({
      model: 'meta-llama/llama-3.1-8b-instruct',
      messages: chatHistory,
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

    chatHistory.push({ role: 'assistant', content: assistantMessage });
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('OpenRouter API error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Failed to get response' })}\n\n`);
    res.end();
  }
});

app.post('/api/chat/reset', (req, res) => {
  chatHistory.length = 0;
  chatHistory.push({
    role: 'system',
    content: 'You are a helpful AI assistant. You provide clear, concise, and accurate responses. When providing code examples, use proper formatting and explain your reasoning.',
  });
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
