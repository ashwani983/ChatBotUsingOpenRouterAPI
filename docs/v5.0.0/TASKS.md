# Version 5.0.0 Tasks

## Bug Fixes (Must Complete First)

### P1 - Critical Bugs
| Task | Issue | Description | Estimate |
|------|-------|-------------|----------|
| [ ] | #18 | Fix export as markdown, txt, json not working | 2h |
| [ ] | #20 | Fix file and image upload not working | 4h |
| [ ] | #22 | Fix Canvas editor not working/closing | 3h |
| [ ] | #23 | Fix Canvas run button freezes for JavaScript | 2h |

### P2 - Medium Priority Bugs
| Task | Issue | Description | Estimate |
|------|-------|-------------|----------|
| [ ] | #19 | Fix chat title not from user input | 1h |
| [ ] | #21 | Merge download and share button | 2h |

---

## Feature: Function Calling / Tools

### Backend: Tool Infrastructure
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | Create ToolKit service (`server/src/services/toolkit.ts`) | 4h | - |
| [ ] | Implement calculator tool with mathjs | 2h | ToolKit |
| [ ] | Implement web search tool (DuckDuckGo) | 4h | ToolKit |
| [ ] | Implement Wikipedia tool | 2h | ToolKit |
| [ ] | Implement current time tool | 1h | ToolKit |
| [ ] | Create tool execution API endpoints | 3h | Tools |
| [ ] | Add rate limiting for external APIs | 2h | APIs |

### Backend: AI Integration
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | Modify `/api/chat` to support tools parameter | 3h | - |
| [ ] | Parse tool calls from AI response | 4h | Chat API |
| [ ] | Execute tools and inject results into conversation | 4h | Parsing |
| [ ] | Handle tool errors gracefully | 2h | Execution |
| [ ] | Log tool usage to database | 2h | Database schema |

### Frontend: Tool UI
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | Create ToolCallUI component | 4h | - |
| [ ] | Display tool calls in message stream | 3h | ToolCallUI |
| [ ] | Show tool loading state | 2h | ToolCallUI |
| [ ] | Display tool results | 3h | Results |
| [ ] | Add tool settings in settings modal | 2h | Settings |

### Testing
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | Write unit tests for tools | 4h | Tools |
| [ ] | Test tool calling flow E2E | 3h | Full stack |

**Subtotal: ~45 hours**

---

## Feature: Conversation Branching

### Backend: Branch API
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | Create branches table migration | 1h | Database |
| [ ] | Create branch_messages junction table | 1h | Database |
| [ ] | Implement GET /api/branches/:id | 2h | Tables |
| [ ] | Implement POST /api/branches | 3h | GET endpoint |
| [ ] | Implement PUT /api/branches/:id | 2h | POST endpoint |
| [ ] | Implement DELETE /api/branches/:id | 2h | PUT endpoint |

### Backend: Branch Logic
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | Copy messages when creating branch | 3h | POST endpoint |
| [ ] | Get messages for specific branch | 2h | Branch API |
| [ ] | Build tree structure from branches | 3h | GET endpoint |

### Frontend: Branch Tree
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | Create BranchTree component | 5h | - |
| [ ] | Visual tree rendering | 4h | Tree component |
| [ ] | Create branch from message | 3h | Tree |
| [ ] | Switch between branches | 3h | Tree |
| [ ] | Rename/delete branches | 2h | Tree |
| [ ] | Branch tree in sidebar | 3h | UI |

### Frontend: Branch Integration
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | Add branch context provider | 3h | - |
| [ ] | Load branches when conversation opens | 2h | Context |
| [ ] | Display current branch in header | 1h | Context |
| [ ] | New message adds to current branch | 2h | Context |

### Testing
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | Write unit tests for branch logic | 3h | Backend |
| [ ] | Test branch UI flow E2E | 3h | Full stack |

**Subtotal: ~38 hours**

---

## Feature: Prompt Templates

### Backend: Template API
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | Create templates table | 1h | Database |
| [ ] | Seed builtin templates | 2h | Table |
| [ ] | Implement template CRUD endpoints | 4h | Table |
| [ ] | Import/export templates JSON | 2h | CRUD |

### Frontend: Template Gallery
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | Create TemplateGallery component | 4h | - |
| [ ] | Display template cards grid | 3h | Gallery |
| [ ] | Template preview modal | 3h | Cards |
| [ ] | Create custom template form | 4h | Gallery |
| [ ] | Edit/delete templates | 2h | Form |

### Frontend: Template Integration
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | Add template to new conversation flow | 3h | - |
| [ ] | Template selector in chat header | 2h | Integration |
| [ ] | Apply template to current conversation | 3h | Selector |

### Testing
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | Test template CRUD | 2h | Backend |
| [ ] | Test template application E2E | 2h | Full stack |

**Subtotal: ~32 hours**

---

## Feature: Public Sharing (Enhanced)

### Backend: Sharing API
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | Generate unique share tokens | 2h | - |
| [ ] | Store share metadata | 1h | Database |
| [ ] | GET /api/share/:token endpoint | 3h | Token |
| [ ] | View count tracking | 1h | Endpoint |
| [ ] | Expiration logic | 2h | Token |

### Frontend: Sharing UI
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | Enhance ExportModal with share tab | 3h | Existing modal |
| [ ] | QR code generation (qrcode.react) | 3h | Modal |
| [ ] | Copy link functionality | 1h | Modal |
| [ ] | Expiration selector | 1h | Modal |

### Frontend: Read-only View
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | Create SharedView route | 2h | - |
| [ ] | Fetch shared conversation | 2h | Route |
| [ ] | Render read-only messages | 3h | View |
| [ ] | View count increment | 1h | View |

### Testing
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | Test sharing E2E | 2h | Full stack |
| [ ] | Test QR code generation | 1h | UI |

**Subtotal: ~22 hours**

---

## Feature: Multi-file Canvas

### Backend
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | Project storage in database | 3h | Database |
| [ ] | Project file CRUD API | 4h | Storage |
| [ ] | ZIP export endpoint | 3h | API |

### Frontend
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | File tree sidebar component | 5h | - |
| [ ] | Tab interface for files | 4h | Tree |
| [ ] | Multi-file Monaco setup | 4h | Tabs |
| [ ] | Cross-file import detection | 3h | Editor |
| [ ] | Project-level run | 3h | Tabs |
| [ ] | Project export as ZIP | 3h | Export |

### Testing
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | Test multi-file editing | 2h | UI |
| [ ] | Test project export | 1h | Export |

**Subtotal: ~28 hours**

---

## Feature: Model Comparison

### Backend
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | POST /api/chat/compare endpoint | 4h | Chat |
| [ ] | Parallel model execution | 3h | Endpoint |

### Frontend
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | Model selector UI | 3h | - |
| [ ] | Side-by-side comparison view | 5h | Selector |
| [ ] | Response comparison cards | 3h | View |
| [ ] | Vote/select best response | 2h | Cards |

**Subtotal: ~17 hours**

---

## Feature: Conversation PIN

### Backend
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | Create pins table | 1h | Database |
| [ ] | Toggle pin API | 2h | Table |

### Frontend
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | Pin/unpin button | 1h | - |
| [ ] | Pinned section in sidebar | 2h | Button |
| [ ] | Visual pin indicator | 1h | UI |

**Subtotal: ~5 hours**

---

## Feature: Message Annotations

### Backend
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | Create annotations table | 1h | Database |
| [ ] | CRUD API for annotations | 3h | Table |

### Frontend
| Task | Description | Estimate | Dependencies |
|------|-------------|----------|-------------|
| [ ] | Add note button on messages | 2h | - |
| [ ] | Note input popover | 2h | Button |
| [ ] | Display note indicator | 1h | Popover |
| [ ] | Note persistence | 1h | API |

**Subtotal: ~10 hours**

---

## Summary

| Feature | Hours |
|---------|-------|
| Bug Fixes | 14h |
| Function Calling/Tools | 45h |
| Conversation Branching | 38h |
| Prompt Templates | 32h |
| Enhanced Sharing | 22h |
| Multi-file Canvas | 28h |
| Model Comparison | 17h |
| Conversation PIN | 5h |
| Message Annotations | 10h |
| **Total** | **~211 hours** |

---

## Milestone

### Sprint 1: Bug Fixes + Core Tools (Week 1-2)
- Fix all P1 bugs
- Fix P2 bugs
- Function Calling infrastructure
- Basic tools (calculator, time)

### Sprint 2: Tools + Branching (Week 3-4)
- Complete all tools
- Conversation branching backend
- Branch tree UI

### Sprint 3: Templates + Sharing (Week 5-6)
- Prompt templates
- Enhanced public sharing
- QR code generation

### Sprint 4: Advanced Features (Week 7-8)
- Multi-file Canvas
- Model comparison
- PINs and annotations

---

## Definition of Done

For each feature:
- [ ] Code complete
- [ ] Unit tests written
- [ ] Integration tested
- [ ] No console errors
- [ ] Responsive on mobile
- [ ] Accessibility tested (keyboard nav)
- [ ] Documentation updated
