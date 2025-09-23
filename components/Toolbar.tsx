import React from 'react';

import { Tool } from '../types';

import {
  ZoomIcon,
  SpotlightIcon,
  CaptureIcon,
  PlayIcon,
  ResetIcon,
  PlusIcon,
} from './icons';

interface ToolbarProps {
  activeTool: Tool;
  setActiveTool: React.Dispatch<React.SetStateAction<Tool>>;
  onReplay: () => void;
  onReset: () => void;
  hasSequence: boolean;
  isCapturing: boolean;
  toggleCapture: () => void;
  onAddSlide: () => void;
  currentSlideIndex: number;
  totalSlides: number;
}

const ToolButton: React.FC<{
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  isActive?: boolean;
  isToggle?: boolean;
  onClick: () => void;
  disabled?: boolean;
  title: string;
}> = ({
  label,
  shortcut,
  icon,
  isActive = false,
  isToggle = false,
  onClick,
  disabled = false,
  title,
}) => {
  const baseClasses =
    'flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100';
  const activeClasses = isToggle
    ? 'bg-red-600 text-white shadow-lg'
    : 'bg-cyan-500 text-white shadow-lg';
  const inactiveClasses = 'bg-gray-700 hover:bg-gray-600 text-gray-300';
  const finalTitle = shortcut ? `${title} (${shortcut.toUpperCase()})` : title;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
      title={finalTitle}
    >
      {icon}
      <span className="text-xs mt-1 font-semibold">{label}</span>
    </button>
  );
};

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  setActiveTool,
  onReplay,
  onReset,
  hasSequence,
  isCapturing,
  toggleCapture,
  onAddSlide,
  currentSlideIndex,
  totalSlides,
}) => {
  return (
    <div
      role="toolbar"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-800 bg-opacity-80 backdrop-blur-sm p-3 rounded-xl shadow-2xl border border-gray-700"
    >
      <div className="flex items-center gap-4">
        <ToolButton
          label="Pan/Zoom"
          shortcut="A"
          title="Pan & Zoom"
          icon={<ZoomIcon className="w-6 h-6" />}
          isActive={activeTool === Tool.PAN_ZOOM}
          onClick={() =>
            setActiveTool((prev) =>
              prev === Tool.PAN_ZOOM ? Tool.NONE : Tool.PAN_ZOOM
            )
          }
        />
        <ToolButton
          label="Spotlight"
          shortcut="S"
          title="Spotlight"
          icon={<SpotlightIcon className="w-6 h-6" />}
          isActive={activeTool === Tool.SPOTLIGHT}
          onClick={() =>
            setActiveTool((prev) =>
              prev === Tool.SPOTLIGHT ? Tool.NONE : Tool.SPOTLIGHT
            )
          }
        />
        <ToolButton
          label={isCapturing ? 'Stop' : 'Capture'}
          shortcut="C"
          title={isCapturing ? 'Stop Capturing' : 'Start Capturing'}
          icon={<CaptureIcon className="w-6 h-6" />}
          isActive={isCapturing}
          isToggle={true}
          onClick={toggleCapture}
        />
        <div className="w-px h-10 bg-gray-600"></div>
        <ToolButton
          label="New Slide"
          title="Add New Slide"
          icon={<PlusIcon className="w-6 h-6" />}
          onClick={onAddSlide}
        />
        <div className="flex items-center justify-center text-sm font-semibold text-gray-300 px-3 py-2 bg-gray-700 rounded-md">
          <span>
            {currentSlideIndex + 1} / {totalSlides}
          </span>
        </div>
        <div className="w-px h-10 bg-gray-600"></div>
        <ToolButton
          label="Replay"
          title="Replay Click Sequence"
          icon={<PlayIcon className="w-6 h-6" />}
          onClick={onReplay}
          disabled={!hasSequence}
          isActive={false}
        />
        <ToolButton
          label="Reset All"
          title="Reset Presentation"
          icon={<ResetIcon className="w-6 h-6" />}
          onClick={onReset}
        />
      </div>
    </div>
  );
};
