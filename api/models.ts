import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const models = [
    { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', provider: 'Meta' },
    { id: 'google/gemma-2-9b-it', name: 'Gemma 2 9B', provider: 'Google' },
    { id: 'mistralai/mistral-7b-instruct', name: 'Mistral 7B', provider: 'Mistral' },
    { id: 'microsoft/phi-3-mini-128k-instruct', name: 'Phi 3 Mini', provider: 'Microsoft' },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek' },
  ];
  
  res.json(models);
}