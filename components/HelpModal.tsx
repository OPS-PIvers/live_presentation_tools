import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'A', description: 'Toggle Pan & Zoom Tool' },
  { key: 'S', description: 'Toggle Spotlight Tool' },
  { key: 'C', description: 'Toggle Recording/Capture' },
  { key: 'Left Arrow', description: 'Previous Slide' },
  { key: 'Right Arrow', description: 'Next Slide' },
  { key: 'Space / Enter', description: 'Activate current tool (center of screen)' },
  { key: 'Double Click', description: 'Reset View (Pan/Zoom)' },
];

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden transform transition-all">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800">
          <h2 className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close help"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid gap-3">
            {SHORTCUTS.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-colors"
              >
                <span className="text-gray-300 font-medium">
                  {shortcut.description}
                </span>
                <span className="px-3 py-1 bg-gray-900 text-cyan-400 rounded-md font-mono text-sm border border-gray-700 shadow-sm">
                  {shortcut.key}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 bg-gray-900/50 text-center text-sm text-gray-500">
          Press <span className="font-mono text-gray-400">ESC</span> to close
        </div>
      </div>
    </div>
  );
};
