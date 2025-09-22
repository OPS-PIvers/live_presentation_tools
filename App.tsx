import React, { useState, useEffect, useCallback } from 'react';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { Tool, CanvasTransform, SpotlightState, ClickRecord } from './types';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool>(Tool.NONE);
  const [isCapturing, setIsCapturing] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [clickSequence, setClickSequence] = useState<ClickRecord[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleCapture = useCallback(() => setIsCapturing(prev => !prev), []);
  useKeyboardShortcuts(setActiveTool, toggleCapture);
  
  const handleReset = useCallback(() => {
      setIsPlaying(false);
      setClickSequence([]);
      setActiveTool(Tool.NONE);
      setIsCapturing(false);
  }, []);

  const handleFile = useCallback((file: File) => {
    if (file) {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;
      if (type) {
        if(mediaUrl) URL.revokeObjectURL(mediaUrl);
        setMediaUrl(url);
        setMediaType(type);
        handleReset();
      } else {
        alert('Unsupported file type. Please use an image or video.');
      }
    }
  }, [handleReset, mediaUrl]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) handleFile(file);
            break;
          }
        }
      }
    };

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      document.body.classList.remove('bg-gray-700');
      if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
        handleFile(event.dataTransfer.files[0]);
        event.dataTransfer.clearData();
      }
    };
    
    const handleDragOver = (event: DragEvent) => {
        event.preventDefault();
        document.body.classList.add('bg-gray-700');
    };
    const handleDragLeave = (event: DragEvent) => {
        event.preventDefault();
        document.body.classList.remove('bg-gray-700');
    }

    window.addEventListener('paste', handlePaste);
    window.addEventListener('drop', handleDrop);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);

    return () => {
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('drop', handleDrop);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
    };
  }, [handleFile]);

  const handleRecordClick = (x: number, y: number, transform: CanvasTransform, spotlight: SpotlightState | null) => {
    if (!isCapturing) return;
    setClickSequence(prev => [
      ...prev,
      { id: Date.now(), x, y, toolState: { transform, spotlight } }
    ]);
  };
  
  const handleReplay = () => {
    if (clickSequence.length > 0 && !isPlaying) {
      setIsPlaying(true);
    }
  };

  const handleReplayFinished = () => {
    setIsPlaying(false);
  };
  
  const handleFullReset = () => {
    if(mediaUrl) URL.revokeObjectURL(mediaUrl);
    setMediaUrl(null);
    setMediaType(null);
    handleReset();
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 font-sans">
      <Toolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        onReplay={handleReplay}
        onReset={handleFullReset}
        hasSequence={clickSequence.length > 0 && !isPlaying}
        isCapturing={isCapturing}
        toggleCapture={toggleCapture}
      />
      <main className="flex-grow pt-[80px]">
        <Canvas 
          mediaUrl={mediaUrl}
          mediaType={mediaType}
          activeTool={activeTool}
          isCapturing={isCapturing}
          onRecordClick={handleRecordClick}
          isPlaying={isPlaying}
          clickSequence={clickSequence}
          onReplayFinished={handleReplayFinished}
        />
      </main>
    </div>
  );
};

export default App;
