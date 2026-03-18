import { useState, useEffect } from 'react';
import { AIModel, Settings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (settings: Partial<Settings>) => void;
  models: AIModel[];
}

export default function SettingsModal({ isOpen, onClose, settings, onSave, models }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              AI Model
            </label>
            <select
              value={localSettings.model}
              onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.provider})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Temperature: {localSettings.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={localSettings.temperature}
              onChange={(e) => setLocalSettings({ ...localSettings, temperature: e.target.value })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Precise</span>
              <span>Balanced</span>
              <span>Creative</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Tokens
            </label>
            <input
              type="number"
              min="256"
              max="8192"
              value={localSettings.max_tokens}
              onChange={(e) => setLocalSettings({ ...localSettings, max_tokens: e.target.value })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              System Prompt
            </label>
            <textarea
              value={localSettings.system_prompt}
              onChange={(e) => setLocalSettings({ ...localSettings, system_prompt: e.target.value })}
              rows={4}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="You are a helpful AI assistant..."
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
