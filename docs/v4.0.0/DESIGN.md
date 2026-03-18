# Version 4.0.0 - Design

## Overview
Enterprise-ready chatbot with authentication, cloud sync, and plugin system.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Cloud Services                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │  Auth API   │  │  Sync API   │  │  Plugin Registry │   │
│  └─────────────┘  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React UI      │────▶│  Express API    │────▶│  OpenRouter     │
│  (Multi-user)   │     │  + Auth + Sync  │     │  (AI Models)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## New Components

### Authentication
- **User Login/Register**: Email + password
- **Session Management**: JWT tokens
- **Password Reset**: Email-based recovery

### Cloud Sync
- **Data Sync**: Sync conversations across devices
- **Conflict Resolution**: Handle sync conflicts
- **Offline Mode**: Work without internet

### Plugin System
- **Plugin API**: Create custom plugins
- **Plugin Marketplace**: Browse/install plugins
- **Built-in Plugins**:
  - Web search
  - Image generation
  - Calculator
  - Calendar

### Admin Dashboard
- **User Management**: View/manage users
- **Usage Analytics**: API usage stats
- **System Health**: Server status

## API Extensions

### Auth Endpoints
```
POST   /api/auth/register     - Create account
POST   /api/auth/login        - Login
POST   /api/auth/logout       - Logout
POST   /api/auth/refresh     - Refresh token
POST   /api/auth/forgot      - Request password reset
POST   /api/auth/reset       - Reset password
```

### Sync Endpoints
```
POST   /api/sync/push        - Upload local changes
GET    /api/sync/pull        - Download remote changes
POST   /api/sync/resolve     - Resolve conflicts
```

### Plugin Endpoints
```
GET    /api/plugins           - List available plugins
POST   /api/plugins/:id      - Install plugin
DELETE /api/plugins/:id       - Uninstall plugin
POST   /api/plugins/:id/exec - Execute plugin
```

### Admin Endpoints
```
GET    /api/admin/users      - List users
GET    /api/admin/usage      - Usage statistics
GET    /api/admin/health     - System health
```

## Database Schema

### New Tables
```sql
-- Users
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,
  created_at DATETIME
);

-- Sessions
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER,
  expires_at DATETIME
);

-- Sync metadata
CREATE TABLE sync_meta (
  user_id INTEGER,
  last_sync DATETIME,
  version INTEGER
);
```

## Security

### Authentication
- Bcrypt password hashing
- JWT access tokens
- Refresh token rotation
- Rate limiting

### Data Protection
- Encryption at rest
- HTTPS only
- CORS configuration
- Input sanitization
