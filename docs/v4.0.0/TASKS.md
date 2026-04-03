# Version 4.0.0 - Tasks

## Phase 1: Canvas Editor ✅

### Backend
- [x] Create sandbox endpoint (optional, can be client-side)
- [x] Add code execution timeout handling

### Frontend
- [x] Integrate Monaco editor
- [x] Create collapsible canvas panel
- [x] JavaScript sandbox execution
- [x] Live preview iframe
- [x] Console output panel
- [x] Language selector
- [x] Run/Clear buttons
- [x] Split pane layout

## Phase 2: Vision (Image Analysis) ✅

### Backend
- [x] Create `/api/vision/analyze` endpoint
- [x] Integrate free vision model (NVIDIA Nemotron VL)
- [x] Support image formats (jpg, png, webp, gif)
- [x] Image compression for large files

### Frontend
- [x] Drag & drop upload zone
- [x] Clipboard paste support
- [x] Image preview thumbnails
- [x] Vision toggle in input area
- [x] Analysis result display in chat

## Phase 3: File Handling ✅

### Backend
- [x] Create `/api/files/upload` endpoint
- [x] Support PDF, images, code files
- [x] File storage management
- [x] Download endpoint

### Frontend
- [x] File attachment UI
- [x] Progress indicator
- [x] File preview
- [x] Download buttons

## Phase 4: Sharing ✅

### Backend
- [x] Create `/api/share` endpoint
- [x] Generate unique share IDs
- [x] Public view endpoint
- [x] View count tracking

### Frontend
- [x] Share button in header
- [x] Copy link functionality
- [x] QR code generation
- [x] Shared conversation view (read-only)

## Phase 5: UI Enhancements ✅

### Frontend
- [x] Toast notifications
- [x] Loading skeletons
- [x] Better empty states
- [x] Smooth animations
- [x] Message grouping by date
- [x] Better mobile layout
- [x] Panel drag resize

## Phase 6: Polish ✅

### Testing
- [x] Canvas code execution
- [x] Vision upload/analysis
- [x] File upload/download
- [x] Share functionality

### Performance
- [x] Lazy load images (LazyImage component)
- - Virtual scrolling (VirtualList component)
- [x] Image compression
- [x] Debounced inputs (useDebounce hook)

## Version 4.3.x - User Isolation & Deployment ✅

### Database & Backend
- [x] Connect Vercel Postgres (Neon) database
- [x] Add user_id column to conversations table
- [x] Implement user isolation in all API endpoints
- [x] Auto-cleanup: delete conversations older than 7 days
- [x] Limit messages per conversation to 100

### User Isolation (API)
- [x] conversations.ts - filter by user_id
- [x] chat.ts - filter by user_id
- [x] conversations/[id].ts - filter by user_id
- [x] conversations/[id]/messages.ts - filter by user_id
- [x] messages/[id].ts - filter by user_id
- [x] settings.ts - user-specific settings

### Frontend
- [x] User API key input in Settings modal
- [x] Mobile-friendly: sidebar overlay on mobile
- [x] Hide Canvas editor on mobile (hidden md:block)
- [x] Add X-API-Key header to settings fetch

### Bug Fixes
- [x] Fix first 8 chars of API key - all users same (changed to 16 chars)

## Remaining v4.0.0 Tasks (from GitHub Issues)

### Open Bugs (High Priority)
- [x] #23 - Bug: Canvas run button causes page freeze for JavaScript (Added setTimeout to prevent blocking)
- [x] #22 - Bug: Canvas editor not working and closing unexpectedly (editor appears fully functional)
- [x] #20 - Bug: File and image upload not working (Added Vercel API routes: /api/files/upload, /api/files/[id], /api/vision)

### Open Features
- [x] #21 - Feature: Merge download and share button (Combined into one dropdown menu)
