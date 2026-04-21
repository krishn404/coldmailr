import { useEffect } from 'react';

interface KeyboardShortcuts {
  'cmd+z'?: () => void;
  'cmd+shift+z'?: () => void;
  'cmd+enter'?: () => void;
  'cmd+s'?: () => void;
  'escape'?: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      // Cmd/Ctrl + Z (Undo)
      if (isCtrlOrCmd && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        shortcuts['cmd+z']?.();
      }

      // Cmd/Ctrl + Shift + Z (Redo)
      if (isCtrlOrCmd && event.key === 'z' && event.shiftKey) {
        event.preventDefault();
        shortcuts['cmd+shift+z']?.();
      }

      // Cmd/Ctrl + Enter (Generate/Send)
      if (isCtrlOrCmd && event.key === 'Enter') {
        event.preventDefault();
        shortcuts['cmd+enter']?.();
      }

      // Cmd/Ctrl + S (Save)
      if (isCtrlOrCmd && event.key === 's') {
        event.preventDefault();
        shortcuts['cmd+s']?.();
      }

      // Escape
      if (event.key === 'Escape') {
        shortcuts['escape']?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
