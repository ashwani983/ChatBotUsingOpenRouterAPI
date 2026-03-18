import { useState, useRef, useEffect } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Conversation, Message, AIModel, Settings } from './types';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import SettingsModal from './components/SettingsModal';

function ChatApp() {
  const { theme, toggleTheme } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [models, setModels] = useState<AIModel[]>([]);
  const [settings, setSettings] = useState<Settings>({
    theme: 'dark',
    model: 'meta-llama/llama-3.1-8b-instruct',
    temperature: '0.7',
    max_tokens: '2048',
    system_prompt: 'You are a helpful AI assistant.'
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConversation = conversations.find(c => c.id === currentConversationId);

  useEffect(() => {
    fetchConversations();
    fetchModels();
    fetchSettings();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      setConversations(data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/models');
      const data = await res.json();
      setModels(data);
    } catch (err) {
      console.error('Failed to fetch models:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(prev => ({ ...prev, ...data }));
      if (data.theme === 'light') {
        document.documentElement.classList.remove('dark');
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const fetchMessages = async (conversationId: number) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createNewConversation = async () => {
    try {
      const res = await fetch('/api/conversations', { method: 'POST' });
      const newConv = await res.json();
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversationId(newConv.id);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const deleteConversation = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversationId === id) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const clearAllHistory = async () => {
    if (!confirm('Are you sure you want to clear all chat history?')) return;
    try {
      await fetch('/api/conversations', { method: 'DELETE' });
      setConversations([]);
      setCurrentConversationId(null);
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const handleSelectConversation = (id: number) => {
    setCurrentConversationId(id);
    fetchMessages(id);
  };

  const handleSaveSettings = async (newSettings: Partial<Settings>) => {
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      setSettings(prev => ({ ...prev, ...newSettings }));
      if (newSettings.theme) {
        if (newSettings.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const handleSendMessage = async (content: string) => {
    let convId = currentConversationId;

    if (!convId) {
      try {
        const res = await fetch('/api/conversations', { method: 'POST' });
        const newConv = await res.json();
        setConversations(prev => [newConv, ...prev]);
        convId = newConv.id;
        setCurrentConversationId(convId);
      } catch (err) {
        console.error('Failed to create conversation:', err);
        return;
      }
    }

    if (!convId) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content,
    };

    const tempAssistantMessage: Message = {
      id: Date.now() + 1,
      role: 'assistant',
      content: '',
    };

    setMessages(prev => [...prev, userMessage, tempAssistantMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId: convId,
          model: settings.model,
          temperature: parseFloat(settings.temperature),
          max_tokens: parseInt(settings.max_tokens),
          system_prompt: settings.system_prompt
        }),
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
                setMessages(prev => prev.map(msg =>
                  msg.id === tempAssistantMessage.id
                    ? { ...msg, content: fullContent }
                    : msg
                ));
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      await fetchConversations();
      await fetchMessages(convId);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => prev.map(msg =>
        msg.id === tempAssistantMessage.id
          ? { ...msg, content: 'Sorry, something went wrong. Please try again.' }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100';
  const sidebarBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const hoverBg = theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200';

  return (
    <div className={`flex h-screen ${bgColor} ${textColor}`}>
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } ${sidebarBg} transition-all duration-300 flex-shrink-0 overflow-hidden border-r ${borderColor}`}
      >
        <div className="p-4">
          <button
            onClick={createNewConversation}
            className={`w-full py-3 px-4 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg flex items-center justify-center gap-2 transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Chat
          </button>
        </div>
        
        <div className="px-4 py-2 flex justify-between items-center">
          <h3 className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-medium`}>Chat History</h3>
          {conversations.length > 0 && (
            <button
              onClick={clearAllHistory}
              className={`text-xs ${theme === 'dark' ? 'text-gray-500 hover:text-red-400' : 'text-gray-500 hover:text-red-600'} transition-colors`}
              title="Clear all history"
            >
              Clear
            </button>
          )}
        </div>
        
        <div className="mt-2 px-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => handleSelectConversation(conv.id)}
              className={`group w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors flex items-center justify-between ${
                currentConversationId === conv.id
                  ? (theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900')
                  : (theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200')
              }`}
            >
              <span className="truncate flex-1">{conv.title}</span>
              <button
                onClick={(e) => deleteConversation(e, conv.id)}
                className={`opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}
                title="Delete conversation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          
          {conversations.length === 0 && (
            <p className={`text-sm px-3 py-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>No chat history</p>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`h-14 ${sidebarBg} border-b ${borderColor} flex items-center justify-between px-4`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 ${hoverBg} rounded-lg transition-colors`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold">
              {currentConversation?.title || 'AI Assistant'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSettingsOpen(true)}
              className={`p-2 ${hoverBg} rounded-lg transition-colors`}
              title="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={toggleTheme}
              className={`p-2 ${hoverBg} rounded-lg transition-colors`}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <MessageList messages={messages} isLoading={isLoading} theme={theme} />
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} theme={theme} />
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        models={models}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ChatApp />
    </ThemeProvider>
  );
}

export default App;
