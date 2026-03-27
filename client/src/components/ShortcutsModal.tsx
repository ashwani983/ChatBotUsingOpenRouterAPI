import { useEffect, useState, useRef } from 'react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: 'Enter', description: 'Send message' },
  { keys: 'Ctrl + Enter', description: 'Send message' },
  { keys: 'Shift + Enter', description: 'New line' },
  { keys: '↑ / ↓', description: 'Navigate input history' },
  { keys: 'Ctrl + Shift + N', description: 'New conversation' },
  { keys: 'Escape', description: 'Close modal / Cancel' },
  { keys: 'Tab', description: 'Navigate between elements' },
];

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setIsVisible(true);
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        previousFocusRef.current?.focus();
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div 
        ref={modalRef}
        className={`bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 transition-transform duration-200 ${isOpen ? 'scale-100' : 'scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="shortcuts-title" className="text-xl font-semibold text-white">Keyboard Shortcuts</h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Close shortcuts dialog"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3" role="list">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0" role="listitem">
              <span className="text-gray-300">{shortcut.description}</span>
              <kbd className="px-3 py-1 bg-gray-700 text-gray-200 rounded text-sm font-mono">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Press <kbd className="px-2 py-0.5 bg-gray-700 rounded text-xs">?</kbd> anytime to show this dialog
        </p>
      </div>
    </div>
  );
}
