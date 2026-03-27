# Version 4.0.0 - Design

## Overview
Enhanced chatbot with canvas editor, vision analysis, file handling, and sharing - all achievable with free OpenRouter API.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Free Vision Model                          │
│              nvidia/nemotron-nano-12b-v2-vl               │
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

### File Handling
- Upload PDFs, images, code files
- Local file processing
- File preview
- Download capability

## API Extensions

### Vision Endpoints
```
POST   /api/vision/analyze    - Analyze uploaded image
POST   /api/files/upload     - Upload file
GET    /api/files/:id        - Download file
DELETE /api/files/:id        - Delete file
```

### Share Endpoints
```
POST   /api/share             - Create shareable link
GET    /api/share/:id        - Get shared conversation
```

## Database Schema

### New Tables
```sql
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

### Canvas Panel (Collapsible)
```
┌─────────────────────────────────────────────────────────────┐
│ [Code] [Preview]              [Run ▶] [Clear] [Expand ⬆] │
├─────────────────────────┬───────────────────────────────────┤
│                         │                                   │
│   Code Editor           │     Live Preview                  │
│   (Monaco)             │     (iframe)                     │
│                         │                                   │
├─────────────────────────┴───────────────────────────────────┤
│ Console Output                                            │
│ > console.log("Hello")                                    │
└─────────────────────────────────────────────────────────────┘
```

### Vision Upload UI
```
┌─────────────────────────────────────────────────────────────┐
│  📷 Drop image here or paste from clipboard               │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              [Image Preview]                          │  │
│  └─────────────────────────────────────────────────────┘  │
│  [Analyze Image]                                          │
└─────────────────────────────────────────────────────────────┘
```

## External Services

### Vision Model (Free)
- Use `nvidia/nemotron-nano-12b-v2-vl`
- No additional API cost
- Supports: OCR, document understanding, image analysis

### Canvas Execution
- Browser-based JavaScript sandbox
- Uses iframe with restricted permissions
- Console output captured and displayed
