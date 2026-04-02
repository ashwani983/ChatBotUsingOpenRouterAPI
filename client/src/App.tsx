import { useState, useRef, useEffect } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Conversation, Message, AIModel, Settings } from './types';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import SettingsModal from './components/SettingsModal';
import ShortcutsModal from './components/ShortcutsModal';
import Canvas from './components/Canvas';
import Toast from './components/Toast';
import ShareModal from './components/ShareModal';
import { jsPDF } from 'jspdf';

function ChatApp() {
  const { theme, toggleTheme } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [models, setModels] = useState<AIModel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [settings, setSettings] = useState<Settings>({
    theme: 'dark',
    model: 'meta-llama/llama-3.1-8b-instruct',
    temperature: '0.7',
    max_tokens: '2048',
    system_prompt: 'You are a helpful AI assistant.',
    voice_enabled: 'false',
    tts_enabled: 'false',
    language: 'en-US',
    font_size: '16',
    code_auto_run: 'false'
  });
  const [announcement, setAnnouncement] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const lastUserMessageRef = useRef<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem('apiKey');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
  };

  const currentConversation = conversations.find(c => c.id === currentConversationId);

  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!apiKey) return;
    if (hasInitialized) return;
    setHasInitialized(true);
    fetchConversations();
    fetchModels();
    fetchSettings();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setShortcutsOpen(true);
        }
      }
      if (e.key === 'Escape') {
        if (settingsOpen) setSettingsOpen(false);
        if (shortcutsOpen) setShortcutsOpen(false);
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        createNewConversation();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        searchConversations(searchQuery);
      }, 300);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations]);

  const fetchConversations = async () => {
    if (!apiKey) return;
    try {
      const res = await fetch('/api/conversations', {
        headers: { 'X-API-Key': apiKey }
      });
      if (res.status === 401) {
        localStorage.removeItem('apiKey');
        setApiKey('');
        return;
      }
      const data = await res.json();
      setConversations(data);
      setFilteredConversations(data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  const searchConversations = async (query: string) => {
    if (!apiKey) return;
    try {
      const res = await fetch(`/api/conversations/search?q=${encodeURIComponent(query)}`, {
        headers: { 'X-API-Key': apiKey }
      });
      const data = await res.json();
      setFilteredConversations(data);
    } catch (err) {
      console.error('Failed to search conversations:', err);
      setFilteredConversations(conversations);
    }
  };

  const fetchModels = async () => {
    if (!apiKey) return;
    try {
      const res = await fetch('/api/models', {
        headers: { 'X-API-Key': apiKey }
      });
      const data = await res.json();
      setModels(data);
    } catch (err) {
      console.error('Failed to fetch models:', err);
    }
  };

  const fetchSettings = async () => {
    if (!apiKey) return;
    try {
      const res = await fetch('/api/settings', {
        headers: { 'X-API-Key': apiKey }
      });
      const data = await res.json();
      setSettings(prev => ({ ...prev, ...data }));
      if (data.theme === 'light') {
        document.documentElement.classList.remove('dark');
      }
      document.documentElement.style.fontSize = `${data.font_size || 16}px`;
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const fetchMessages = async (conversationId: number) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: { 'X-API-Key': apiKey }
      });
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

  const speakText = (text: string) => {
    if (settings.tts_enabled === 'true' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = settings.language || 'en-US';
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleSpeaking = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
  };

  const createNewConversation = async () => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'X-API-Key': apiKey }
      });
      const newConv = await res.json();
      setConversations(prev => [newConv, ...prev]);
      setFilteredConversations(prev => [newConv, ...prev]);
      setCurrentConversationId(newConv.id);
      setMessages([]);
      setSearchQuery('');
      setAnnouncement('New conversation created');
      setTimeout(() => setAnnouncement(''), 1000);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const deleteConversation = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await fetch(`/api/conversations/${id}`, { 
        method: 'DELETE',
        headers: { 'X-API-Key': apiKey }
      });
      setConversations(prev => prev.filter(c => c.id !== id));
      setFilteredConversations(prev => prev.filter(c => c.id !== id));
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
      await fetch('/api/conversations', { 
        method: 'DELETE',
        headers: { 'X-API-Key': apiKey }
      });
      setConversations([]);
      setFilteredConversations([]);
      setCurrentConversationId(null);
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const handleSelectConversation = (id: number) => {
    setCurrentConversationId(id);
    fetchMessages(id);
    stopSpeaking();
  };

  const handleSaveSettings = async (newSettings: Partial<Settings>) => {
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
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
      if (newSettings.font_size) {
        document.documentElement.style.fontSize = `${newSettings.font_size}px`;
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const sanitizeFilename = (name: string): string => {
    if (!name) return 'conversation';
    return name
      .replace(/<[^>]*>/g, '')
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/[\x00-\x1f]/g, '')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 100) || 'conversation';
  };

  const exportConversation = async (format: 'markdown' | 'text' | 'pdf') => {
    if (!currentConversationId) return;
    
    const filename = sanitizeFilename(currentConversation?.title || 'conversation');
    
    if (format === 'pdf') {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;
      
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(filename, margin, y);
      y += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128);
      doc.text(`Exported: ${new Date().toLocaleString()}`, margin, y);
      y += 15;
      
      doc.setTextColor(0);
      doc.setFontSize(12);
      
      for (const msg of messages) {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        const label = `${role}:`;
        const lines = doc.splitTextToSize(msg.content, maxWidth);
        
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, y);
        y += 7;
        
        doc.setFont('helvetica', 'normal');
        for (const line of lines) {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, margin, y);
          y += 6;
        }
        y += 8;
      }
      
      doc.save(`${filename}.pdf`);
      return;
    }
    
    try {
      const res = await fetch(`/api/export/${currentConversationId}/${format}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${format === 'markdown' ? 'md' : 'txt'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export conversation:', err);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!apiKey) {
      setSettingsOpen(true);
      return;
    }

    stopSpeaking();
    lastUserMessageRef.current = content;
    
    let convId = currentConversationId;

    if (!convId) {
      try {
      const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'X-API-Key': apiKey }
        });
        const newConv = await res.json();
        setConversations(prev => [newConv, ...prev]);
        setFilteredConversations(prev => [newConv, ...prev]);
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
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
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
            }
          }
        }
      }

      if (fullContent) {
        setTimeout(() => speakText(fullContent), 100);
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

  const handleRegenerate = async () => {
    if (lastUserMessageRef.current && !isLoading && currentConversationId) {
      const currentMessages = messages;
      const lastAssistantMsg = [...currentMessages].reverse().find(msg => msg.role === 'assistant');
      
      if (lastAssistantMsg && lastAssistantMsg.id) {
        try {
          await fetch(`/api/messages/${lastAssistantMsg.id}`, { method: 'DELETE' });
        } catch (err) {
          console.error('Failed to delete message:', err);
        }
      }
      
      setMessages(currentMessages.filter(msg => msg.role === 'user'));
      handleSendMessage(lastUserMessageRef.current);
    }
  };

  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100';
  const sidebarBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const hoverBg = theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200';

  const displayConversations = searchQuery.trim() ? filteredConversations : conversations;

  return (
    <div className={`flex h-screen ${bgColor} ${textColor}`} role="application" aria-label="OpenControlChat Application">
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } ${sidebarBg} transition-all duration-300 flex-shrink-0 overflow-hidden border-r ${borderColor}`}
        aria-label="Chat sidebar"
        aria-hidden={!sidebarOpen}
      >
        <div className="p-4">
          <button
            onClick={createNewConversation}
            className={`w-full py-3 px-4 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg flex items-center justify-center gap-2 transition-colors`}
            aria-label="Start new conversation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Chat
          </button>
          
          <div className="mt-3 relative">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full ${theme === 'dark' ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900 placeholder-gray-500'} rounded-lg px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              aria-label="Search conversations"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <div className="px-4 py-2 flex justify-between items-center">
          <h3 className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-medium`}>
            {searchQuery.trim() ? 'Search Results' : 'Chat History'}
          </h3>
          {!searchQuery.trim() && conversations.length > 0 && (
            <button
              onClick={clearAllHistory}
              className={`text-xs ${theme === 'dark' ? 'text-gray-500 hover:text-red-400' : 'text-gray-500 hover:text-red-600'} transition-colors`}
              title="Clear all history"
              aria-label="Clear all chat history"
            >
              Clear
            </button>
          )}
        </div>
        
        <nav className="mt-2 px-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }} aria-label="Conversation list">
          {displayConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => handleSelectConversation(conv.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleSelectConversation(conv.id)}
              className={`group w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors flex items-center justify-between cursor-pointer ${
                currentConversationId === conv.id
                  ? (theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900')
                  : (theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200')
              }`}
              aria-current={currentConversationId === conv.id ? 'page' : undefined}
            >
              <span className="truncate flex-1">{conv.title}</span>
              <button
                onClick={(e) => deleteConversation(e, conv.id)}
                className={`opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}
                title="Delete conversation"
                aria-label={`Delete conversation: ${conv.title}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          
          {displayConversations.length === 0 && (
            <p className={`text-sm px-3 py-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              {searchQuery.trim() ? 'No results found' : 'No chat history'}
            </p>
          )}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col" role="main">
        <header className={`h-14 ${sidebarBg} border-b ${borderColor} flex items-center justify-between px-4`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 ${hoverBg} rounded-lg transition-colors`}
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold">
              {currentConversation?.title || 'OpenControlChat'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {currentConversationId && (
              <div className="relative group">
                <button
                  className={`p-2 ${hoverBg} rounded-lg transition-colors`}
                  title="Export conversation"
                  aria-label="Export conversation"
                  aria-haspopup="true"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className={`absolute right-0 mt-2 w-48 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-lg border ${borderColor} opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10`} role="menu">
                  <button
                    onClick={() => exportConversation('markdown')}
                    className={`w-full text-left px-4 py-2 text-sm ${hoverBg} transition-colors`}
                    role="menuitem"
                  >
                    Export as Markdown
                  </button>
                  <button
                    onClick={() => exportConversation('text')}
                    className={`w-full text-left px-4 py-2 text-sm ${hoverBg} transition-colors`}
                    role="menuitem"
                  >
                    Export as Text
                  </button>
                  <button
                    onClick={() => exportConversation('pdf')}
                    className={`w-full text-left px-4 py-2 text-sm ${hoverBg} transition-colors`}
                    role="menuitem"
                  >
                    Export as PDF
                  </button>
                </div>
              </div>
            )}
            {currentConversationId && (
              <button
                onClick={() => setShareOpen(true)}
                className={`p-2 ${hoverBg} rounded-lg transition-colors`}
                title="Share conversation"
                aria-label="Share conversation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
              </button>
            )}
            {settings.tts_enabled === 'true' && (
              <button
                onClick={toggleSpeaking}
                className={`p-2 ${hoverBg} rounded-lg transition-colors ${isSpeaking ? 'text-green-500' : ''}`}
                title={isSpeaking ? 'Stop speaking' : 'TTS enabled'}
                aria-label={isSpeaking ? 'Stop text-to-speech' : 'Text-to-speech enabled'}
              >
                {isSpeaking ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0015 12a3.983 3.983 0 00-.586-2.172 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )}
            <button
              onClick={() => setShortcutsOpen(true)}
              className={`p-2 ${hoverBg} rounded-lg transition-colors`}
              title="Keyboard shortcuts"
              aria-label="Show keyboard shortcuts"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className={`p-2 ${hoverBg} rounded-lg transition-colors`}
              title="Settings"
              aria-label="Open settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={toggleTheme}
              className={`p-2 ${hoverBg} rounded-lg transition-colors`}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
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
        </header>

        <div className="flex-1 overflow-y-auto">
          <MessageList messages={messages} isLoading={isLoading} theme={theme} onRegenerate={handleRegenerate} onSuggestionClick={handleSendMessage} />
          <div ref={messagesEndRef} />
        </div>

        <ChatInput 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading} 
          theme={theme}
          voiceEnabled={settings.voice_enabled === 'true'}
        />
      </main>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        models={models}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />
      
      <ShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
      
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        conversationId={currentConversationId}
        conversationTitle={currentConversation?.title || ''}
        theme={theme}
      />
      
      <Canvas theme={theme} />
      <Toast />

      <div
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {announcement || (isLoading ? 'AI is typing...' : '')}
      </div>
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
