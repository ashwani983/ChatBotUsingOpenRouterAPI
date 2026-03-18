# Version 1.0.0 - Design

## Overview
AI Chat CLI using OpenRouter API - A ChatGPT-like interface with React frontend and Express backend.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   React UI      │────▶│  Express API    │────▶ OpenRouter
│  (Static Build) │◀────│  (Port 3001)    │
└─────────────────┘     └─────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Markdown**: react-markdown, react-syntax-highlighter

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **AI SDK**: OpenAI (with OpenRouter base URL)

### Deployment
- **Package**: npm global package
- **Binary**: CLI entry point

## UI Design

### Layout
- Single page chat interface
- Fixed header with title
- Scrollable message area
- Fixed input area at bottom

### Visual Design

#### Color Palette
- Primary: Blue (#3B82F6)
- Background: Dark (#1F2937)
- Surface: Gray (#374151)
- User Message: Blue (#2563EB)
- Assistant Message: Gray (#4B5563)
- Text: White (#FFFFFF)

#### Typography
- Font Family: System UI / Sans-serif
- Code Font: Monospace

#### Components
- Chat messages with avatar
- Markdown rendering
- Code block with syntax highlighting
- Input field with send button

## API Design

### Endpoints

#### POST /api/chat
Send message and receive streaming response.

**Request:**
```json
{
  "message": "Hello"
}
```

**Response:** Server-Sent Events (SSE) stream

#### POST /api/chat/reset
Reset conversation history.

**Response:**
```json
{
  "success": true
}
```

## Configuration

### API Key Storage
- Environment variable: `OPENROUTER_API_KEY`
- Config file: `~/.chatbotrc`
- CLI interactive: `chatbot config`

### Server
- Default port: 3001
- CORS enabled for localhost:5173
