'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Settings } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTone: string;
  defaultLength: string;
  onSave: (settings: {
    tone: string;
    length: string;
    personalizationDepth: string;
  }) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  defaultTone,
  onSave,
}: SettingsModalProps) {
  const [tone, setTone] = useState(defaultTone);
  const [length, setLength] = useState('medium');
  const [personalizationDepth, setPersonalizationDepth] = useState('standard');

  const handleSave = () => {
    onSave({ tone, length, personalizationDepth });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <h2 className="text-lg font-semibold text-white">Generation Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Default Tone
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['professional', 'casual', 'friendly', 'formal'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-3 py-2 text-sm rounded transition-colors ${
                    tone === t
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Length */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Default Length
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['short', 'medium', 'long'].map((l) => (
                <button
                  key={l}
                  onClick={() => setLength(l)}
                  className={`px-3 py-2 text-sm rounded transition-colors ${
                    length === l
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {l.charAt(0).toUpperCase() + l.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Personalization */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Personalization Depth
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['minimal', 'standard', 'deep'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPersonalizationDepth(p)}
                  className={`px-3 py-2 text-sm rounded transition-colors ${
                    personalizationDepth === p
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-300 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
