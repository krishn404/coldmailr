'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, HelpCircle } from 'lucide-react';

interface KeyboardHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardHelp({ isOpen, onClose }: KeyboardHelpProps) {
  if (!isOpen) return null;

  const shortcuts = [
    {
      category: 'Editing',
      items: [
        { keys: ['⌘', 'Z'], description: 'Undo' },
        { keys: ['⌘', 'Shift', 'Z'], description: 'Redo' },
        { keys: ['⌘', 'S'], description: 'Save draft' },
      ],
    },
    {
      category: 'Generation',
      items: [
        { keys: ['⌘', 'Enter'], description: 'Generate with AI' },
        { keys: ['⌘', 'K'], description: 'Quick actions menu' },
      ],
    },
    {
      category: 'General',
      items: [
        { keys: ['Escape'], description: 'Close modal / Cancel' },
        { keys: ['?'], description: 'Show this help' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {shortcuts.map((group) => (
            <div key={group.category}>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                {group.category}
              </h3>
              <div className="space-y-2">
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                  >
                    <span className="text-sm text-gray-300">{item.description}</span>
                    <div className="flex gap-1">
                      {item.keys.map((key, keyIdx) => (
                        <kbd
                          key={keyIdx}
                          className="px-2 py-1 text-xs font-mono bg-gray-700 text-gray-200 rounded border border-gray-600"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800">
          <Button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
