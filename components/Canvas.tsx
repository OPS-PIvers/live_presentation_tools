import React, { useRef, useState, useCallback, useEffect } from 'react';

import { Tool, CanvasTransform, SpotlightState } from '../types';

import { UploadIcon } from './icons';

interface CanvasProps {
  mediaUrl: string | null;
  mediaType: 'image' | 'video' | null;
  transform: CanvasTransform;
  spotlight: SpotlightState | null;
  activeTool: Tool;
  isCapturing: boolean;
  isPlaying: boolean;
  replayCursorPos: { x: number; y: number } | null;
  onTransformChange: (transform: CanvasTransform) => void;
  onSpotlightChange: (spotlight: SpotlightState | null) => void;
  onRecordClick: (
    x: number,
    y: number,
    transform: CanvasTransform,
    spotlight: SpotlightState | null
  ) => void;
  onFile: (file: File) => void;
}

const INITIAL_TRANSFORM: CanvasTransform = { scale: 1, x: 0, y: 0 };
const CIRCLE_RADIUS = 60;
const ZOOM_FACTOR = 1.5;
const DRAG_THRESHOLD = 10; // pixels

export const Canvas: React.FC<CanvasProps> = ({
  mediaUrl,
  mediaType,
  transform,
  spotlight,
  activeTool,
  isCapturing,
  isPlaying,
  replayCursorPos,
  onTransformChange,
  onSpotlightChange,
  onRecordClick,
  onFile,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetView = useCallback(() => {
    onTransformChange(INITIAL_TRANSFORM);
    onSpotlightChange(null);
  }, [onTransformChange, onSpotlightChange]);

  const getClickCoords = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.detail !== 1 || isPlaying || activeTool === Tool.SPOTLIGHT) return;
    const { x, y } = getClickCoords(e);
    let nextTransform = transform;

    if (activeTool === Tool.PAN_ZOOM && canvasRef.current) {
      const newScale = transform.scale * ZOOM_FACTOR;
      const { width, height } = canvasRef.current.getBoundingClientRect();
      const imgX = (x - transform.x) / transform.scale;
      const imgY = (y - transform.y) / transform.scale;
      const newX = width / 2 - imgX * newScale;
      const newY = height / 2 - imgY * newScale;
      nextTransform = { scale: newScale, x: newX, y: newY };
      onTransformChange(nextTransform);
      onSpotlightChange(null);
    }

    if (isCapturing) {
      onRecordClick(x, y, nextTransform, null);
    }
  };

  const handleKeyboardActivation = () => {
    if (isPlaying || activeTool === Tool.SPOTLIGHT) return;

    // For keyboard activation, use center of canvas as the click point
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    let nextTransform = transform;

    if (activeTool === Tool.PAN_ZOOM) {
      const newScale = transform.scale * ZOOM_FACTOR;
      const { width, height } = rect;
      const imgX = (centerX - transform.x) / transform.scale;
      const imgY = (centerY - transform.y) / transform.scale;
      const newX = width / 2 - imgX * newScale;
      const newY = height / 2 - imgY * newScale;
      nextTransform = { scale: newScale, x: newX, y: newY };
      onTransformChange(nextTransform);
      onSpotlightChange(null);
    }

    if (isCapturing) {
      onRecordClick(centerX, centerY, nextTransform, null);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPlaying) return;
    e.preventDefault();
    resetView();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFile(file);
      // Reset the input so the same file can be selected again
      e.target.value = '';
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPlaying || activeTool !== Tool.SPOTLIGHT) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart(getClickCoords(e));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || activeTool !== Tool.SPOTLIGHT || isPlaying) return;
    const currentPos = getClickCoords(e);
    const distance = Math.hypot(
      currentPos.x - dragStart.x,
      currentPos.y - dragStart.y
    );

    if (distance < DRAG_THRESHOLD) {
      onSpotlightChange(null);
      return;
    }
    const x = Math.min(dragStart.x, currentPos.x);
    const y = Math.min(dragStart.y, currentPos.y);
    const width = Math.abs(dragStart.x - currentPos.x);
    const height = Math.abs(dragStart.y - currentPos.y);
    onSpotlightChange({ type: 'rect', x, y, width, height, radius: 0 });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || activeTool !== Tool.SPOTLIGHT) {
      if (isDragging) setIsDragging(false);
      return;
    }
    const endPos = getClickCoords(e);
    const distance = Math.hypot(endPos.x - dragStart.x, endPos.y - dragStart.y);

    let finalSpotlight: SpotlightState;
    if (distance < DRAG_THRESHOLD) {
      finalSpotlight = {
        type: 'circle',
        x: endPos.x,
        y: endPos.y,
        radius: CIRCLE_RADIUS,
        width: 0,
        height: 0,
      };
    } else {
      const x = Math.min(dragStart.x, endPos.x);
      const y = Math.min(dragStart.y, endPos.y);
      const width = Math.abs(dragStart.x - endPos.x);
      const height = Math.abs(dragStart.y - endPos.y);
      finalSpotlight = { type: 'rect', x, y, width, height, radius: 0 };
    }
    onSpotlightChange(finalSpotlight);

    if (isCapturing) {
      onRecordClick(endPos.x, endPos.y, transform, finalSpotlight);
    }
    setIsDragging(false);
  };

  useEffect(() => {
    const pasteTarget = canvasRef.current;
    if (!pasteTarget) return;

    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.includes('image')) {
          const file = item.getAsFile();
          if (file) onFile(file);
          break;
        }
      }
    };

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      pasteTarget.classList.remove('bg-gray-700', 'border-cyan-400');
      if (event.dataTransfer?.files?.[0]) {
        onFile(event.dataTransfer.files[0]);
      }
    };

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      pasteTarget.classList.add('bg-gray-700', 'border-cyan-400');
    };

    const handleDragLeave = (event: DragEvent) => {
      event.preventDefault();
      pasteTarget.classList.remove('bg-gray-700', 'border-cyan-400');
    };

    pasteTarget.addEventListener('paste', handlePaste);
    pasteTarget.addEventListener('drop', handleDrop);
    pasteTarget.addEventListener('dragover', handleDragOver);
    pasteTarget.addEventListener('dragleave', handleDragLeave);

    return () => {
      pasteTarget.removeEventListener('paste', handlePaste);
      pasteTarget.removeEventListener('drop', handleDrop);
      pasteTarget.removeEventListener('dragover', handleDragOver);
      pasteTarget.removeEventListener('dragleave', handleDragLeave);
    };
  }, [onFile]);

  return (
    <div
      ref={canvasRef}
      className="w-full h-full bg-gray-800 overflow-hidden relative select-none cursor-crosshair focus:outline-none transition-colors duration-300"
      role="button"
      tabIndex={0} // Makes the div focusable for paste events
      onClick={handleCanvasClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleKeyboardActivation();
        }
      }}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {mediaUrl ? (
        <div
          className="absolute top-0 left-0 w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          }}
        >
          {mediaType === 'image' && (
            <img
              ref={imageRef}
              src={mediaUrl}
              className="max-w-full max-h-full object-contain shadow-lg"
              alt="presentation content"
              draggable="false"
            />
          )}
          {mediaType === 'video' && (
            <video
              ref={videoRef}
              src={mediaUrl}
              className="max-w-full max-h-full object-contain shadow-lg"
              controls
            >
              <track kind="captions" />
            </video>
          )}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg sm:text-xl md:text-2xl font-semibold border-4 border-dashed border-gray-600 rounded-2xl">
          <div className="p-4 space-y-4 flex items-center justify-center flex-col">
            <p>Paste, drop, or upload media files</p>
            <button
              onClick={handleUploadClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-base font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              <UploadIcon className="w-5 h-5" />
              Choose File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Upload media file"
            />
          </div>
        </div>
      )}

      {spotlight && (
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {spotlight.type === 'circle' && (
                <circle
                  cx={spotlight.x}
                  cy={spotlight.y}
                  r={spotlight.radius}
                  fill="black"
                />
              )}
              {spotlight.type === 'rect' && (
                <rect
                  x={spotlight.x}
                  y={spotlight.y}
                  width={spotlight.width}
                  height={spotlight.height}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.8)"
            mask="url(#spotlight-mask)"
          />
        </svg>
      )}

      {replayCursorPos && (
        <div
          className="absolute z-50 w-8 h-8 rounded-full bg-yellow-400 border-2 border-white shadow-lg pointer-events-none"
          style={{
            left: transform.x + replayCursorPos.x * transform.scale - 16,
            top: transform.y + replayCursorPos.y * transform.scale - 16,
          }}
        >
          <div className="w-full h-full rounded-full bg-yellow-400 animate-ping"></div>
        </div>
      )}
    </div>
  );
};
