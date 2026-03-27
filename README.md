# AI Chat Application

A responsive, full-stack AI chat interface similar to ChatGPT, built with React, Node.js, Express, and OpenRouter API.

![Chat Application Screenshot](screenshot/chatbot-using-the-operoute.png)

## v4.0.0 Features

### Canvas Editor
- **Monaco Editor** - Full-featured code editor with syntax highlighting
- **Multi-Language Support** - JavaScript, HTML, CSS
- **Live Preview** - See your code run in real-time
- **Console Output** - Debug with console.log support

### Vision (Image Analysis)
- **AI Image Analysis** - Free NVIDIA vision model
- **Drag & Drop** - Easy image upload
- **Clipboard Paste** - Paste images directly
- **Analysis in Chat** - Results appear in conversation

### File Handling
- **File Upload** - PDF, images, code files
- **Progress Indicator** - See upload progress
- **File Preview** - View before downloading

### Sharing
- **Share Conversations** - Generate unique links
- **Copy Link** - Easy sharing functionality
- **View Tracking** - See how many views

### UI Enhancements
- **Toast Notifications** - Non-intrusive alerts
- **Loading Skeletons** - Better loading states
- **Smooth Animations** - Polished transitions
- **Enhanced Empty States** - Better onboarding

### Voice Features
- **Voice Input** - Click the microphone button to speak
- **Text-to-Speech** - AI responses read aloud
- **Multiple Languages** - 10+ interface languages

### Export & Search
- **Conversation Search** - Find by title or content
- **Export Options** - Markdown, Text, or PDF
- **Persistent History** - SQLite database

### Keyboard Shortcuts
- `Enter` - Send message
- `Ctrl+Enter` - Send message
- `↑/↓` - Navigate input history
- `Ctrl+Shift+N` - New conversation
- `Escape` - Close modal
- `?` - Show shortcuts

---

## Quick Start (CLI)

Install the ChatBot CLI and start chatting in minutes:

### Option 1: Install from GitHub Release (Recommended)

**Linux/macOS:**
```bash
# Download and install the latest release
sudo npm install -g https://github.com/ashwani983/ChatBotUsingOpenRouterAPI/releases/download/v4.0.0/ai-chatbot-cli-4.0.0.tgz

# Configure your API key
chatbot config

# Start the ChatBot
chatbot
```

**Windows (PowerShell or Command Prompt):**
```powershell
# Download and install the latest release
npm install -g https://github.com/ashwani983/ChatBotUsingOpenRouterAPI/releases/download/v4.0.0/ai-chatbot-cli-4.0.0.tgz

# Configure your API key
chatbot config

# Start the ChatBot
chatbot
```

Then open http://localhost:3001 in your browser.

---

## Installation Steps by Platform

### Prerequisites
- Node.js 18 or higher
- npm (comes with Node.js)

### Step 1: Install the CLI

**Linux:**
```bash
sudo npm install -g https://github.com/ashwani983/ChatBotUsingOpenRouterAPI/releases/download/v4.0.0/ai-chatbot-cli-4.0.0.tgz
```

**macOS:**
```bash
sudo npm install -g https://github.com/ashwani983/ChatBotUsingOpenRouterAPI/releases/download/v4.0.0/ai-chatbot-cli-4.0.0.tgz
```

**Windows:**
```cmd
npm install -g https://github.com/ashwani983/ChatBotUsingOpenRouterAPI/releases/download/v4.0.0/ai-chatbot-cli-4.0.0.tgz
```

### Step 2: Configure Your API Key

Get a free API key from: https://openrouter.ai/settings

**Option A - Interactive (Recommended):**
```bash
chatbot config
```

**Option B - Environment Variable:**
```bash
# Linux/macOS
export OPENROUTER_API_KEY=your_api_key_here

# Windows (Command Prompt)
set OPENROUTER_API_KEY=your_api_key_here

# Windows (PowerShell)
$env:OPENROUTER_API_KEY="your_api_key_here"
```

**Option C - Config File:**
```bash
# Linux/macOS
echo '{"apiKey": "your_api_key_here"}' > ~/.chatbotrc

# Windows (Command Prompt)
echo {"apiKey": "your_api_key_here"} > %USERPROFILE%\.chatbotrc

# Windows (PowerShell)
echo '{"apiKey": "your_api_key_here"}' | Out-File -FilePath "$env:USERPROFILE\.chatbotrc"
```

### Step 3: Start the ChatBot

```bash
chatbot
```

The server will start in the background. Open **http://localhost:3001** in your browser.

### Step 4: Stop the Server

Press `Ctrl+C` in the terminal to stop the server.

---

## CLI Commands

| Command | Description |
|---------|-------------|
| `chatbot` | Start the ChatBot server |
| `chatbot start` | Start the ChatBot server |
| `chatbot stop` | Stop the running server |
| `chatbot status` | Show server status |
| `chatbot restart` | Restart the server |
| `chatbot config` | Configure API key interactively |
| `chatbot help` | Show help message |

**Options:**
- `--port <number>` - Specify port (default: 3001)

---

## Troubleshooting

### "command not found" on Windows
If the `chatbot` command is not found after installation, you may need to:
1. Restart your terminal
2. Or add npm global path to your PATH: `npm config get prefix`

### API Key Error
- Make sure your OpenRouter API key is correctly set
- Run `chatbot config` to reconfigure
- Check https://openrouter.ai/settings for your key

### Port Already in Use
If port 3001 is in use, you can:
1. Kill the process using port 3001, or
2. Set a different port: `chatbot --port 3002`

### Server Not Starting
Make sure you have:
- Node.js 18+ installed: `node --version`
- npm installed: `npm --version`

---

## Development Setup (Building from Source)

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ashwani983/ChatBotUsingOpenRouterAPI.git
cd ChatBotUsingOpenRouterAPI
```

2. Install all dependencies:
```bash
cd server && npm install
cd ../client && npm install
```

3. Build the project:
```bash
npm run build
```

4. Configure environment variables:
Edit `server/.env` and add your OpenRouter API key:
```
OPENROUTER_API_KEY=your_api_key_here
PORT=3001
```

### Running

```bash
chatbot
```

Or for development:
```bash
npm run dev:server  # Start server with hot reload
npm run dev:client  # Start client dev server
```

Open http://localhost:3001 in your browser.

---

## Available Free Models

The default model is `meta-llama/llama-3.1-8b-instruct`. You can change it in the Settings panel:

Other free models available on OpenRouter:
- `google/gemma-2-9b-it`
- `mistralai/mistral-7b-instruct`
- `microsoft/phi-3-mini-128k-instruct`
- `deepseek/deepseek-chat`

---

## Changelog

### v4.0.0 (2026-03-28)
- Added Canvas Editor with Monaco editor
- Added Vision (Image Analysis) with NVIDIA model
- Added File Upload/Download functionality
- Added Conversation Sharing with links
- Added Toast notifications
- Added Loading skeletons
- Added Lazy load images
- Added Debounce hooks for performance

### v3.0.0 (2026-03-28)
- Added voice input with Web Speech API
- Added text-to-speech for AI responses
- Added conversation search
- Added export as Markdown/Text/PDF
- Added message reactions (like/dislike)
- Added regenerate response feature
- Added enhanced code blocks with copy button
- Added keyboard shortcuts modal
- Added input history navigation
- Added font size adjustment
- Added accessibility improvements (ARIA, focus management)
- Added screen reader support

### v2.0.0 (2024-03-18)
- Added SQLite database for persistence
- Added dark/light theme toggle
- Added settings panel with model selection
- Added temperature and max tokens controls
- Added system prompt customization
- Added CLI commands (start, stop, status, restart)
- Added conversation management (rename, delete, clear all)
- Added message delete functionality

### v1.0.0 (2024-03-17)
- Initial release
- Basic chat functionality with OpenRouter API
- Simple UI with message history

---

## License

MIT
