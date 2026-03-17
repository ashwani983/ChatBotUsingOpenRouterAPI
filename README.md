# AI Chat Application

A responsive, full-stack AI chat interface similar to ChatGPT, built with React, Node.js, Express, and OpenRouter API.

## Features

- **Real-time Streaming Responses** - Messages appear token-by-token (typewriter effect)
- **Chat History Sidebar** - View and switch between previous conversations
- **Markdown & Syntax Highlighting** - Code blocks are properly formatted with syntax highlighting
- **Auto-resizing Input** - Text area grows with content, Shift+Enter for new lines
- **Loading States** - Animated "thinking" indicator while waiting for responses
- **Persistent Storage** - Chat history saved to localStorage
- **Dark Theme** - Modern ChatGPT-style dark UI

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- react-markdown (markdown rendering)
- react-syntax-highlighter (code syntax highlighting)

### Backend
- Node.js with Express
- OpenRouter API (free LLM access)
- Server-Sent Events (SSE) for streaming

## Project Structure

```
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── MessageList.tsx   # Chat messages with markdown
│   │   │   └── ChatInput.tsx     # Auto-resizing input
│   │   ├── App.tsx               # Main app with sidebar
│   │   ├── main.tsx              # Entry point
│   │   ├── types.ts              # TypeScript types
│   │   └── index.css             # Global styles
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                  # Express Backend
│   ├── src/
│   │   └── server.ts       # API endpoints with SSE
│   ├── .env                # Environment variables
│   └── package.json
│
├── package.json             # Root scripts
└── README.md
```

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

1. Clone the repository and navigate to the project:
   ```bash
   cd ChatBotUsingOpencodeAPI
   ```

2. Install all dependencies:
   ```bash
   npm run install:all
   ```

   Or install manually:
   ```bash
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

3. Configure environment variables:
   
   Edit `server/.env` and add your OpenRouter API key:
   ```
   OPENROUTER_API_KEY=your_api_key_here
   PORT=3001
   ```

   Get a free API key from: https://openrouter.ai/settings

## Running the Application

### Option 1: Run both server and client together (Recommended)
```bash
npm run dev
```

This starts:
- Backend server on http://localhost:3001
- Frontend on http://localhost:5173

### Option 2: Run separately

Terminal 1 - Server:
```bash
cd server
npm run dev
```

Terminal 2 - Client:
```bash
cd client
npm run dev
```

## Usage

1. Open http://localhost:5173 in your browser
2. Type a message in the input box
3. Press Enter to send, Shift+Enter for new line
4. Click "New Chat" to start a new conversation
5. Previous chats appear in the left sidebar

## Available Free Models

The default model is `meta-llama/llama-3.1-8b-instruct`. You can change it in `server/src/server.ts`:

```typescript
const stream = await openai.chat.completions.create({
  model: 'meta-llama/llama-3.1-8b-instruct',  // Change this
  // other options...
});
```

Other free models available on OpenRouter:
- `google/gemma-2-9b-it`
- `mistralai/mistral-7b-instruct`
- `microsoft/phi-3-mini-128k-instruct`
- `deepseek/deepseek-chat`

## API Endpoints

### POST /api/chat
Send a message and receive streaming response.

**Request:**
```json
{
  "message": "Hello, how are you?"
}
```

**Response:** Server-Sent Events (SSE) stream

### POST /api/chat/reset
Reset the current conversation history.

## Building for Production

```bash
npm run build
```

This builds the client to the `client/dist` folder.

## Troubleshooting

### API Key Error
Make sure your OpenRouter API key is correctly set in `server/.env`

### CORS Error
The server is configured to allow CORS from the development server (localhost:5173)

### Port Already in Use
If port 3001 or 5173 is in use, modify:
- Server: `server/.env` → `PORT=3002`
- Client: `client/vite.config.ts` → change port

## License

MIT
