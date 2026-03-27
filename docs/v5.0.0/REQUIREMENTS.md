# Version 5.0.0 Requirements

## Overview
Version 5.0.0 focuses on **Advanced AI Capabilities** - enabling the AI to use external tools, branch conversations, and provide more intelligent responses.

## High Priority Features

### 1. Function Calling / Tools Integration
**Priority:** P0 - Critical

Enable AI models to use external tools via function calling.

#### Tools to Implement
| Tool | Description | API |
|------|-------------|-----|
| Web Search | Search DuckDuckGo for current info | DuckDuckGo Instant Answer API (free) |
| Calculator | Math expressions | Native JavaScript |
| Current Time | Get date/time | Native JavaScript |
| Wikipedia | Knowledge lookup | Wikipedia API (free) |

#### Requirements
- [ ] Implement tool definitions in OpenAI format
- [ ] Parse tool calls from AI responses
- [ ] Execute tools and return results
- [ ] Continue conversation with tool results
- [ ] Display tool usage in message (e.g., "🔍 Searched for...")

### 2. Conversation Branching
**Priority:** P0 - Critical

Allow non-linear conversations with branching.

#### Requirements
- [ ] Create branch from any message
- [ ] Visual tree view of conversation branches
- [ ] Switch between branches
- [ ] Merge branches (optional)
- [ ] Branch naming/labeling
- [ ] Branch history navigation

### 3. Prompt Templates
**Priority:** P1 - High

Quick-start templates for common use cases.

#### Templates
| Template | Description | System Prompt |
|----------|-------------|---------------|
| Code Review | Review code for bugs/improvements | Review code... |
| Writing | Blog posts, emails, docs | Write professional... |
| Analysis | Data/Topic analysis | Analyze the following... |
| Learning | Educational explanations | Explain like I'm 5... |
| Brainstorm | Creative ideation | Brainstorm ideas for... |

#### Requirements
- [ ] Template gallery UI
- [ ] Create custom templates
- [ ] Edit/delete templates
- [ ] Use template for new conversation
- [ ] Import/export templates

### 4. Proper Public Sharing
**Priority:** P1 - High

Read-only shared view with unique links.

#### Requirements
- [ ] Generate shareable unique link
- [ ] Read-only view without auth
- [ ] Track view count
- [ ] Optional: set expiration
- [ ] Copy link functionality
- [ ] QR code generation (designed in v4, not implemented)

### 5. Web Search Integration
**Priority:** P1 - High

Real-time web search for current information.

#### Requirements
- [ ] Integrate DuckDuckGo API
- [ ] Rate limiting for search
- [ ] Display search results
- [ ] Citation/links in responses
- [ ] Toggle search on/off

## Medium Priority Features

### 6. Multi-file Code Projects
**Priority:** P2 - Medium

Expand Canvas to support multiple files.

#### Requirements
- [ ] File tree sidebar
- [ ] Create/rename/delete files
- [ ] Tab-based editing
- [ ] Inter-file imports
- [ ] Project export as ZIP

### 7. Model Comparison
**Priority:** P2 - Medium

Compare AI responses across models.

#### Requirements
- [ ] Select multiple models
- [ ] Run same prompt across models
- [ ] Side-by-side comparison view
- [ ] Vote/select best response

### 8. Conversation PIN
**Priority:** P3 - Low

Pin important conversations.

#### Requirements
- [ ] Pin/unpin conversations
- [ ] Pinned section at top
- [ ] Quick access to pinned

### 9. Message Annotations
**Priority:** P3 - Low

Add notes to messages.

#### Requirements
- [ ] Add note to any message
- [ ] Display note indicator
- [ ] Edit/delete notes
- [ ] Notes persist with export

## Technical Requirements

### Database Schema Changes
```sql
-- Branches table
CREATE TABLE branches (
  id TEXT PRIMARY KEY,
  conversation_id TEXT,
  parent_message_id TEXT,
  name TEXT,
  created_at DATETIME,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

-- Templates table
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  system_prompt TEXT,
  is_builtin BOOLEAN DEFAULT FALSE,
  created_at DATETIME
);

-- Message annotations table
CREATE TABLE annotations (
  id TEXT PRIMARY KEY,
  message_id TEXT,
  content TEXT,
  created_at DATETIME,
  FOREIGN KEY (message_id) REFERENCES messages(id)
);

-- Pins table
CREATE TABLE pins (
  conversation_id TEXT PRIMARY KEY,
  pinned_at DATETIME,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);
```

### API Changes
```
GET    /api/branches/:conversationId     - List branches
POST   /api/branches                     - Create branch
PUT    /api/branches/:id                 - Update branch
DELETE /api/branches/:id                 - Delete branch

GET    /api/templates                    - List templates
POST   /api/templates                    - Create template
PUT    /api/templates/:id                - Update template
DELETE /api/templates/:id                - Delete template

POST   /api/annotations                 - Add annotation
GET    /api/messages/:id/annotation     - Get annotation
PUT    /api/annotations/:id             - Update annotation
DELETE /api/annotations/:id             - Delete annotation

POST   /api/chat/compare                - Compare models
POST   /api/search                      - Web search
```

## Open Bugs to Fix

| Issue | Description | Priority |
|-------|-------------|----------|
| #18 | Export as markdown, txt, json not working | P1 |
| #19 | Chat title not from user input | P1 |
| #20 | File and image upload not working | P1 |
| #22 | Canvas editor not working/closing | P1 |
| #23 | Canvas run button freezes for JavaScript | P1 |
| #21 | Merge download and share button | P2 |

## Out of Scope

- User authentication (v6)
- Plugin system (v6)
- Multi-user support (v6)
- PWA support (v6)

## Dependencies

### New Dependencies
- `turndown` - HTML to Markdown conversion for search results
- `mathjs` - Advanced calculator functionality
- `jszip` - Multi-file project export

### External APIs
- DuckDuckGo Instant Answer API (free, no key)
- Wikipedia REST API (free, no key)
