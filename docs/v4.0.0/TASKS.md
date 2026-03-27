# Version 4.0.0 - Tasks

## Phase 1: Image Generation (DALL-E)

### Backend
- [ ] Add DALL-E integration to OpenRouter
- [ ] Create `/api/images/generate` endpoint
- [ ] Store generated images metadata
- [ ] Add image model to settings

### Frontend
- [ ] Create image generator panel/modal
- [ ] Add style and size selectors
- [ ] Display generated images in chat
- [ ] Add regenerate/edit options
- [ ] Image gallery in conversation

## Phase 2: Vision (Image Analysis)

### Backend
- [ ] Create `/api/images/upload` endpoint
- [ ] Support image formats (jpg, png, webp, gif)
- [ ] Image compression for large files
- [ ] Vision analysis integration

### Frontend
- [ ] Drag & drop upload zone
- [ ] Clipboard paste support
- [ ] Image preview thumbnails
- [ ] Multi-image upload UI
- [ ] Analysis result display

## Phase 3: Canvas Editor

### Backend
- [ ] Add code execution sandbox
- [ ] Support JavaScript execution
- [ ] Console output capture
- [ ] Timeout handling

### Frontend
- [ ] Integrate Monaco editor
- [ ] Split pane layout
- [ ] Language selector
- [ ] Live preview iframe
- [ ] Run/Stop controls
- [ ] Console output panel
- [ ] Collapsible panel

## Phase 4: File Handling

### Backend
- [ ] Create `/api/files/upload` endpoint
- [ ] Support PDF, images, code files
- [ ] File storage management
- [ ] Download endpoint

### Frontend
- [ ] File attachment UI
- [ ] Progress indicator
- [ ] File preview
- [ ] Download buttons

## Phase 5: Web Search

### Backend
- [ ] Integrate search API
- [ ] Create `/api/search` endpoint
- [ ] Result caching
- [ ] Citation formatting

### Frontend
- [ ] Search toggle switch
- [ ] Results display with citations
- [ ] Source links
- [ ] Loading state

## Phase 6: Sharing

### Backend
- [ ] Create `/api/share` endpoint
- [ ] Generate unique share IDs
- [ ] Public view endpoint
- [ ] View count tracking

### Frontend
- [ ] Share button in header
- [ ] Copy link functionality
- [ ] QR code generation
- [ ] Shared conversation view

## Phase 7: UI Enhancements

### Frontend
- [ ] Message grouping by date
- [ ] Branch conversations UI
- [ ] Toast notifications
- [ ] Loading skeletons
- [ ] Better mobile layout
- [ ] Panel drag resize
- [ ] Smooth animations
- [ ] Empty states

## Phase 8: Polish

### Testing
- [ ] Image generation flow
- [ ] Vision upload/analysis
- [ ] Canvas code execution
- [ ] File upload/download
- [ ] Search integration
- [ ] Share functionality

### Performance
- [ ] Lazy load images
- [ ] Virtual scrolling
- [ ] Image compression
- [ ] Debounced inputs
