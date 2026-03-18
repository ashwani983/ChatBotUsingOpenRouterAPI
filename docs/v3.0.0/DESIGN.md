# Version 3.0.0 - Design

## Overview
Enhanced chatbot with improved UX, voice features, and export capabilities.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React UI      │────▶│  Express API    │────▶│  OpenRouter     │
│  (Enhanced)     │     │  + SQLite      │     │  (AI Models)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │
        ▼
┌─────────────────┐
│  Voice Services │
│  (Web Speech)  │
└─────────────────┘
```

## New Components

### Voice Features
- **Speech-to-Text**: Use Web Speech API for voice input
- **Text-to-Speech**: Read AI responses aloud
- **Microphone Button**: In chat input

### Export Features
- **Markdown Export**: Export conversation as .md file
- **PDF Export**: Generate PDF of conversation
- **Copy to Clipboard**: One-click copy

### Search
- **Conversation Search**: Search through all conversations
- **Message Search**: Find specific messages

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| Ctrl+Enter | Send message |
| Ctrl+Shift+N | New conversation |
| Ctrl+/ | Show shortcuts |
| Escape | Close modal |

## UI Improvements

### Typing Indicator
- Show "AI is typing..." with animation
- Typing status in sidebar

### Message Actions
- Copy message button
- Regenerate response button
- Message reactions (👍 👎)

### Code Features
- Code execution preview
- Copy code button
- Language detection

## API Extensions

### New Endpoints
```
GET  /api/conversations/search?q=keyword  - Search conversations
POST /api/export/:id/markdown           - Export as Markdown
POST /api/export/:id/pdf                - Export as PDF
```

## Settings Extensions

### New Settings
- `voice_enabled`: Enable voice input/output
- `tts_enabled`: Text-to-speech toggle
- `language`: Interface language
- `font_size`: Chat font size
- `code_auto_run`: Auto-run code snippets
