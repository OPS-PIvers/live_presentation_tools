import React from 'react';

import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface ReplayControlsProps {
  onNext: () => void;
  onPrev: () => void;
  onExit: () => void;
  currentStep: number;
  totalSteps: number;
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({
  onNext,
  onPrev,
  onExit,
  currentStep,
  totalSteps,
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-gray-800 bg-opacity-80 backdrop-blur-sm p-3 rounded-xl shadow-2xl border border-gray-700 flex items-center gap-4">
      <button
        onClick={onPrev}
        disabled={currentStep === 0}
        className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        title="Previous Step"
      >
        <ChevronLeftIcon className="w-6 h-6 text-white" />
      </button>
      <div className="text-white font-semibold">
        Step: {currentStep + 1} / {totalSteps}
      </div>
      <button
        onClick={onNext}
        disabled={currentStep >= totalSteps - 1}
        className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        title="Next Step"
      >
        <ChevronRightIcon className="w-6 h-6 text-white" />
      </button>
      <button
        onClick={onExit}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
        title="Exit Stepping Mode"
      >
        Exit
      </button>
    </div>
  );
};