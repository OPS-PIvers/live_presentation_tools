import React from 'react';
import { Tool } from '../types';
import { ZoomIcon, SpotlightIcon, CaptureIcon, PlayIcon, ResetIcon } from './icons';

interface ToolbarProps {
  activeTool: Tool;
  setActiveTool: React.Dispatch<React.SetStateAction<Tool>>;
  onReplay: () => void;
  onReset: () => void;
  hasSequence: boolean;
  isCapturing: boolean;
  toggleCapture: () => void;
}

const ToolButton: React.FC<{
  label: string;
  shortcut: string;
  icon: React.ReactNode;
  isActive: boolean;
  isToggle?: boolean;
  onClick: () => void;
}> = ({ label, shortcut, icon, isActive, isToggle = false, onClick }) => {
  const baseClasses = "flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-400";
  const activeClasses = isToggle ? "bg-red-600 text-white shadow-lg" : "bg-cyan-500 text-white shadow-lg";
  const inactiveClasses = "bg-gray-700 hover:bg-gray-600 text-gray-300";

  return (
    <button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`} title={`${label} (${shortcut.toUpperCase()})`}>
      {icon}
      <span className="text-xs mt-1 font-semibold">{label}</span>
    </button>
  );
};

export const Toolbar: React.FC<ToolbarProps> = ({ activeTool, setActiveTool, onReplay, onReset, hasSequence, isCapturing, toggleCapture }) => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-800 bg-opacity-80 backdrop-blur-sm p-3 rounded-xl shadow-2xl border border-gray-700">
      <div className="flex items-center gap-4">
        <ToolButton
          label="Pan/Zoom"
          shortcut="A"
          icon={<ZoomIcon className="w-6 h-6" />}
          isActive={activeTool === Tool.PAN_ZOOM}
          onClick={() => setActiveTool(prev => prev === Tool.PAN_ZOOM ? Tool.NONE : Tool.PAN_ZOOM)}
        />
        <ToolButton
          label="Spotlight"
          shortcut="S"
          icon={<SpotlightIcon className="w-6 h-6" />}
          isActive={activeTool === Tool.SPOTLIGHT}
          onClick={() => setActiveTool(prev => prev === Tool.SPOTLIGHT ? Tool.NONE : Tool.SPOTLIGHT)}
        />
        <ToolButton
          label={isCapturing ? 'Stop' : 'Capture'}
          shortcut="C"
          icon={<CaptureIcon className="w-6 h-6" />}
          isActive={isCapturing}
          isToggle={true}
          onClick={toggleCapture}
        />
        <div className="w-px h-10 bg-gray-600"></div>
        <button 
          onClick={onReplay} 
          disabled={!hasSequence}
          className="flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 bg-green-600 text-white disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-400"
          title="Replay Click Sequence"
        >
          <PlayIcon className="w-6 h-6" />
          <span className="text-xs mt-1 font-semibold">Replay</span>
        </button>
         <button 
          onClick={onReset} 
          className="flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 bg-red-700 hover:bg-red-600 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500"
          title="Reset Canvas"
        >
          <ResetIcon className="w-6 h-6" />
          <span className="text-xs mt-1 font-semibold">Reset</span>
        </button>
      </div>
    </div>
  );
};