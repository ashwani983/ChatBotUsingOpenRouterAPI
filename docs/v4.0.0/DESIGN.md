# Version 4.0.0 - Design

## Overview
Enhanced chatbot with image generation, vision analysis, canvas editor, and web search integration.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      OpenRouter API                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │  Chat Models │  │  DALL-E   │  │  Vision Models   │   │
│  └─────────────┘  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────┐     ┌─────────────────┐
│   React UI      │────▶│  Express API    │
│  + Canvas       │     │  + File Upload  │
└─────────────────┘     └─────────────────┘
```

## New Components

### Image Generation Panel
- Expandable image generation interface
- Prompt input with style options
- Size selector dropdown
- Generated image gallery
- Regenerate/Edit buttons

### Vision Upload
- Drag & drop zone
- Clipboard paste support
- Image preview thumbnails
- Analysis result display

### Canvas Editor
- Monaco-based code editor
- Language selector
- Split pane layout
- Live preview iframe
- Run/Stop buttons
- Console output panel

### Search Integration
- Bing/SerpAPI integration
- Toggle switch in UI
- Citation formatting
- Source link display

## API Extensions

### Image Endpoints
```
POST   /api/images/generate    - Generate image with DALL-E
GET    /api/images/:id        - Get generated image
POST   /api/images/upload     - Upload image for analysis
```

### File Endpoints
```
POST   /api/files/upload       - Upload file
GET    /api/files/:id         - Download file
DELETE /api/files/:id          - Delete file
```

### Search Endpoints
```
POST   /api/search            - Web search
GET    /api/search/results    - Get search results
```

### Share Endpoints
```
POST   /api/share             - Create shareable link
GET    /api/share/:id        - Get shared conversation
```

## Database Schema

### New Tables
```sql
-- Generated Images
CREATE TABLE images (
  id INTEGER PRIMARY KEY,
  conversation_id INTEGER,
  prompt TEXT,
  url TEXT,
  created_at DATETIME
);

-- Shared Conversations
CREATE TABLE shared_conversations (
  id TEXT PRIMARY KEY,
  conversation_id INTEGER,
  created_at DATETIME,
  view_count INTEGER
);

-- Uploaded Files
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  conversation_id INTEGER,
  filename TEXT,
  mime_type TEXT,
  size INTEGER,
  path TEXT,
  created_at DATETIME
);
```

## UI Layout

### New UI Elements
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Title + Model + Search Toggle + Share + Settings    │
├─────────────┬───────────────────────────────────────────────┤
│             │                                               │
│  Sidebar    │           Main Chat Area                     │
│  - Chats    │           - Messages                         │
│  - Search   │           - Canvas (collapsible)             │
│             │                                               │
├─────────────┴───────────────────────────────────────────────┤
│ Input: Message + Attach + Image Gen + Voice + Send          │
└─────────────────────────────────────────────────────────────┘
```

### Canvas Panel (Collapsible)
```
┌─────────────────────────────────────────────────────────────┐
│ [Code] [Preview]              [Run ▶] [Stop ■] [Expand ⬆] │
├─────────────────────────┬───────────────────────────────────┤
│                         │                                   │
│   Code Editor           │     Live Preview                  │
│   (Monaco)             │     (iframe)                     │
│                         │                                   │
├─────────────────────────┴───────────────────────────────────┤
│ Console Output                                            │
└─────────────────────────────────────────────────────────────┘
```

## External APIs

### DALL-E Integration
- Use OpenRouter's image generation endpoint
- Support for multiple styles
- Store generated images

### Vision API
- Analyze uploaded images
- Multi-image support
- Clipboard image reading

### Web Search
- SerpAPI or DuckDuckGo API
- Rate limiting
- Result caching
