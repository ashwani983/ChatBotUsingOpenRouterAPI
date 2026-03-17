import { useState, useRef, useEffect } from 'react';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import { Message, ChatSession } from './types';

function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('chatSessions');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  useEffect(() => {
    localStorage.setItem('chatSessions', JSON.stringify(sessions));
  }, [sessions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    
    fetch('/api/chat/reset', { method: 'POST' }).catch(console.error);
  };

  const handleSendMessage = async (content: string) => {
    let sessionId = currentSessionId;
    
    if (!sessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
        messages: [],
      };
      setSessions(prev => [newSession, ...prev]);
      sessionId = newSession.id;
      setCurrentSessionId(sessionId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
    };

    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          messages: [...s.messages, userMessage, assistantMessage],
          title: s.title === 'New Chat' ? content.slice(0, 30) + (content.length > 30 ? '...' : '') : s.title,
        };
      }
      return s;
    }));

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setSessions(prev => prev.map(s => {
                  if (s.id === sessionId) {
                    return {
                      ...s,
                      messages: s.messages.map(msg =>
                        msg.id === assistantMessageId
                          ? { ...msg, content: fullContent }
                          : msg
                      ),
                    };
                  }
                  return s;
                }));
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            messages: s.messages.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: 'Sorry, something went wrong. Please try again.' }
                : msg
            ),
          };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    fetch('/api/chat/reset', { method: 'POST' }).catch(console.error);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-gray-800 transition-all duration-300 flex-shrink-0 overflow-hidden`}
      >
        <div className="p-4">
          <button
            onClick={createNewSession}
            className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            New Chat
          </button>
        </div>
        
        <div className="px-4 py-2">
          <h3 className="text-sm text-gray-400 font-medium">Chat History</h3>
        </div>
        
        <div className="mt-2 px-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => handleSelectSession(session.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                currentSessionId === session.id
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {session.title}
            </button>
          ))}
          
          {sessions.length === 0 && (
            <p className="text-gray-500 text-sm px-3 py-2">No chat history</p>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <h1 className="ml-4 text-lg font-semibold">AI Assistant</h1>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <MessageList messages={messages} isLoading={isLoading} />
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}

export default App;
