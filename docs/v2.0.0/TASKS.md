# Version 2.0.0 - Tasks

## Phase 1: Database & Backend (Week 1)

### Database Setup
- [ ] Add better-sqlite3 dependency
- [ ] Create database initialization script
- [ ] Design schema (conversations, messages, settings)
- [ ] Create database migrations

### Backend API
- [ ] Implement /api/conversations endpoints
- [ ] Implement /api/messages endpoints
- [ ] Implement /api/settings endpoints
- [ ] Implement /api/models endpoint
- [ ] Implement /api/health endpoint

### Server Updates
- [ ] Update server to use compiled JS with SQLite
- [ ] Add model switching logic
- [ ] Add settings management
- [ ] Add logging system

## Phase 2: Frontend UI (Week 2)

### Theme Support
- [ ] Create theme context
- [ ] Add dark/light theme styles
- [ ] Implement theme toggle
- [ ] Persist theme in localStorage

### Conversation Management
- [ ] Create sidebar with conversation list
- [ ] Add new conversation button
- [ ] Add conversation rename
- [ ] Add conversation delete (X icon)
- [ ] Add clear all history
- [ ] Add message delete

### Settings Panel
- [ ] Create settings modal/panel
- [ ] Add model selector dropdown
- [ ] Add temperature slider
- [ ] Add max tokens input
- [ ] Add system prompt textarea

### UI Enhancements
- [ ] Add typing indicator
- [ ] Add message status
- [ ] Add copy to clipboard
- [ ] Improve loading states
- [ ] Add keyboard shortcuts

## Phase 3: CLI Commands (Week 3)

### New CLI Commands
- [ ] Implement `chatbot status`
- [ ] Implement `chatbot stop`
- [ ] Implement `chatbot restart`
- [ ] Implement `chatbot logs`
- [ ] Add port flag: `--port`

### Server Management
- [ ] Add PID file for server
- [ ] Add status check functionality
- [ ] Add graceful shutdown

## Phase 4: Testing & Polish (Week 4)

### Testing
- [ ] Test all API endpoints
- [ ] Test conversation CRUD
- [ ] Test settings persistence
- [ ] Test theme switching
- [ ] Test error handling

### Polish
- [ ] Optimize bundle size
- [ ] Improve error messages
- [ ] Update documentation
- [ ] Create migration guide
