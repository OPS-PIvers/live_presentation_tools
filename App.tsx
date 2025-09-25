import React, { useState, useEffect, useCallback } from 'react';

import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { ReplayControls } from './components/Replay';
import {
  Tool,
  CanvasTransform,
  SpotlightState,
  ClickRecord,
  Slide,
} from './types';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { ChevronLeftIcon, ChevronRightIcon } from './components/icons';

const INITIAL_TRANSFORM: CanvasTransform = { scale: 1, x: 0, y: 0 };
const createEmptySlide = (): Slide => ({
  id: Date.now(),
  mediaUrl: null,
  mediaType: null,
  transform: INITIAL_TRANSFORM,
  spotlight: null,
});

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool>(Tool.NONE);
  const [isCapturing, setIsCapturing] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([createEmptySlide()]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [clickSequence, setClickSequence] = useState<ClickRecord[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStepping, setIsStepping] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [replayCursor, setReplayCursor] = useState<{
    x: number;
    y: number;
    slideIndex: number;
  } | null>(null);

  const addSlide = () => {
    setSlides((prev) => [
      ...prev,
      { ...createEmptySlide(), id: Date.now() + prev.length },
    ]);
    setCurrentSlideIndex(slides.length);
  };

  const goToNextSlide = useCallback(() => {
    if (isPlaying) return;
    setCurrentSlideIndex((prev) => Math.min(prev + 1, slides.length - 1));
  }, [isPlaying, slides.length]);

  const goToPrevSlide = useCallback(() => {
    if (isPlaying) return;
    setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
  }, [isPlaying]);

  const toggleCapture = useCallback(() => setIsCapturing((prev) => !prev), []);
  useKeyboardShortcuts(
    setActiveTool,
    toggleCapture,
    goToNextSlide,
    goToPrevSlide
  );

  const handleFileForSlide = useCallback((file: File, slideIndex: number) => {
    if (file) {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
          ? 'video'
          : null;
      if (type) {
        setSlides((prevSlides) => {
          const newSlides = [...prevSlides];
          const slideToUpdate = newSlides[slideIndex];
          if (slideToUpdate) {
            if (slideToUpdate.mediaUrl) {
              URL.revokeObjectURL(slideToUpdate.mediaUrl);
            }
            newSlides[slideIndex] = {
              ...slideToUpdate,
              mediaUrl: url,
              mediaType: type,
            };
          }
          return newSlides;
        });
      } else {
        alert('Unsupported file type. Please use an image or video.');
      }
    }
  }, []);

  const updateSlideState = useCallback(
    (slideIndex: number, updates: Partial<Slide>) => {
      setSlides((prev) => {
        const newSlides = [...prev];
        const slideToUpdate = newSlides[slideIndex];
        if (slideToUpdate) {
          newSlides[slideIndex] = { ...slideToUpdate, ...updates };
        }
        return newSlides;
      });
    },
    []
  );

  const handleRecordClick = (
    x: number,
    y: number,
    transform: CanvasTransform,
    spotlight: SpotlightState | null
  ) => {
    if (!isCapturing) return;
    setClickSequence((prev) => [
      ...prev,
      {
        id: Date.now(),
        slideIndex: currentSlideIndex,
        x,
        y,
        toolState: { transform, spotlight },
      },
    ]);
  };

  const handleReplay = () => {
    if (clickSequence.length > 0 && !isPlaying) {
      setIsPlaying(true);
    }
  };

  const handleStepReplay = () => {
    if (clickSequence.length > 0 && !isStepping) {
      setIsStepping(true);
      setCurrentStep(0);
      // Reset all slides to initial state before starting
      setSlides((prev) =>
        prev.map((slide) => ({
          ...slide,
          transform: INITIAL_TRANSFORM,
          spotlight: null,
        }))
      );
    }
  };

  const handleNextStep = () => {
    if (currentStep < clickSequence.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleExitStepping = () => {
    setIsStepping(false);
    setCurrentStep(0);
  };

  const handleFullReset = () => {
    slides.forEach((slide) => {
      if (slide.mediaUrl) URL.revokeObjectURL(slide.mediaUrl);
    });
    setSlides([createEmptySlide()]);
    setCurrentSlideIndex(0);
    setClickSequence([]);
    setIsPlaying(false);
    setActiveTool(Tool.NONE);
    setIsCapturing(false);
  };

  useEffect(() => {
    if (!isStepping || clickSequence.length === 0) return;

    const record = clickSequence[currentStep];
    if (!record) return;

    setCurrentSlideIndex(record.slideIndex);

    setReplayCursor({
      x: record.x,
      y: record.y,
      slideIndex: record.slideIndex,
    });

    updateSlideState(record.slideIndex, {
      transform: record.toolState.transform,
      spotlight: record.toolState.spotlight,
    });
  }, [isStepping, currentStep, clickSequence, updateSlideState]);

  useEffect(() => {
    if (!isPlaying) {
      setReplayCursor(null);
      return;
    }

    let isCancelled = false;
    let step = 0;

    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const animateStep = async () => {
      if (isCancelled || step >= clickSequence.length) {
        setIsPlaying(false);
        return;
      }

      const record = clickSequence[step];
      if (!record) return;

      if (record.slideIndex !== currentSlideIndex) {
        setCurrentSlideIndex(record.slideIndex);
        await sleep(500); // Wait for slide transition
      }
      if (isCancelled) return;

      // Animate cursor (simplified for this example, you could use rAF for smoother animation)
      setReplayCursor({
        x: record.x,
        y: record.y,
        slideIndex: record.slideIndex,
      });
      await sleep(800);
      if (isCancelled) return;

      // Apply state
      updateSlideState(record.slideIndex, {
        transform: record.toolState.transform,
        spotlight: record.toolState.spotlight,
      });

      await sleep(400);
      if (isCancelled) return;

      step++;
      animateStep();
    };

    // Reset all slides to initial state before starting
    setSlides((prev) =>
      prev.map((slide) => ({
        ...slide,
        transform: INITIAL_TRANSFORM,
        spotlight: null,
      }))
    );
    sleep(50).then(animateStep);

    return () => {
      isCancelled = true;
    };
  }, [isPlaying, clickSequence, currentSlideIndex, updateSlideState]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 font-sans overflow-hidden">
      <Toolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        onReplay={handleReplay}
        onStepReplay={handleStepReplay}
        onReset={handleFullReset}
        hasSequence={clickSequence.length > 0 && !isPlaying}
        isCapturing={isCapturing}
        toggleCapture={toggleCapture}
        onAddSlide={addSlide}
        currentSlideIndex={currentSlideIndex}
        totalSlides={slides.length}
      />
      <main className="flex-grow pb-[120px] sm:pb-0 sm:pt-[80px] relative">
        {isStepping && (
          <ReplayControls
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            onExit={handleExitStepping}
            currentStep={currentStep}
            totalSteps={clickSequence.length}
          />
        )}
        <div
          className="w-full h-full flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSlideIndex * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div key={slide.id} className="w-full h-full flex-shrink-0">
              <Canvas
                mediaUrl={slide.mediaUrl}
                mediaType={slide.mediaType}
                transform={slide.transform}
                spotlight={slide.spotlight}
                activeTool={activeTool}
                isCapturing={isCapturing}
                onRecordClick={handleRecordClick}
                isPlaying={isPlaying}
                replayCursorPos={
                  replayCursor?.slideIndex === index
                    ? { x: replayCursor.x, y: replayCursor.y }
                    : null
                }
                onTransformChange={(transform) =>
                  updateSlideState(index, { transform })
                }
                onSpotlightChange={(spotlight) =>
                  updateSlideState(index, { spotlight })
                }
                onFile={(file) => handleFileForSlide(file, index)}
              />
            </div>
          ))}
        </div>
        {!isPlaying && (
          <>
            <button
              onClick={goToPrevSlide}
              disabled={currentSlideIndex === 0}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-1 sm:p-2 bg-gray-800 bg-opacity-50 rounded-full hover:bg-opacity-80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Previous Slide (Left Arrow)"
            >
              <ChevronLeftIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </button>
            <button
              onClick={goToNextSlide}
              disabled={currentSlideIndex === slides.length - 1}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-1 sm:p-2 bg-gray-800 bg-opacity-50 rounded-full hover:bg-opacity-80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Next Slide (Right Arrow)"
            >
              <ChevronRightIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </button>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
