#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const http = require('http');

const CLI_DIR = __dirname;
const PID_FILE = path.join(CLI_DIR, '.chatbot.pid');
const PORT_FILE = path.join(CLI_DIR, '.chatbot.port');

function getApiKey() {
  let apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    const configPath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.chatbotrc');
    try {
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        apiKey = config.apiKey;
      }
    } catch (e) {}
  }
  
  return apiKey || null;
}

function checkApiKey() {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('\nError: OpenRouter API key not found.');
    console.error('\nPlease set your API key using one of these methods:\n');
    console.error('  1. Environment variable:');
    console.error('     export OPENROUTER_API_KEY=your_api_key_here');
    console.error('\n  2. Config file (~/.chatbotrc):');
    console.error('     echo \'{"apiKey": "your_api_key_here"}\' > ~/.chatbotrc');
    console.error('\n  3. Run: chatbot config');
    console.error('\n  Get a free API key from: https://openrouter.ai/settings\n');
    process.exit(1);
  }
}

function getPort() {
  if (fs.existsSync(PORT_FILE)) {
    return fs.readFileSync(PORT_FILE, 'utf-8').trim();
  }
  return '3001';
}

function setPort(port) {
  fs.writeFileSync(PORT_FILE, port.toString());
}

function getPid() {
  if (fs.existsSync(PID_FILE)) {
    return parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim());
  }
  return null;
}

function setPid(pid) {
  fs.writeFileSync(PID_FILE, pid.toString());
}

function clearPid() {
  if (fs.existsSync(PID_FILE)) {
    fs.unlinkSync(PID_FILE);
  }
}

function isServerRunning() {
  const pid = getPid();
  if (!pid) return false;
  
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    clearPid();
    return false;
  }
}

function checkServerHealth(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function showStatus() {
  const port = getPort();
  const pid = getPid();
  
  if (!pid || !isServerRunning()) {
    console.log('ChatBot server is not running.');
    console.log(`Run 'chatbot start' to start the server.`);
    return;
  }
  
  const isHealthy = await checkServerHealth(port);
  
  console.log('ChatBot Server Status');
  console.log('─'.repeat(30));
  console.log(`Status:    ${isHealthy ? 'Running' : 'Not responding'}`);
  console.log(`PID:       ${pid}`);
  console.log(`Port:      ${port}`);
  console.log(`URL:       http://localhost:${port}`);
  console.log('');
}

function stopServer() {
  const pid = getPid();
  
  if (!pid) {
    console.log('No running server found.');
    return;
  }
  
  if (!isServerRunning()) {
    console.log('Server is not running. Cleaning up...');
    clearPid();
    return;
  }
  
  try {
    process.kill(pid, 'SIGTERM');
    console.log('Server stopped.');
    clearPid();
  } catch (e) {
    console.log('Failed to stop server. Try: chatbot restart');
    clearPid();
  }
}

function restartServer() {
  const port = getPort();
  
  if (isServerRunning()) {
    stopServer();
    setTimeout(() => startServer(port), 1000);
  } else {
    startServer(port);
  }
}

function startServer(customPort) {
  const port = customPort || process.argv.includes('--port') 
    ? process.argv[process.argv.indexOf('--port') + 1] || '3001'
    : getPort();
  
  if (isServerRunning()) {
    console.log(`Server is already running on port ${port}.`);
    console.log(`Run 'chatbot status' for details.`);
    return;
  }
  
  setPort(port);
  
  console.log(`Starting ChatBot server on http://localhost:${port}...\n`);
  
  const env = { ...process.env, PORT: port };
  
  const server = spawn('node', ['server/dist/server.js'], {
    cwd: CLI_DIR,
    detached: true,
    stdio: 'ignore',
    shell: true,
    env
  });
  
  setPid(server.pid);
  server.unref();
  
  setTimeout(async () => {
    if (await checkServerHealth(port)) {
      console.log('ChatBot is running in the background.');
      console.log(`Open http://localhost:${port} in your browser to start chatting.\n`);
    } else {
      console.log('Server started but not responding. Check logs for errors.');
    }
    process.exit(0);
  }, 2000);
}

function configureApiKey() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('\n=== ChatBot CLI Setup ===\n');
  console.log('Get your free API key from: https://openrouter.ai/settings\n');
  
  rl.question('Enter your OpenRouter API key: ', (apiKey) => {
    rl.close();
    
    if (!apiKey.trim()) {
      console.error('Error: API key cannot be empty.');
      process.exit(1);
    }
    
    const configPath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.chatbotrc');
    fs.writeFileSync(configPath, JSON.stringify({ apiKey: apiKey.trim() }, null, 2));
    console.log(`\nAPI key saved to ${configPath}`);
    console.log('You can now run: chatbot\n');
  });
}

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'config':
    configureApiKey();
    break;
  case 'start':
    checkApiKey();
    startServer();
    break;
  case 'stop':
    stopServer();
    break;
  case 'status':
    showStatus();
    break;
  case 'restart':
    checkApiKey();
    restartServer();
    break;
  case undefined:
    checkApiKey();
    startServer();
    break;
  case 'help':
  case '-h':
  case '--help':
    console.log(`
ChatBot CLI - AI Chat using OpenRouter

Usage:
  chatbot              Start the ChatBot server (default)
  chatbot start       Start the ChatBot server
  chatbot stop        Stop the running server
  chatbot status      Show server status
  chatbot restart     Restart the server
  chatbot config      Configure your API key
  chatbot help        Show this help message

Options:
  -h, --help          Show help
  --port <number>     Specify port (default: 3001)
  config              Configure API key interactively

Examples:
  chatbot                   Start server on default port (3001)
  chatbot --port 8080      Start server on port 8080
  chatbot status           Check if server is running
  chatbot stop             Stop the server
  chatbot restart          Restart the server
  chatbot config           Configure API key

Environment Variables:
  OPENROUTER_API_KEY  Your OpenRouter API key

Config File:
  ~/.chatbotrc        JSON file with {"apiKey": "your_key"}

Get a free API key from: https://openrouter.ai/settings
`);
    break;
  default:
    if (command.startsWith('--port')) {
      checkApiKey();
      startServer();
    } else {
      console.error('Unknown command: ' + command);
      console.error('Run "chatbot help" for usage information.');
      process.exit(1);
    }
}
