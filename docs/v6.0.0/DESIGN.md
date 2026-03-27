# Version 6.0.0 Design Document

## Architecture Overview

### Multi-User Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                Load Balancer                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│     Server 1        │  │     Server 2        │  │     Server 3        │
│  (Express + TS)     │  │  (Express + TS)     │  │  (Express + TS)     │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
              │                      │                      │
              └──────────────────────┼──────────────────────┘
                                     ▼
                         ┌─────────────────────┐
                         │   SQLite/SQLite3    │
                         │   (Multi-user DB)   │
                         └─────────────────────┘
```

### Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│  Login   │────▶│ Validate │────▶│  Issue   │
│          │     │   Form   │     │ Password │     │  Session  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                                               │
     │                                               ▼
     │              ┌──────────┐     ┌──────────┐     ┌──────────┐
     │              │  Check   │◀────│  Store   │◀────│  Cookie  │
     └─────────────▶│  Session │     │  Session │     │  Header  │
                    └──────────┘     └──────────┘     └──────────┘
```

---

## Component Design

### 1. Auth Components

#### LoginForm Component
```typescript
interface LoginFormProps {
  onSuccess: () => void;
  onRegisterClick: () => void;
}
```

```
┌─────────────────────────────────────────────────────────────────┐
│                     🔐 Sign In                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Username or Email                                              │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Password                                                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                         👁                                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ☐ Remember me                                                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                      Sign In                              │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────│
│  Don't have an account? [Register]                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### RegisterForm Component
```typescript
interface RegisterFormProps {
  onSuccess: () => void;
  onLoginClick: () => void;
}
```

```
┌─────────────────────────────────────────────────────────────────┐
│                     📝 Create Account                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Username *                                                    │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Email (optional)                                              │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Password *                                                    │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                         👁                                │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ✓ At least 8 characters                                       │
│  ✓ Contains number                                            │
│  ✓ Contains special character                                  │
│                                                                 │
│  Confirm Password *                                            │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                         👁                                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                     Create Account                       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────│
│  Already have an account? [Sign In]                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2. User Profile Component

```typescript
interface ProfileSettingsProps {
  user: User;
  onUpdate: (data: Partial<User>) => void;
}
```

```
┌─────────────────────────────────────────────────────────────────┐
│                     👤 Profile Settings                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐                                                    │
│  │    👤   │  [Change Avatar]                                  │
│  └─────────┘                                                    │
│                                                                 │
│  Display Name                                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ John Doe                                                 │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Username (cannot be changed)                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ johndoe                                    [🔒 Locked]   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Email                                                          │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ john@example.com                                        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────│
│                                                                 │
│  Change Password                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Current Password                                        │  │
│  │                                                         │  │
│  │ New Password                                            │  │
│  │                                                         │  │
│  │ Confirm New Password                                    │  │
│  │                                                         │  │
│  │                    [Update Password]                     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │            ⚠️ Delete Account                             │  │
│  │  This action cannot be undone. All your data will be    │  │
│  │  permanently deleted.                                   │  │
│  │                    [Delete My Account]                   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3. Plugin System

#### Plugin Manifest Schema
```typescript
interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  entry: string;           // Entry point file
  permissions: string[];    // Required permissions
  tools?: ToolDefinition[]; // If adds AI tools
  ui?: UIExtension[];       // If adds UI components
  settings?: SettingDefinition[];
}
```

#### Plugin Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                     Plugin Architecture                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐│
│  │                    Plugin Container                        ││
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   ││
│  │  │ Plugin  │  │ Plugin  │  │ Plugin  │  │ Plugin  │   ││
│  │  │   #1    │  │   #2    │  │   #3    │  │   #n    │   ││
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘   ││
│  └───────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐│
│  │                    Plugin API (Sandboxed)                 ││
│  │  - readFile()     - writeFile()     - getSettings()     ││
│  │  - setSettings()  - callTool()      - addTool()         ││
│  │  - addUI()        - onEvent()       - log()             ││
│  └───────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐│
│  │                    Main Application                        ││
│  └───────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

#### Plugin Manager UI
```
┌─────────────────────────────────────────────────────────────────┐
│                     🔌 Plugin Manager                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Installed Plugins                                             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  🟢 GitHub Integration                    v1.2.0   [⚙️] │  │
│  │     Sync issues and PRs as conversations                 │  │
│  │     [Disable] [Remove]                                  │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │  🔴 Calendar Plugin                      v2.0.1   [⚙️] │  │
│  │     Schedule events from chat                           │  │
│  │     [Enable] [Remove]                                   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Available Plugins                                             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  📊 Notion Integration                   v1.0.0   [➕]  │  │
│  │     Sync notes and databases with Notion               │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │  📅 Google Calendar                    v1.5.0   [➕]   │  │
│  │     Create and manage calendar events                  │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │  📝 Export to DOCX                      v1.0.0   [➕]  │  │
│  │     Export conversations as Word documents             │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Install from File                                             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │            📁 Choose plugin file...                     │  │
│  │                                                         │  │
│  │                    [Install Plugin]                     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4. API Key Management

```
┌─────────────────────────────────────────────────────────────────┐
│                     🔑 API Keys                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Your API keys allow external applications to access your      │
│  chatbot data. Keep your keys secure!                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Key Name          │ Created      │ Last Used  │ Rate  │  │
│  ├───────────────────┼──────────────┼───────────┼───────┤  │
│  │  Home Assistant   │ 2024-01-15   │ 2h ago    │ 100/m │  │
│  │  [👁] [📋] [🗑️]                              │        │  │
│  ├───────────────────┼──────────────┼───────────┼───────┤  │
│  │  Node-RED         │ 2024-01-10   │ 1d ago    │ 50/m  │  │
│  │  [👁] [📋] [🗑️]                              │        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Create New Key                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Key Name                                                │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │                                                 │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │                                                            │  │
│  │  Rate Limit: [100 requests/minute ▼]                     │  │
│  │                                                            │  │
│  │                    [Generate Key]                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  ⚠️ New API Key Created                                   │  │
│  │                                                            │  │
│  │  Copy your API key now. You won't be able to see it     │  │
│  │  again!                                                   │  │
│  │                                                            │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │ sk_live_abc123...xyz789                        │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │                    [📋 Copy to Clipboard]                 │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5. Export/Import Modal

```
┌─────────────────────────────────────────────────────────────────┐
│                     💾 Backup & Restore                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Backup]  [Restore]  [Settings]                               │
│                                                                 │
│  ─────────────────────────────────────────────────────────────│
│                                                                 │
│  📤 Export Backup                                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  ☑️ Conversations                                        │  │
│  │  ☑️ Settings & Preferences                               │  │
│  │  ☑️ Custom Templates                                      │  │
│  │  ☐ Usage Analytics                                       │  │
│  │  ☐ Plugin Configurations                                 │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Format: [JSON ▼]                                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                 [Download Backup]                        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────│
│                                                                 │
│  📥 Import Backup                                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │           📁 Drop backup file here or                  │  │
│  │              [Browse Files]                              │  │
│  │                                                         │  │
│  │           Supported: .json                              │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Import Options:                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  ○ Replace all existing data                           │  │
│  │  ○ Merge with existing data (skip duplicates)          │  │
│  │  ○ Import to new account (if creating)                 │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    [Preview Import]                       │  │
│  │                    [Start Import]                        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Design

### Authentication API

#### POST /api/auth/register
```typescript
// Request
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

// Response (201)
{
  "user": {
    "id": "user-123",
    "username": "johndoe",
    "email": "john@example.com",
    "displayName": null,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "token": "session-token-abc"
}
```

#### POST /api/auth/login
```typescript
// Request
{
  "username": "johndoe",
  "password": "SecurePass123!",
  "rememberMe": true
}

// Response (200)
{
  "user": { ... },
  "token": "session-token-abc",
  "expiresAt": "2024-02-15T10:30:00Z"
}
```

### External API (v1)

#### Authentication
```typescript
// Include API key in header
Authorization: Bearer sk_live_abc123...xyz789

// Or in query parameter
?api_key=sk_live_abc123...xyz789
```

#### POST /api/v1/chat
```typescript
// Request
{
  "model": "anthropic/claude-3-haiku",
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "stream": true,
  "temperature": 0.7
}

// Response (SSE stream)
event: message
data: {"content": "Hello", "done": false}

event: message
data: {"content": " there!", "done": false}

event: done
data: {"usage": {"inputTokens": 10, "outputTokens": 5}}
```

---

## Database Schema

### User Management Tables

```sql
-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  settings TEXT DEFAULT '{}', -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Sessions
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- API Keys
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  key_prefix TEXT NOT NULL, -- For display (e.g., "sk_live_abc...")
  rate_limit INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- Update existing tables to link to users
ALTER TABLE conversations ADD COLUMN user_id TEXT;
ALTER TABLE conversations ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE messages ADD COLUMN user_id TEXT;
ALTER TABLE messages ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE settings ADD COLUMN user_id TEXT UNIQUE;
ALTER TABLE settings ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

### Plugin Tables

```sql
-- Plugins
CREATE TABLE plugins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  author TEXT,
  description TEXT,
  manifest TEXT NOT NULL, -- JSON
  enabled BOOLEAN DEFAULT TRUE,
  settings TEXT DEFAULT '{}', -- JSON
  user_id TEXT,
  is_global BOOLEAN DEFAULT FALSE, -- System-wide plugin
  installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_plugins_user ON plugins(user_id);
CREATE INDEX idx_plugins_enabled ON plugins(enabled);

-- Plugin events/logs
CREATE TABLE plugin_logs (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  level TEXT NOT NULL, -- info, warn, error
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
);
```

### Analytics Tables

```sql
-- Usage tracking
CREATE TABLE usage_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  api_key_id TEXT,
  conversation_id TEXT,
  model TEXT NOT NULL,
  operation TEXT NOT NULL, -- chat, search, etc.
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_cents INTEGER,
  latency_ms INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
);

CREATE INDEX idx_usage_user ON usage_logs(user_id);
CREATE INDEX idx_usage_date ON usage_logs(created_at);
CREATE INDEX idx_usage_model ON usage_logs(model);
```

---

## PWA Configuration

### Service Worker Strategy

```javascript
// sw.js - Workbox configuration

// Cache strategies:
// - Static assets: CacheFirst (1 year)
// - API calls: NetworkFirst (fallback to cache)
// - Images: StaleWhileRevalidate

// Precache app shell
precacheAndRoute(self.__WB_MANIFEST);

// Runtime caching
registerRoute(
  ({ request }) => request.destination === 'style' ||
                  request.destination === 'script',
  new CacheFirst({ cacheName: 'static-resources' })
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({ 
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3
  })
);
```

### App Manifest

```json
{
  "name": "AI ChatBot",
  "short_name": "ChatBot",
  "description": "Chat with AI using OpenRouter API",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#6366f1",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "categories": ["productivity", "utilities"],
  "shortcuts": [
    { "name": "New Chat", "url": "/?new=true", "description": "Start a new conversation" }
  ]
}
```

---

## Security Considerations

### Password Storage
```typescript
// Using bcrypt
const saltRounds = 12;
const hash = await bcrypt.hash(password, saltRounds);
const isValid = await bcrypt.compare(password, hash);
```

### Session Security
- HTTP-only cookies
- Secure flag in production
- SameSite=Strict
- Session expiration: 7 days (remember), 24h (default)
- Rotate session token on login

### API Key Security
- Store only hash of API key
- Prefix for identification (don't reveal full key)
- Rate limiting per key
- Usage logging

### Plugin Sandbox
- No filesystem access outside plugin directory
- No network requests (except allowed APIs)
- Timeout for plugin operations
- Memory limits

---

## Migration Strategy

### From v5 to v6
1. Add users table
2. Migrate existing data to first user
3. Add user_id to all tables
4. Update authentication middleware
5. Update frontend auth flow
6. Test with existing data

### Data Migration Script
```typescript
// migrations/v6-add-users.ts
async function migrate() {
  // 1. Create default user from existing data
  const defaultUser = await createDefaultUser();
  
  // 2. Update all tables with user_id
  await db.run('UPDATE conversations SET user_id = ?', [defaultUser.id]);
  await db.run('UPDATE messages SET user_id = ?', [defaultUser.id]);
  await db.run('UPDATE settings SET user_id = ?', [defaultUser.id]);
  
  // 3. Create search index
  await createSearchIndex();
  
  // 4. Verify migration
  const counts = await db.get('SELECT count(*) as total FROM conversations WHERE user_id = ?', [defaultUser.id]);
  console.log(`Migrated ${counts.total} conversations`);
}
```
