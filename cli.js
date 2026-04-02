#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const http = require('http');

const CLI_DIR = __dirname;
const HOME = process.env.HOME || process.env.USERPROFILE || process.env.APPDATA || '/tmp';
const DATA_DIR = path.join(HOME, '.occhat');
const PID_FILE = path.join(DATA_DIR, '.occhat.pid');
const PORT_FILE = path.join(DATA_DIR, '.occhat.port');
const LOG_FILE = path.join(DATA_DIR, 'occhat.log');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function log(message) {
  ensureDataDir();
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logMessage);
  console.log(message);
}

function getApiKey() {
  let apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    const home = process.env.HOME || process.env.USERPROFILE || '';
    const configPath = path.join(home, '.occhatrc');
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
    console.error('     set OPENROUTER_API_KEY=your_api_key_here');
    console.error('\n  2. Config file:');
    const home = process.env.HOME || process.env.USERPROFILE || '';
    console.error(`     echo {"apiKey": "your_api_key_here"} > ${path.join(home, '.occhatrc')}`);
    console.error('\n  3. Run: chatbot config');
    console.error('\n  Get a free API key from: https://openrouter.ai/settings\n');
    process.exit(1);
  }
}

function getPort() {
  ensureDataDir();
  if (fs.existsSync(PORT_FILE)) {
    return fs.readFileSync(PORT_FILE, 'utf-8').trim();
  }
  return '3001';
}

function setPort(port) {
  ensureDataDir();
  fs.writeFileSync(PORT_FILE, port.toString());
}

function getPid() {
  ensureDataDir();
  if (fs.existsSync(PID_FILE)) {
    return parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim());
  }
  return null;
}

function setPid(pid) {
  ensureDataDir();
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

function checkDependencies() {
  return new Promise((resolve) => {
    const serverPath = path.join(CLI_DIR, 'server');
    const nodeModulesPath = path.join(serverPath, 'node_modules');
    
    if (!fs.existsSync(nodeModulesPath)) {
      console.log('Installing server dependencies...');
      const install = spawn('npm', ['install'], {
        cwd: serverPath,
        stdio: 'inherit',
        shell: true
      });
      install.on('close', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          console.error('Failed to install dependencies.');
          process.exit(1);
        }
      });
    } else {
      resolve(true);
    }
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
  console.log(`Log file: ${LOG_FILE}`);
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

function getPortFromArgs() {
  const args = process.argv.slice(2);
  const portIndex = args.indexOf('--port');
  if (portIndex !== -1 && args[portIndex + 1]) {
    return args[portIndex + 1];
  }
  return null;
}

async function startServer(customPort) {
  const portFromArgs = getPortFromArgs();
  const port = customPort || portFromArgs || getPort();
  
  if (isServerRunning()) {
    console.log(`Server is already running on port ${port}.`);
    console.log(`Run 'chatbot status' for details.`);
    return;
  }
  
  try {
    await checkDependencies();
  } catch (e) {
    process.exit(1);
  }
  
  setPort(port);
  
  log(`Starting ChatBot server on http://localhost:${port}...`);
  console.log(`Starting ChatBot server on http://localhost:${port}...\n`);
  
  const env = { ...process.env, PORT: port };
  
  const serverPath = path.join(CLI_DIR, 'server', 'dist', 'server.js');
  
  const logStream = fs.openSync(LOG_FILE, 'a');
  
  const server = spawn('node', [serverPath], {
    cwd: CLI_DIR,
    detached: true,
    stdio: ['ignore', logStream, logStream],
    shell: true,
    env
  });
  
  server.unref();
  setPid(server.pid);
  
  setTimeout(async () => {
    if (await checkServerHealth(port)) {
      console.log('ChatBot is running in the background.');
      console.log(`Open http://localhost:${port} in your browser.`);
      console.log(`Log file: ${LOG_FILE}\n`);
    } else {
      console.log('Server started but may have errors.');
      console.log(`Check logs at: ${LOG_FILE}`);
    }
    process.exit(0);
  }, 3000);
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
    
    const home = process.env.HOME || process.env.USERPROFILE || '';
    const configPath = path.join(home, '.occhatrc');
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
  ~/.occhatrc        JSON file with {"apiKey": "your_key"}

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
