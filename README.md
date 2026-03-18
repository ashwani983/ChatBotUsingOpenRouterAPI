# AI Chat Application

A responsive, full-stack AI chat interface similar to ChatGPT, built with React, Node.js, Express, and OpenRouter API.

![Chat Application Screenshot](screenshot/chatbot-using-the-operoute.png)

## v2.0.0 Features

- **Multiple AI Models** - Switch between Llama, Gemma, Mistral, Phi-3, DeepSeek
- **Chat History** - Persistent conversations stored in SQLite
- **Dark/Light Theme** - Toggle between dark and light modes
- **Settings Panel** - Customize temperature, max tokens, system prompt
- **Server Management** - `chatbot start`, `stop`, `status`, `restart` commands
- **Custom Port** - `chatbot --port 3002`

## Quick Start (CLI)

Install the ChatBot CLI and start chatting in minutes:

### Option 1: Install from GitHub Release (Recommended)

**Linux/macOS:**
```bash
# Download and install the latest release
sudo npm install -g https://github.com/ashwani983/ChatBotUsingOpenRouterAPI/releases/download/v2.0.0/ai-chatbot-cli-2.0.0.tgz

# Configure your API key
chatbot config

# Start the ChatBot
chatbot
```

**Windows (PowerShell or Command Prompt):**
```powershell
# Download and install the latest release
npm install -g https://github.com/ashwani983/ChatBotUsingOpenRouterAPI/releases/download/v2.0.0/ai-chatbot-cli-2.0.0.tgz

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
sudo npm install -g https://github.com/ashwani983/ChatBotUsingOpenRouterAPI/releases/download/v2.0.0/ai-chatbot-cli-2.0.0.tgz
```

**macOS:**
```bash
sudo npm install -g https://github.com/ashwani983/ChatBotUsingOpenRouterAPI/releases/download/v2.0.0/ai-chatbot-cli-2.0.0.tgz
```

**Windows:**
```cmd
npm install -g https://github.com/ashwani983/ChatBotUsingOpenRouterAPI/releases/download/v2.0.0/ai-chatbot-cli-2.0.0.tgz
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
| `chatbot config` | Configure API key interactively |
| `chatbot help` | Show help message |

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
2. Set a different port: `PORT=3002 chatbot`

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
npm run install:all
```

3. Configure environment variables:
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
npm run dev
```

Open http://localhost:3001 in your browser.

---

## Available Free Models

The default model is `meta-llama/llama-3.1-8b-instruct`. You can change it in `server/src/server.ts`:

```typescript
const stream = await openai.chat.completions.create({
  model: 'meta-llama/llama-3.1-8b-instruct',  // Change this
  // other options...
});
```

Other free models available on OpenRouter:
- `google/gemma-2-9b-it`
- `mistralai/mistral-7b-instruct`
- `microsoft/phi-3-mini-128k-instruct`
- `deepseek/deepseek-chat`

## License

MIT
