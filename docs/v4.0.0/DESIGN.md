# Version 4.0.0 - Design

## Overview
Enhanced chatbot with canvas editor, vision, function calling, audio support, and conversation branching - all achievable with free OpenRouter API.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenRouter Free Router                          │
│                    openrouter/free                             │
├─────────────────────────────────────────────────────────────┤
│  Capabilities: Chat, Vision, Audio, Tools, Reasoning          │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Custom Tools (Free APIs)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│  │ Web Search │  │ Calculator │  │ Wikipedia API   │    │
│  │ (DuckDuckGo)│ │            │  │               │    │
│  └─────────────┘  └─────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────┐     ┌─────────────────┐
│   React UI      │────▶│  Express API    │
│  + Canvas       │     │  + File Upload │
└─────────────────┘     └─────────────────┘
```

## New Components

### Canvas Editor Panel
- Monaco-based code editor
- JavaScript execution sandbox (browser-based)
- Live preview iframe
- Console output capture
- Split pane layout

### Vision Upload
- Drag & drop zone
- Clipboard paste support
- Free vision model: NVIDIA Nemotron VL
- Image analysis results in chat

### Function Calling Tools
Built-in tools that the AI can use:

```
┌─────────────────────────────────────────────────────────────┐
│ Tool: web_search                                            │
│ "Search the web for current information"                  │
│ Input: { query: string }                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Tool: calculator                                          │
│ "Perform mathematical calculations"                        │
│ Input: { expression: string }                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Tool: get_current_time                                    │
│ "Get the current date and time"                           │
│ Input: { timezone?: string }                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Tool: wikipedia_search                                    │
│ "Search Wikipedia for information"                         │
│ Input: { query: string }                                  │
└─────────────────────────────────────────────────────────────┘
```

### Audio Support
- Audio file upload (wav, mp3, ogg, flac)
- TTS voice selection
- Audio playback controls

### Conversation Branching
```
Conversation: "Project Ideas"
│
├── Branch: "Mobile App" (child)
│   └── Messages...
│
├── Branch: "Web App" (child)
│   ├── Branch: "React" (grandchild)
│   └── Branch: "Vue" (grandchild)
│
└── Main thread continues...
```

### Prompt Templates
```
Categories:
├── Coding
│   ├── Code Review
│   ├── Debug Helper
│   └── Explain Code
├── Writing
│   ├── Email Writer
│   ├── Blog Post
│   └── Summary
└── Creative
    ├── Story Writer
    └── Poem Generator
```

## API Extensions

### Vision Endpoints
```
POST   /api/vision/analyze    - Analyze uploaded image
POST   /api/files/upload     - Upload file
GET    /api/files/:id        - Download file
DELETE /api/files/:id        - Delete file
```

### Tool Endpoints
```
POST   /api/tools/search    - Web search
GET    /api/tools/calculate  - Calculator
GET    /api/tools/time      - Get current time
POST   /api/tools/wikipedia - Wikipedia search
```

### Share Endpoints
```
POST   /api/share             - Create shareable link
GET    /api/share/:id        - Get shared conversation
```

## Database Schema

### New Tables
```sql
-- Conversation Branches
CREATE TABLE conversation_branches (
  id INTEGER PRIMARY KEY,
  parent_id INTEGER,
  conversation_id INTEGER,
  title TEXT,
  created_at DATETIME
);

-- Prompt Templates
CREATE TABLE prompt_templates (
  id INTEGER PRIMARY KEY,
  category TEXT,
  name TEXT,
  content TEXT,
  created_at DATETIME
);

-- Shared Conversations
CREATE TABLE shared_conversations (
  id TEXT PRIMARY KEY,
  conversation_id INTEGER,
  created_at DATETIME,
  view_count INTEGER
);

-- User Memory/Notes
CREATE TABLE user_memory (
  id INTEGER PRIMARY KEY,
  conversation_id INTEGER,
  note TEXT,
  pinned BOOLEAN,
  created_at DATETIME
);
```

## UI Layout

### Tool Calling UI
```
┌─────────────────────────────────────────────────────────────┐
│ 💬 Hello! I can help you with various tasks.               │
│                                                             │
│ 🔧 Used tools:                                              │
│    • web_search: "latest AI news 2026"                    │
│    • calculator: 25 * 4 + 10 = 110                      │
│    • get_current_time: March 28, 2026, 3:45 PM           │
│                                                             │
│ Here's the latest AI news...                               │
└─────────────────────────────────────────────────────────────┘
```

### Branching UI
```
┌─────────────┬───────────────────────────────────────────────┐
│ 📁 Project │                                               │
│  ├── 📄 Main│           Chat Area                         │
│  │         │                                               │
│  ├── 🌳 Mobile│  [Current branch: Mobile App]              │
│  │    ├── iOS│                                               │
│  │    └── Andr│                                               │
│  └── 🌳 Web  │                                               │
│       ├── React│                                               │
│       └── Vue │                                               │
│             │                                               │
│  [+ Branch] │                                               │
└─────────────┴───────────────────────────────────────────────┘
```

### Prompt Templates UI
```
┌─────────────────────────────────────────────────────────────┐
│ 📝 Prompt Templates                                      │
├─────────────────────────────────────────────────────────────┤
│ [Coding ▼] [Writing ▼] [Creative ▼] [All ▼]              │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 📝 Code Review                                        │  │
│ │ "Review my code and suggest improvements..."          │  │
│ │ [Use Template]                                       │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 📝 Debug Helper                                       │  │
│ │ "Help me debug this code..."                         │  │
│ │ [Use Template]                                       │  │
│ └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## External Services (All Free)

### Web Search
- DuckDuckGo Instant Answer API (free)
- No API key required

### Vision
- Use `nvidia/nemotron-nano-12b-v2-vl` (free)

### Audio
- Browser Web Speech API (free)
- OpenRouter audio-capable models

### Wikipedia
- Wikipedia API (free, no key)
