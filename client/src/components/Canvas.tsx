import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

interface ConsoleEntry {
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: Date;
}

interface CanvasProps {
  theme: 'light' | 'dark';
}

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'html', name: 'HTML' },
  { id: 'css', name: 'CSS' },
];

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: system-ui, sans-serif;
      padding: 20px;
      background: #1a1a2e;
      color: #eee;
    }
    h1 { color: #00d9ff; }
  </style>
</head>
<body>
  <h1>Hello Canvas!</h1>
  <p>Start coding here...</p>
  <script>
    console.log("Hello from Canvas!");
  </script>
</body>
</html>`;

const DEFAULT_JS = `// JavaScript Canvas
// Use console.log() for output

function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("Canvas User"));
console.log("Result:", 2 + 2);

// Try returning a value to see it in the console
return "Done!";
`;

const DEFAULT_CSS = `/* CSS Styles */
body {
  font-family: system-ui, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
}

.container {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}

h1 {
  color: #667eea;
  margin-bottom: 1rem;
}

p {
  color: #666;
  line-height: 1.6;
}`;

const Canvas: React.FC<CanvasProps> = ({ theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(DEFAULT_JS);
  const [consoleOutput, setConsoleOutput] = useState<ConsoleEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleOutput]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const container = document.getElementById('canvas-container');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPosition(Math.max(20, Math.min(80, newPosition)));
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const getDefaultCode = (lang: string) => {
    switch (lang) {
      case 'html': return DEFAULT_HTML;
      case 'css': return DEFAULT_CSS;
      default: return DEFAULT_JS;
    }
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setCode(getDefaultCode(newLang));
  };

  const clearConsole = () => {
    setConsoleOutput([]);
  };

  const runCode = () => {
    setIsRunning(true);
    setConsoleOutput([]);

    setTimeout(() => {
      if (language === 'html') {
        if (iframeRef.current) {
          iframeRef.current.srcdoc = code;
        }
        setConsoleOutput([{
          type: 'info',
          message: 'HTML rendered in preview',
          timestamp: new Date()
        }]);
        setIsRunning(false);
        return;
      }

      if (language === 'css') {
        if (iframeRef.current) {
          iframeRef.current.srcdoc = `
            <html>
            <head>
              <style>${code}</style>
            </head>
            <body>
              <div class="container">
                <h1>CSS Preview</h1>
                <p>Your styles are applied to this content.</p>
                <button>Button</button>
                <input type="text" placeholder="Input field">
              </div>
            </body>
            </html>
          `;
        }
        setConsoleOutput([{
          type: 'info',
          message: 'CSS preview rendered',
          timestamp: new Date()
        }]);
        setIsRunning(false);
        return;
      }

      const logs: ConsoleEntry[] = [];
      const sandboxConsole = {
        log: (...args: unknown[]) => {
          logs.push({
            type: 'log',
            message: args.map(arg => formatValue(arg)).join(' '),
            timestamp: new Date()
          });
        },
        error: (...args: unknown[]) => {
          logs.push({
            type: 'error',
            message: args.map(arg => formatValue(arg)).join(' '),
            timestamp: new Date()
          });
        },
        warn: (...args: unknown[]) => {
          logs.push({
            type: 'warn',
            message: args.map(arg => formatValue(arg)).join(' '),
            timestamp: new Date()
          });
        },
        info: (...args: unknown[]) => {
          logs.push({
            type: 'info',
            message: args.map(arg => formatValue(arg)).join(' '),
            timestamp: new Date()
          });
        }
      };

      try {
        const sandboxCode = `
          (function(console) {
            ${code}
          })
        `;
        const fn = eval(sandboxCode);
        const result = fn(sandboxConsole);

        if (result !== undefined) {
          logs.push({
            type: 'log',
            message: `→ ${formatValue(result)}`,
            timestamp: new Date()
          });
        }
      } catch (error: unknown) {
        logs.push({
          type: 'error',
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date()
        });
      }

      setConsoleOutput(logs);
      setIsRunning(false);
    }, 100);
  };

  const formatValue = (value: unknown): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';
  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100';
  const panelBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const mutedText = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 right-4 p-3 rounded-full shadow-lg transition-all hover:scale-110 ${
          theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'
        } text-white z-40`}
        title="Open Canvas Editor"
        aria-label="Open Canvas Editor"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </button>
    );
  }

  return (
    <div
      id="canvas-container"
      className={`fixed bottom-0 right-0 w-1/2 h-[60vh] ${panelBg} border-l ${borderColor} shadow-2xl flex flex-col z-50 rounded-tl-xl`}
      style={{ minWidth: '400px' }}
    >
      <div className={`flex items-center justify-between px-4 py-2 ${borderColor} border-b`}>
        <div className="flex items-center gap-3">
          <h3 className={`font-semibold ${textColor}`}>Canvas Editor</h3>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className={`px-3 py-1 rounded text-sm ${
              theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            aria-label="Select language"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>{lang.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runCode}
            disabled={isRunning}
            className={`px-4 py-1.5 rounded font-medium text-sm transition-colors ${
              isRunning
                ? 'bg-gray-500 cursor-not-allowed'
                : theme === 'dark'
                  ? 'bg-green-600 hover:bg-green-500'
                  : 'bg-green-500 hover:bg-green-600'
            } text-white`}
            aria-label="Run code"
          >
            {isRunning ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Running
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Run
              </span>
            )}
          </button>
          <button
            onClick={clearConsole}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            } ${mutedText}`}
            aria-label="Clear console"
          >
            Clear
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className={`p-1.5 rounded transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} ${mutedText}`}
            aria-label="Close canvas"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className="flex-1 flex overflow-hidden"
        onMouseDown={() => {
          isDraggingRef.current = true;
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';
        }}
      >
        <div style={{ width: `${splitPosition}%` }} className="flex flex-col">
          <Editor
            height="100%"
            language={language}
            theme={editorTheme}
            value={code}
            onChange={(value) => setCode(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'Fira Code', 'Consolas', monospace",
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              padding: { top: 10 }
            }}
          />
        </div>

        <div
          className={`w-1 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} cursor-col-resize hover:bg-blue-500 transition-colors flex-shrink-0`}
        />

        <div style={{ width: `${100 - splitPosition}%` }} className="flex flex-col overflow-hidden">
          <div className={`px-3 py-1.5 text-xs font-medium ${mutedText} ${borderColor} border-b`}>
            Preview & Console
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <iframe
              ref={iframeRef}
              className={`flex-1 w-full ${bgColor} border-0`}
              sandbox="allow-scripts"
              title="Code Preview"
            />

            <div
              ref={consoleRef}
              className={`h-32 overflow-y-auto border-t ${borderColor} p-2 font-mono text-xs ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}
            >
              {consoleOutput.length === 0 ? (
                <div className={`${mutedText} italic`}>
                  Console output will appear here...
                </div>
              ) : (
                consoleOutput.map((entry, index) => (
                  <div
                    key={index}
                    className={`py-0.5 ${
                      entry.type === 'error'
                        ? 'text-red-400'
                        : entry.type === 'warn'
                          ? 'text-yellow-400'
                          : entry.type === 'info'
                            ? 'text-blue-400'
                            : theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>
                      {entry.timestamp.toLocaleTimeString()}
                    </span>{' '}
                    {entry.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Canvas;
