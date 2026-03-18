# Version 2.0.0 - Design

## Overview
Enhanced chatbot with persistent storage, multiple models, theme support, and improved user experience.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React UI      │────▶│  Express API    │────▶│  OpenRouter     │
│  (LocalStorage) │     │  + SQLite       │     │  (Multiple AI)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## New Architecture Components

### Database Layer
- **Technology**: SQLite (better-sqlite3)
- **Location**: User data directory (~/.chatbot/data.db)
- **Schema**: conversations, messages, settings

### API Extensions
- `/api/conversations` - CRUD for conversations
- `/api/messages` - CRUD for messages
- `/api/models` - List available models
- `/api/settings` - User preferences
- `/api/health` - Health check

## UI Design

### Layout Improvements
- Sidebar for conversations list
- Collapsible sidebar
- Settings panel/modal
- Model selector dropdown

### Theme Support

#### Light Theme
- Background: #FFFFFF
- Surface: #F3F4F6
- Primary: #3B82F6
- Text: #1F2937

#### Dark Theme
- Background: #1F2937
- Surface: #374151
- Primary: #3B82F6
- Text: #FFFFFF

### New Components
- Theme toggle button
- Model selector dropdown
- Conversation list item
- Settings panel
- Message action buttons (copy, delete)

## API Design

### New Endpoints

#### Conversations
```
GET    /api/conversations     - List all conversations
POST   /api/conversations     - Create new conversation
GET    /api/conversations/:id - Get conversation
PUT    /api/conversations/:id - Rename conversation
DELETE /api/conversations/:id - Delete conversation
```

#### Messages
```
GET    /api/conversations/:id/messages - Get messages for conversation
DELETE /api/messages/:id              - Delete message
```

#### Settings
```
GET    /api/settings    - Get user settings
PUT    /api/settings    - Update user settings
```

#### Models
```
GET /api/models - List available AI models
```

## Configuration

### Database
- Location: `~/.chatbot/data.db`
- Auto-creation on first run
- Schema migrations

### Settings Storage
- Theme preference
- Selected model
- Temperature
- Max tokens
- Custom system prompt
