# Version 4.0.0 - Tasks

## Phase 1: Canvas Editor

### Backend
- [ ] Create sandbox endpoint (optional, can be client-side)
- [ ] Add code execution timeout handling

### Frontend
- [ ] Integrate Monaco editor
- [ ] Create collapsible canvas panel
- [ ] JavaScript sandbox execution
- [ ] Live preview iframe
- [ ] Console output panel
- [ ] Language selector
- [ ] Run/Clear buttons
- [ ] Split pane layout

## Phase 2: Vision (Image Analysis)

### Backend
- [ ] Create `/api/vision/analyze` endpoint
- [ ] Integrate free vision model (NVIDIA Nemotron VL)
- [ ] Support image formats (jpg, png, webp, gif)
- [ ] Image compression for large files

### Frontend
- [ ] Drag & drop upload zone
- [ ] Clipboard paste support
- [ ] Image preview thumbnails
- [ ] Vision toggle in input area
- [ ] Analysis result display in chat

## Phase 3: File Handling

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

## Phase 4: Sharing

### Backend
- [ ] Create `/api/share` endpoint
- [ ] Generate unique share IDs
- [ ] Public view endpoint
- [ ] View count tracking

### Frontend
- [ ] Share button in header
- [ ] Copy link functionality
- [ ] QR code generation
- [ ] Shared conversation view (read-only)

## Phase 5: UI Enhancements

### Frontend
- [ ] Message grouping by date
- [ ] Toast notifications
- [ ] Loading skeletons
- [ ] Better mobile layout
- [ ] Panel drag resize
- [ ] Smooth animations
- [ ] Empty states

## Phase 6: Polish

### Testing
- [ ] Canvas code execution
- [ ] Vision upload/analysis
- [ ] File upload/download
- [ ] Share functionality

### Performance
- [ ] Lazy load images
- [ ] Virtual scrolling
- [ ] Image compression
- [ ] Debounced inputs
