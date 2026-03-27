import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message } from '../types';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  theme?: 'light' | 'dark';
  onRegenerate?: () => void;
}

const CodeBlock: React.FC<{ language: string; code: string; theme: 'light' | 'dark' }> = ({ language, code, theme }) => {
  const [copied, setCopied] = useState(false);
  const codeStyle = theme === 'dark' ? vscDarkPlus : oneLight;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden my-2">
      <div className={`absolute top-0 left-0 right-0 flex justify-between items-center px-4 py-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} border-b ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>
        <span className={`text-xs font-mono ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {language || 'text'}
        </span>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
            theme === 'dark' 
              ? 'hover:bg-gray-600 text-gray-400' 
              : 'hover:bg-gray-300 text-gray-600'
          }`}
        >
          {copied ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        style={codeStyle}
        language={language || 'text'}
        PreTag="div"
        customStyle={{ margin: 0, paddingTop: '3rem', paddingBottom: '1rem' }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

const MessageActions: React.FC<{
  content: string;
  theme: 'light' | 'dark';
  onRegenerate?: () => void;
}> = ({ content, theme, onRegenerate }) => {
  const [copied, setCopied] = useState(false);
  const [reaction, setReaction] = useState<'like' | 'dislike' | null>(null);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReaction = (type: 'like' | 'dislike') => {
    setReaction(reaction === type ? null : type);
  };

  const bgClass = theme === 'dark' ? 'bg-gray-700/90' : 'bg-gray-100/90';
  const textClass = theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700';

  return (
    <div className={`absolute -top-3 ${theme === 'dark' ? 'right-2' : 'right-2'} flex items-center gap-1 ${bgClass} backdrop-blur-sm rounded-lg px-1 py-1 border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'} opacity-0 group-hover:opacity-100 transition-opacity`}>
      <button
        onClick={handleCopy}
        className={`p-1.5 rounded ${textClass} transition-colors`}
        title="Copy message"
      >
        {copied ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
          </svg>
        )}
      </button>
      
      <div className="w-px h-4 bg-gray-500/30"></div>
      
      <button
        onClick={() => handleReaction('like')}
        className={`p-1.5 rounded transition-colors ${reaction === 'like' ? 'text-green-500' : textClass}`}
        title="Good response"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
        </svg>
      </button>
      
      <button
        onClick={() => handleReaction('dislike')}
        className={`p-1.5 rounded transition-colors ${reaction === 'dislike' ? 'text-red-500' : textClass}`}
        title="Bad response"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 4H5.641a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.933-1.933a4 4 0 00.8-2.4z" />
        </svg>
      </button>
      
      {onRegenerate && (
        <>
          <div className="w-px h-4 bg-gray-500/30"></div>
          <button
            onClick={onRegenerate}
            className={`p-1.5 rounded ${textClass} transition-colors`}
            title="Regenerate response"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
};

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, theme = 'dark', onRegenerate }) => {
  const userBg = theme === 'dark' ? 'bg-blue-600' : 'bg-blue-600';
  const assistantBg = theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200';
  const assistantText = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const codeInlineBg = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300';

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto mb-4 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <p className="text-lg">Start a conversation</p>
          <p className="text-sm mt-2">Send a message to begin chatting with AI</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {messages.map((message, index) => (
        <div
          key={message.id}
          className={`mb-4 group relative ${
            message.role === 'user' ? 'flex justify-end' : 'flex justify-start'
          }`}
        >
          <div
            className={`max-w-[85%] ${
              message.role === 'user'
                ? `${userBg} text-white rounded-2xl px-5 py-3`
                : `${assistantBg} ${assistantText} rounded-2xl px-5 py-3`
            }`}
          >
            <div className="flex items-start gap-3">
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                {message.role === 'assistant' ? (
                  <div className={`markdown-body prose max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
                    <ReactMarkdown
                      components={{
                        code({ className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const isInline = !match;
                          const code = String(children).replace(/\n$/, '');
                          
                          if (isInline) {
                            return (
                              <code
                                className={`${codeInlineBg} px-1.5 py-0.5 rounded text-sm`}
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          }
                          
                          return (
                            <CodeBlock
                              language={match[1]}
                              code={code}
                              theme={theme}
                            />
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                )}
              </div>
            </div>
          </div>
          
          {message.role === 'assistant' && message.content && (
            <MessageActions
              content={message.content}
              theme={theme}
              onRegenerate={index === messages.length - 1 ? onRegenerate : undefined}
            />
          )}
        </div>
      ))}
      
      {isLoading && messages.length > 0 && messages[messages.length - 1].role !== 'assistant' && (
        <div className="flex justify-start">
          <div className={`${assistantBg} ${assistantText} rounded-2xl px-5 py-3`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white animate-pulse"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                AI is thinking...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;
