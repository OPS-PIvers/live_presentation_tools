import { useEffect } from 'react';
import { Tool } from '../types';

export const useKeyboardShortcuts = (
  setActiveTool: (tool: Tool) => void,
  toggleCapture: () => void
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (['input', 'textarea'].includes((event.target as HTMLElement).tagName.toLowerCase())) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'a':
          event.preventDefault();
          setActiveTool(Tool.PAN_ZOOM);
          break;
        case 's':
          event.preventDefault();
          setActiveTool(Tool.SPOTLIGHT);
          break;
        case 'c':
          event.preventDefault();
          toggleCapture();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setActiveTool, toggleCapture]);
};
