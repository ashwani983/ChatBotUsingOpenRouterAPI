#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CLI_DIR = __dirname;

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

function checkDependencies() {
  const serverNodeModules = path.join(CLI_DIR, 'server', 'node_modules');
  const clientNodeModules = path.join(CLI_DIR, 'client', 'node_modules');
  
  if (!fs.existsSync(serverNodeModules) || !fs.existsSync(clientNodeModules)) {
    console.log('Installing dependencies...\n');
    const install = spawn('npm', ['run', 'install:all'], {
      cwd: CLI_DIR,
      stdio: 'inherit',
      shell: true
    });
    install.on('close', (code) => {
      if (code !== 0) {
        console.error('Failed to install dependencies');
        process.exit(1);
      }
      startServer();
    });
    return false;
  }
  return true;
}

function startServer() {
  console.log('Starting ChatBot server on http://localhost:3001...');
  console.log('Frontend will be available at http://localhost:5173\n');
  
  const server = spawn('npx', ['tsx', 'watch', 'server/src/server.ts'], {
    cwd: CLI_DIR,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });

  const client = spawn('npx', ['vite'], {
    cwd: path.join(CLI_DIR, 'client'),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });
  
  server.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
  
  client.on('error', (err) => {
    console.error('Failed to start client:', err);
    process.exit(1);
  });
  
  process.on('SIGINT', () => {
    server.kill();
    client.kill();
    process.exit(0);
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
    if (!checkDependencies()) return;
    startServer();
    break;
  case undefined:
    checkApiKey();
    if (!checkDependencies()) return;
    startServer();
    break;
  case 'help':
  case '-h':
  case '--help':
    console.log(`
ChatBot CLI - AI Chat using OpenRouter

Usage:
  chatbot              Start the ChatBot server (default)
  chatbot config      Configure your API key
  chatbot help        Show this help message

Options:
  -h, --help          Show help
  config              Configure API key interactively

Environment Variables:
  OPENROUTER_API_KEY  Your OpenRouter API key

Config File:
  ~/.chatbotrc        JSON file with {"apiKey": "your_key"}

Examples:
  chatbot             Start server
  chatbot config     Configure API key
  OPENROUTER_API_KEY=xxx chatbot  Start with env variable

Get a free API key from: https://openrouter.ai/settings
`);
    break;
  default:
    console.error('Unknown command: ' + command);
    console.error('Run "chatbot help" for usage information.');
    process.exit(1);
}
