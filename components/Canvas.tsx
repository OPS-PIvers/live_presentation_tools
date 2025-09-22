import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Tool, CanvasTransform, SpotlightState, ClickRecord } from '../types';

interface CanvasProps {
  mediaUrl: string | null;
  mediaType: 'image' | 'video' | null;
  activeTool: Tool;
  isCapturing: boolean;
  onRecordClick: (x: number, y: number, transform: CanvasTransform, spotlight: SpotlightState | null) => void;
  isPlaying: boolean;
  clickSequence: ClickRecord[];
  onReplayFinished: () => void;
}

const INITIAL_TRANSFORM: CanvasTransform = { scale: 1, x: 0, y: 0 };
const CIRCLE_RADIUS = 60;
const ZOOM_FACTOR = 1.5;
const DRAG_THRESHOLD = 10; // pixels

export const Canvas: React.FC<CanvasProps> = ({ mediaUrl, mediaType, activeTool, isCapturing, onRecordClick, isPlaying, clickSequence, onReplayFinished }) => {
  const [transform, setTransform] = useState<CanvasTransform>(INITIAL_TRANSFORM);
  const [spotlight, setSpotlight] = useState<SpotlightState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [replayState, setReplayState] = useState({
      cursorPos: { x: -100, y: -100 },
      currentIndex: -1,
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const resetView = useCallback(() => {
    setTransform(INITIAL_TRANSFORM);
    setSpotlight(null);
  }, []);

  useEffect(() => {
    // This effect manages the entire replay lifecycle.
    if (!isPlaying) {
      // When not playing, hide the replay cursor.
      // Do NOT reset the transform/spotlight here, as that was causing the bug.
      // The canvas should remain in its last state after a user interaction.
      setReplayState({ cursorPos: { x: -100, y: -100 }, currentIndex: -1 });
      return;
    }
    
    // --- Replay is starting ---
    
    // 1. Reset the canvas view to its initial state for the replay.
    setTransform(INITIAL_TRANSFORM);
    setSpotlight(null);

    let currentStep = 0;
    let animationFrameId: number;
    let timeoutId: ReturnType<typeof setTimeout>;

    const animateStep = () => {
        if (currentStep >= clickSequence.length) {
            onReplayFinished();
            return;
        }

        const target = clickSequence[currentStep];
        const startPos = currentStep === 0 
            ? { x: canvasRef.current!.clientWidth / 2, y: canvasRef.current!.clientHeight / 2 } 
            : { x: clickSequence[currentStep - 1].x, y: clickSequence[currentStep - 1].y };
        
        let startTime: number | null = null;
        const duration = 800; // ms to move cursor

        const moveCursor = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            
            const newX = startPos.x + (target.x - startPos.x) * progress;
            const newY = startPos.y + (target.y - startPos.y) * progress;

            setReplayState({ cursorPos: { x: newX, y: newY }, currentIndex: currentStep });

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(moveCursor);
            } else {
                // Arrived at target: apply the recorded state from this step
                setTransform(target.toolState.transform);
                setSpotlight(target.toolState.spotlight);
                
                // Pause for effect, then move to the next step
                timeoutId = setTimeout(() => {
                    currentStep++;
                    animateStep();
                }, 400);
            }
        };
        animationFrameId = requestAnimationFrame(moveCursor);
    };

    // 2. Start the animation.
    // Use a small timeout to ensure React has processed the state reset from step 1.
    const startTimeoutId = setTimeout(animateStep, 50);

    // 3. Cleanup function to stop animations if component unmounts or `isPlaying` becomes false.
    return () => {
        clearTimeout(startTimeoutId);
        clearTimeout(timeoutId);
        cancelAnimationFrame(animationFrameId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, onReplayFinished]); // clickSequence is intentionally omitted to prevent re-triggering mid-replay


  const getClickCoords = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // This handler now ONLY deals with non-spotlight tools.
    // Spotlight logic is handled entirely in mouse down/move/up.
    if (e.detail !== 1 || isPlaying || activeTool === Tool.SPOTLIGHT) return;
    
    const { x, y } = getClickCoords(e);
    
    let nextTransform = transform;
    
    if (activeTool === Tool.PAN_ZOOM) {
      const newScale = transform.scale * ZOOM_FACTOR;
      const { width, height } = canvasRef.current!.getBoundingClientRect();
      // Point on unscaled image
      const imgX = (x - transform.x) / transform.scale;
      const imgY = (y - transform.y) / transform.scale;
      // New translation to center this point
      const newX = width / 2 - imgX * newScale;
      const newY = height / 2 - imgY * newScale;
      
      nextTransform = { scale: newScale, x: newX, y: newY };
      setTransform(nextTransform);
      setSpotlight(null); // Clear spotlight when panning/zooming
    }

    if (isCapturing) {
      onRecordClick(x, y, nextTransform, null);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPlaying) return;
    e.preventDefault();
    resetView();
  };
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPlaying) return;
    
    if (activeTool === Tool.SPOTLIGHT) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart(getClickCoords(e));
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || activeTool !== Tool.SPOTLIGHT || isPlaying) return;
    
    const currentPos = getClickCoords(e);
    const distance = Math.sqrt(
      Math.pow(currentPos.x - dragStart.x, 2) + Math.pow(currentPos.y - dragStart.y, 2)
    );

    // Only start drawing the rectangle if the user has dragged a meaningful amount
    if (distance < DRAG_THRESHOLD) {
        setSpotlight(null);
        return;
    }

    const x = Math.min(dragStart.x, currentPos.x);
    const y = Math.min(dragStart.y, currentPos.y);
    const width = Math.abs(dragStart.x - currentPos.x);
    const height = Math.abs(dragStart.y - currentPos.y);
    setSpotlight({ type: 'rect', x, y, width, height, radius: 0 });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || activeTool !== Tool.SPOTLIGHT) {
      if (isDragging) setIsDragging(false);
      return;
    }
    
    const endPos = getClickCoords(e);
    const distance = Math.sqrt(
      Math.pow(endPos.x - dragStart.x, 2) + Math.pow(endPos.y - dragStart.y, 2)
    );

    let finalSpotlight: SpotlightState;

    if (distance < DRAG_THRESHOLD) { // This was a click.
      finalSpotlight = { type: 'circle', x: endPos.x, y: endPos.y, radius: CIRCLE_RADIUS, width: 0, height: 0 };
    } else { // This was a drag.
      const x = Math.min(dragStart.x, endPos.x);
      const y = Math.min(dragStart.y, endPos.y);
      const width = Math.abs(dragStart.x - endPos.x);
      const height = Math.abs(dragStart.y - endPos.y);
      finalSpotlight = { type: 'rect', x, y, width, height, radius: 0 };
    }
    
    setSpotlight(finalSpotlight);

    if (isCapturing) {
      onRecordClick(endPos.x, endPos.y, transform, finalSpotlight);
    }
    
    setIsDragging(false);
  };


  return (
    <div
      ref={canvasRef}
      className="w-full h-full bg-gray-800 overflow-hidden relative select-none cursor-crosshair"
      onClick={handleCanvasClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {mediaUrl ? (
        <div
          className="absolute top-0 left-0 w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
          style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}
        >
          {mediaType === 'image' && <img ref={imageRef} src={mediaUrl} className="max-w-full max-h-full object-contain shadow-lg" alt="presentation content" draggable="false" />}
          {mediaType === 'video' && <video ref={videoRef} src={mediaUrl} className="max-w-full max-h-full object-contain shadow-lg" controls />}
        </div>
      ) : (
         <div className="w-full h-full flex items-center justify-center text-gray-500 text-2xl font-semibold border-4 border-dashed border-gray-600 rounded-2xl">
            <p>Paste an image or drop a file here</p>
         </div>
      )}
      
      {spotlight && (
         <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
            <defs>
                <mask id="spotlight-mask">
                    <rect width="100%" height="100%" fill="white" />
                    {spotlight.type === 'circle' && <circle cx={spotlight.x} cy={spotlight.y} r={spotlight.radius} fill="black" />}
                    {spotlight.type === 'rect' && <rect x={spotlight.x} y={spotlight.y} width={spotlight.width} height={spotlight.height} fill="black" />}
                </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.8)" mask="url(#spotlight-mask)" />
        </svg>
      )}

      {isPlaying && (
        <div 
          className="absolute z-50 w-8 h-8 rounded-full bg-yellow-400 border-2 border-white shadow-lg pointer-events-none transition-transform duration-75"
          style={{ 
            left: 0, 
            top: 0,
            transform: `translate(${replayState.cursorPos.x - 16}px, ${replayState.cursorPos.y - 16}px)`,
          }}
        >
           <div className="w-full h-full rounded-full bg-yellow-400 animate-ping"></div>
        </div>
      )}
    </div>
  );
};