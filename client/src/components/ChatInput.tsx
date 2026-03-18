import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  theme?: 'light' | 'dark';
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, theme = 'dark' }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
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

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
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
            className={`w-full ${inputBg} ${textColor} rounded-xl px-4 py-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${placeholderColor}`}
            style={{ minHeight: '52px', maxHeight: '200px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
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
        <p className={`text-center text-xs ${helperTextColor} mt-2`}>
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
