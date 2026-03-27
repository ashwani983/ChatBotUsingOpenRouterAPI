# Version 5.0.0 Design Document

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Client (React + Vite)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │   App.tsx    │  │  MessageList  │  │   ChatInput   │  │    Canvas    │   │
│  │  (Context)   │  │  (Branching)  │  │   (Templates) │  │ (Multi-file) │   │
│  └──────────────┘  └───────────────┘  └───────────────┘  └───────────────┘   │
│                                                                              │
│  ┌──────────────────────┐  ┌────────────────────┐  ┌──────────────────┐  │
│  │   BranchTree.tsx     │  │  TemplateGallery    │  │   ToolCallUI      │  │
│  │   (Visual Tree)      │  │   (Template Select)  │  │   (Search/Calc)   │  │
│  └──────────────────────┘  └────────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Server (Express + TypeScript)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        API Routes                                     │    │
│  │  /api/chat              - Streaming with tool calls                 │    │
│  │  /api/tools/*           - Tool execution endpoints                  │    │
│  │  /api/branches/*        - Conversation branching                    │    │
│  │  /api/templates/*      - Prompt templates                          │    │
│  │  /api/search            - Web search (DuckDuckGo)                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Database   │  │   ToolKit    │  │ SearchService│  │   AIClient   │    │
│  │   (SQLite)   │  │ (Calculator, │  │ (DuckDuckGo,│  │ (OpenRouter  │    │
│  │              │  │  Wikipedia)  │  │  Wikipedia) │  │  + Tools)    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. ToolCallUI Component

#### Purpose
Display tool usage in messages when AI calls a function.

#### Location
`client/src/components/ToolCallUI.tsx`

#### Props
```typescript
interface ToolCallUIProps {
  toolName: string;
  toolArgs: Record<string, any>;
  toolResult: any;
  isLoading: boolean;
  onCancel?: () => void;
}
```

#### UI States
```
┌────────────────────────────────────────────────────────┐
│ 🔍 Web Search                                         │
├────────────────────────────────────────────────────────┤
│ Query: "latest AI news 2024"                          │
│ ─────────────────────────────────────────────────────│
│ [Loading spinner] Searching...                        │
│                                                        │
│ OR                                                    │
│                                                        │
│ ✓ Found 5 results                                     │
│ • Result 1: Title - Description...                   │
│ • Result 2: Title - Description...                   │
│ • Result 3: Title - Description...                   │
└────────────────────────────────────────────────────────┘
```

#### States
- **Loading**: Spinner with "Searching..." / "Calculating..."
- **Success**: Expandable result display
- **Error**: Error message with retry button

---

### 2. BranchTree Component

#### Purpose
Visual tree view of conversation branches.

#### Location
`client/src/components/BranchTree.tsx`

#### Data Structure
```typescript
interface BranchNode {
  id: string;
  messagePreview: string;
  timestamp: Date;
  children: BranchNode[];
  isActive: boolean;
  isMainBranch: boolean;
}
```

#### UI Design
```
┌─────────────────────────────────────┐
│ 🌳 Conversation Branches            │
├─────────────────────────────────────┤
│ ▼ Main Branch                       │
│   └─ "How do I fix..."              │
│       ├─ ▼ Branch: "Use CSS"        │
│       │    └─ "Try this..."          │
│       └─ ▼ Branch: "Use JS"         │
│            └─ "Alternative..."      │
│                                     │
│ ▼ Branch: "Alternative 1"           │
│   └─ "Another approach..."          │
└─────────────────────────────────────┘
```

#### Interactions
- Click branch: Switch to that branch
- Right-click: Context menu (rename, delete, merge)
- Drag & drop: Reorder branches (future)
- Collapse/expand toggle

---

### 3. TemplateGallery Component

#### Purpose
Browse and select prompt templates.

#### Location
`client/src/components/TemplateGallery.tsx`

#### UI Design
```
┌─────────────────────────────────────────────────────────┐
│ ✨ Prompt Templates                              [×]   │
├─────────────────────────────────────────────────────────┤
│ ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│ │  📝     │  │  🔍     │  │  ✍️     │  │  💡     │   │
│ │  Code   │  │ Analysis │  │ Writing │  │Brainstorm│   │
│ │  Review │  │          │  │         │  │         │   │
│ └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ Custom Templates                                     ││
│ │ + Create New                                        ││
│ └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

#### Features
- Built-in templates (read-only)
- Custom templates (editable)
- Template preview
- Use template button
- Import/Export

---

### 4. Multi-file Canvas

#### Purpose
Expand Canvas to support multiple files in a project.

#### Location
`client/src/components/Canvas.tsx` (enhanced)

#### UI Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ 📁 Project Files    │ ▼ app.js          │ ▼ utils.js     [×]    │
├─────────────────────┼───────────────────────────────────────────┤
│ ▼ src/              │                                           │
│   ├─ app.js         │ 1│ function calculate() {                 │
│   ▼ utils/         │ 2│   const x = 10;                        │
│     ├─ helpers.js   │ 3│   return x * 2;                       │
│     └─ math.js      │ 4│ }                                       │
│                     │                                           │
│ + New File          │                                           │
├─────────────────────┴───────────────────────────────────────────┤
│ ▶ Run    [▶] JavaScript ▼                    [Clear] [Export]   │
├─────────────────────────────────────────────────────────────────┤
│ Output:                                                           │
│ > 20                                                              │
└─────────────────────────────────────────────────────────────────┘
```

#### Features
- File tree with folder support
- Tab interface for multiple files
- Cross-file imports
- Project-level search
- ZIP export of project

---

### 5. Export Modal (Merged)

#### Purpose
Combined export and share functionality (Issue #21).

#### Location
`client/src/components/ExportModal.tsx` (renamed from ShareModal)

#### UI Design
```
┌─────────────────────────────────────────────────────────────────┐
│ 📤 Export & Share                                         [×]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📥 Download                                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  [Markdown]  [Text]  [JSON]  [PDF]                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  🔗 Share                                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ☑️ Generate shareable link                                │ │
│  │  ┌───────────────────────────────────────────┐             │ │
│  │  │ https://chatbot.link/s/abc123             │ [📋 Copy]   │ │
│  │  └───────────────────────────────────────────┘             │ │
│  │                                                           │ │
│  │  Expiration: [Never ▼]                                    │ │
│  │                                                           │ │
│  │  [Generate QR Code]                                       │ │
│  │  ┌─────────────┐                                          │ │
│  │  │  ▓▓▓▓▓▓▓▓   │                                          │ │
│  │  │  ▓      ▓   │                                          │ │
│  │  │  ▓  QR  ▓   │                                          │ │
│  │  │  ▓      ▓   │                                          │ │
│  │  │  ▓▓▓▓▓▓▓▓   │                                          │ │
│  │  └─────────────┘                                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                                              [Cancel]  [Export] │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Design

### 1. Tool Execution API

#### POST /api/tools/web-search
```typescript
// Request
{
  "query": "latest AI news 2024"
}

// Response
{
  "results": [
    {
      "title": "Article Title",
      "url": "https://example.com/article",
      "description": "Brief description...",
      "source": "Source Name"
    }
  ],
  "count": 5
}
```

#### POST /api/tools/calculate
```typescript
// Request
{
  "expression": "sqrt(16) + pow(2, 3)"
}

// Response
{
  "result": 12,
  "expression": "sqrt(16) + pow(2, 3)",
  "steps": ["sqrt(16) = 4", "pow(2, 3) = 8", "4 + 8 = 12"]
}
```

#### POST /api/tools/wikipedia
```typescript
// Request
{
  "query": "Artificial Intelligence",
  "limit": 3
}

// Response
{
  "results": [
    {
      "title": "Artificial Intelligence",
      "extract": "Brief extract...",
      "url": "https://en.wikipedia.org/wiki/Artificial_intelligence"
    }
  ]
}
```

### 2. Branching API

#### GET /api/branches/:conversationId
```typescript
// Response
{
  "branches": [
    {
      "id": "branch-123",
      "name": "CSS approach",
      "parentMessageId": "msg-456",
      "createdAt": "2024-01-15T10:30:00Z",
      "messageCount": 5
    }
  ],
  "tree": {
    // Hierarchical structure
  }
}
```

#### POST /api/branches
```typescript
// Request
{
  "conversationId": "conv-123",
  "fromMessageId": "msg-456",
  "name": "New Branch"
}

// Response
{
  "id": "branch-789",
  "conversationId": "conv-123",
  "name": "New Branch",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### 3. Template API

#### GET /api/templates
```typescript
// Response
{
  "builtin": [
    {
      "id": "code-review",
      "name": "Code Review",
      "description": "Review code for bugs and improvements",
      "systemPrompt": "You are a code reviewer..."
    }
  ],
  "custom": [
    // User-created templates
  ]
}
```

---

## Database Schema

### New Tables

```sql
-- Branches table
CREATE TABLE branches (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  parent_message_id TEXT NOT NULL,
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Branch messages junction
CREATE TABLE branch_messages (
  branch_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  PRIMARY KEY (branch_id, message_id),
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Templates table
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  is_builtin BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Annotations table
CREATE TABLE annotations (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Pins table
CREATE TABLE pins (
  conversation_id TEXT PRIMARY KEY,
  pinned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Tool usage log
CREATE TABLE tool_usage (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  tool_args TEXT, -- JSON
  tool_result TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);
```

### Indexes
```sql
CREATE INDEX idx_branches_conversation ON branches(conversation_id);
CREATE INDEX idx_annotations_message ON annotations(message_id);
CREATE INDEX idx_tool_usage_message ON tool_usage(message_id);
```

---

## State Management

### New Contexts

```typescript
// BranchContext.tsx
interface BranchContextType {
  branches: Branch[];
  activeBranch: Branch | null;
  tree: BranchTree;
  createBranch: (fromMessageId: string, name?: string) => Promise<Branch>;
  switchBranch: (branchId: string) => void;
  deleteBranch: (branchId: string) => void;
  renameBranch: (branchId: string, name: string) => void;
}

// TemplateContext.tsx
interface TemplateContextType {
  templates: Template[];
  builtinTemplates: Template[];
  createTemplate: (template: TemplateInput) => Promise<Template>;
  updateTemplate: (id: string, template: TemplateInput) => Promise<Template>;
  deleteTemplate: (id: string) => Promise<void>;
}

// ToolContext.tsx
interface ToolContextType {
  availableTools: Tool[];
  toolResults: Map<string, ToolResult>;
  executeTool: (toolName: string, args: any) => Promise<ToolResult>;
  isExecuting: boolean;
}
```

---

## Error Handling

### Tool Errors
```typescript
// Error types
enum ToolErrorType {
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  EXECUTION_ERROR = 'EXECUTION_ERROR',
  TIMEOUT = 'TIMEOUT'
}

// User-friendly error messages
const TOOL_ERROR_MESSAGES = {
  [ToolErrorType.RATE_LIMIT]: 'Search rate limit reached. Please wait a moment.',
  [ToolErrorType.NETWORK_ERROR]: 'Unable to connect. Check your internet.',
  [ToolErrorType.INVALID_INPUT]: 'Invalid search query. Try different keywords.',
  [ToolErrorType.EXECUTION_ERROR]: 'Calculation error. Check your expression.',
  [ToolErrorType.TIMEOUT]: 'Request timed out. Please try again.'
};
```

---

## Performance Considerations

### Lazy Loading
- Load tool results on-demand
- Virtualize branch tree for large conversations
- Lazy-load template preview

### Caching
- Cache search results for 5 minutes
- Cache Wikipedia lookups for 1 hour
- LocalStorage for recent tool results

### Rate Limiting
- Search: 1 request/second, 100/day
- Wikipedia: 10 requests/second
- Tool execution: No limit (client-side)

---

## Testing Strategy

### Unit Tests
- Tool execution functions
- Branch tree manipulation
- Template validation

### Integration Tests
- API endpoints
- Database operations
- AI tool calling flow

### E2E Tests
- Full conversation with tools
- Branch creation and switching
- Export functionality
