import { useState } from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: number | null;
  conversationTitle: string;
  theme: 'light' | 'dark';
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, conversationId, conversationTitle, theme }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportJson = async () => {
    if (!conversationId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/export/${conversationId}/json`);
      
      if (!response.ok) {
        throw new Error('Failed to export conversation');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${conversationTitle || 'conversation'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      onClose();
    } catch (err) {
      setError('Failed to export conversation. Please try again.');
      console.error('Export error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportMarkdown = async () => {
    if (!conversationId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/export/${conversationId}/markdown`);
      
      if (!response.ok) {
        throw new Error('Failed to export conversation');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${conversationTitle || 'conversation'}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      onClose();
    } catch (err) {
      setError('Failed to export conversation. Please try again.');
      console.error('Export error:', err);
    } finally {
      setLoading(false);
    }
  };

  const panelBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedText = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const btnBg = theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className={`${panelBg} rounded-lg border ${borderColor} shadow-xl p-6 w-full max-w-md relative z-10 animate-fade-in-up`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${textColor}`}>Export Conversation</h3>
          <button
            onClick={onClose}
            className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} ${mutedText}`}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!conversationId ? (
          <div className="text-center py-4">
            <p className={mutedText}>Select a conversation to export</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className={`${mutedText} text-sm`}>
              Export <span className="font-medium text-white">"{conversationTitle}"</span> for sharing with other AI chat applications.
            </p>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleExportJson}
                disabled={loading}
                className={`w-full p-4 rounded-lg border ${borderColor} ${btnBg} transition-colors text-left`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                  </div>
                  <div>
                    <p className={`font-medium ${textColor}`}>Export as JSON</p>
                    <p className={`text-sm ${mutedText}`}>Best for importing into other AI chat apps</p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleExportMarkdown}
                disabled={loading}
                className={`w-full p-4 rounded-lg border ${borderColor} ${btnBg} transition-colors text-left`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className={`font-medium ${textColor}`}>Export as Markdown</p>
                    <p className={`text-sm ${mutedText}`}>Human-readable format, easy to share</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareModal;
