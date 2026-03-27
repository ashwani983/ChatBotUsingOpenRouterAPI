# Version 6.0.0 Requirements

## Overview
Version 6.0.0 focuses on **Enterprise Features** - multi-user support, extensibility, and polish. This version transforms the application from a personal tool to a collaborative platform.

## High Priority Features

### 1. User Authentication
**Priority:** P0 - Critical

Local account system for multi-user support.

#### Authentication Methods
| Method | Description |
|--------|-------------|
| Local Password | Username/password with hashing |
| PIN Code | Quick access PIN (for local users) |

#### Requirements
- [ ] User registration with username/password
- [ ] User login/logout
- [ ] Password hashing (bcrypt)
- [ ] Session management
- [ ] User profiles (display name, avatar)
- [ ] Password change/reset
- [ ] Delete account

### 2. Data Export/Import
**Priority:** P0 - Critical

Complete backup and restore functionality.

#### Requirements
- [ ] Export all conversations (JSON)
- [ ] Export all settings
- [ ] Export templates
- [ ] Import from backup file
- [ ] Selective import (choose what to restore)
- [ ] Merge vs replace option
- [ ] Validate import file format

### 3. Plugin System
**Priority:** P0 - Critical

Extensible architecture for custom tools and integrations.

#### Plugin Types
| Type | Description | Example |
|------|-------------|---------|
| Tool Plugin | Custom AI tools | GitHub integration, Calendar |
| UI Plugin | Custom UI components | Custom widgets |
| Export Plugin | Additional export formats | HTML, DOCX |

#### Requirements
- [ ] Plugin manifest schema
- [ ] Plugin installation (file-based)
- [ ] Plugin loading/unloading
- [ ] Plugin API (sandboxed)
- [ ] Plugin settings UI
- [ ] Plugin marketplace (future)

### 4. Advanced Search
**Priority:** P1 - High

Full-text search with filters and highlighting.

#### Requirements
- [ ] Full-text search index
- [ ] Search filters (date, model, conversation)
- [ ] Highlight matches
- [ ] Search suggestions/autocomplete
- [ ] Search history
- [ ] Search within conversation

### 5. External API
**Priority:** P1 - High

REST API for third-party integrations.

#### Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/v1/chat | POST | Send message |
| /api/v1/conversations | GET/POST | List/Create conversations |
| /api/v1/messages | GET | Get messages |
| /api/v1/search | GET | Search conversations |

#### Requirements
- [ ] API key generation
- [ ] API key management UI
- [ ] Rate limiting per key
- [ ] Usage tracking
- [ ] API documentation (OpenAPI/Swagger)

## Medium Priority Features

### 6. PWA Support
**Priority:** P2 - Medium

Progressive Web App for offline access.

#### Requirements
- [ ] Service worker
- [ ] Offline caching
- [ ] Install prompt
- [ ] Push notifications (optional)
- [ ] Background sync
- [ ] App manifest

### 7. Custom Themes
**Priority:** P2 - Medium

Theme customization and marketplace.

#### Requirements
- [ ] Theme selector UI
- [ ] Built-in themes (dark, light, system)
- [ ] Custom CSS injection
- [ ] Theme preview
- [ ] Share themes (future)
- [ ] Theme import/export

### 8. Team Workspaces
**Priority:** P2 - Medium

Shared workspaces for organizations.

#### Requirements
- [ ] Create workspace
- [ ] Invite members
- [ ] Role-based permissions
- [ ] Shared templates
- [ ] Shared conversations
- [ ] Activity log

### 9. Usage Analytics
**Priority:** P3 - Low

Token usage and cost tracking.

#### Requirements
- [ ] Track token usage per conversation
- [ ] Track API costs
- [ ] Daily/weekly/monthly reports
- [ ] Model usage breakdown
- [ ] Export analytics data

### 10. Auto-save Drafts
**Priority:** P3 - Low

Automatic draft saving for messages.

#### Requirements
- [ ] Save draft every 5 seconds
- [ ] Restore draft on page load
- [ ] Clear draft on send
- [ ] Draft indicator
- [ ] Multiple draft slots

## Out of Scope

- Cloud sync (not planned)
- Real-time collaboration (v7)
- Video generation (v7)
- Voice calls (v7)
- Mobile app (future)

## Technical Requirements

### Database Schema Changes

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- API Keys table
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  name TEXT,
  rate_limit INTEGER DEFAULT 100,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Plugins table
CREATE TABLE plugins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  manifest TEXT NOT NULL, -- JSON
  enabled BOOLEAN DEFAULT TRUE,
  settings TEXT, -- JSON
  installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Workspaces table
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Workspace members
CREATE TABLE workspace_members (
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'member', -- 'owner', 'admin', 'member'
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (workspace_id, user_id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Usage analytics
CREATE TABLE usage_stats (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  conversation_id TEXT,
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_cents INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
);

-- Search index
CREATE VIRTUAL TABLE search_index USING fts5(
  content,
  conversation_id,
  message_id,
  tokenize='porter'
);
```

### API Changes

```
Auth:
POST   /api/auth/register      - Register user
POST   /api/auth/login         - Login
POST   /api/auth/logout        - Logout
GET    /api/auth/me            - Get current user
PUT    /api/auth/password      - Change password

API Keys:
GET    /api/keys               - List keys
POST   /api/keys               - Generate key
DELETE /api/keys/:id           - Revoke key

Plugins:
GET    /api/plugins            - List plugins
POST   /api/plugins/upload     - Install plugin
PUT    /api/plugins/:id        - Update plugin settings
DELETE /api/plugins/:id        - Uninstall plugin

Workspaces:
GET    /api/workspaces         - List workspaces
POST   /api/workspaces         - Create workspace
PUT    /api/workspaces/:id     - Update workspace
DELETE /api/workspaces/:id     - Delete workspace
POST   /api/workspaces/:id/invite - Invite member
DELETE /api/workspaces/:id/members/:userId - Remove member

Analytics:
GET    /api/analytics         - Get usage stats
GET    /api/analytics/export   - Export analytics

Export/Import:
POST   /api/export/backup      - Full backup
POST   /api/import/backup     - Import backup

v1 API (External):
POST   /api/v1/chat           - Send message
GET    /api/v1/conversations  - List conversations
POST   /api/v1/conversations  - Create conversation
GET    /api/v1/messages       - Get messages
GET    /api/v1/search          - Search
```

## Dependencies

### New Dependencies
- `bcrypt` - Password hashing
- `express-session` or `cookie-session` - Session management
- `openapi-typescript` - API types
- `workbox` - PWA service worker
- `better-sqlite3` - Better SQLite performance (replace sql.js)

### Optional Dependencies
- `swagger-ui-express` - API documentation
- `ws` - WebSocket for real-time (future)
