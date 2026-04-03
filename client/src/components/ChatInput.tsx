import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import ImageUploader from './ImageUploader';
import FileUploader from './FileUploader';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  theme?: 'light' | 'dark';
  voiceEnabled?: boolean;
  apiKey?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isLoading, 
  theme = 'dark',
  voiceEnabled = false
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [showFileUploader, setShowFileUploader] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-300';
  const bgColor = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const inputBg = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const placeholderColor = theme === 'dark' ? 'placeholder-gray-400' : 'placeholder-gray-500';
  const helperTextColor = theme === 'dark' ? 'text-gray-500' : 'text-gray-400';

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        if (transcript) {
          setInput(prev => {
            const newInput = prev ? prev + ' ' + transcript : transcript;
            return newInput;
          });
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      setInputHistory(prev => [input.trim(), ...prev.slice(0, 49)]);
      setHistoryIndex(-1);
      onSendMessage(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && e.ctrlKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'ArrowUp' && inputHistory.length > 0) {
      e.preventDefault();
      const newIndex = Math.min(historyIndex + 1, inputHistory.length - 1);
      setHistoryIndex(newIndex);
      setInput(inputHistory[newIndex] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setInput(newIndex === -1 ? '' : inputHistory[newIndex] || '');
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setHistoryIndex(-1);
  };

  return (
    <div className={`border-t ${borderColor} ${bgColor} px-4 py-4`}>
      <div className="max-w-3xl mx-auto">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            disabled={isLoading}
            className={`w-full ${inputBg} ${textColor} rounded-xl px-4 py-3 pr-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${placeholderColor}`}
            style={{ minHeight: '52px', maxHeight: '200px' }}
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-2">
            <button
              onClick={() => {
                setShowFileUploader(!showFileUploader);
                setShowImageUploader(false);
              }}
              className={`p-2 rounded-lg transition-colors ${
                showFileUploader
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 hover:bg-gray-500 text-white'
              }`}
              title="Upload Files"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </button>
            <button
              onClick={() => {
                setShowImageUploader(!showImageUploader);
                setShowFileUploader(false);
              }}
              className={`p-2 rounded-lg transition-colors ${
                showImageUploader
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 hover:bg-gray-500 text-white'
              }`}
              title="Image Analysis"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>
            {voiceEnabled && (
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading}
                className={`p-2 rounded-lg transition-colors ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-gray-600 hover:bg-gray-500'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>
        <p className={`text-center text-xs ${helperTextColor} mt-2`}>
          Press Enter to send, Ctrl+Enter to send, ↑↓ for history
          {isListening && <span className="text-red-400 ml-2">● Listening...</span>}
        </p>

        {showImageUploader && (
          <div className="mt-4">
            <ImageUploader
              theme={theme}
              apiKey={apiKey}
              onImageAnalyzed={(analysis) => {
                setInput(prev => prev ? `${prev}\n\n[Image Analysis]\n${analysis}` : `[Image Analysis]\n${analysis}`);
                setShowImageUploader(false);
              }}
              onClose={() => setShowImageUploader(false)}
            />
          </div>
        )}

        {showFileUploader && (
          <div className="mt-4">
            <FileUploader
              theme={theme}
              onFilesUploaded={(files) => {
                const fileList = files.map(f => `[File: ${f.filename}](${f.url})`).join('\n');
                setInput(prev => prev ? `${prev}\n\n${fileList}` : fileList);
                setShowFileUploader(false);
              }}
              onClose={() => setShowFileUploader(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
