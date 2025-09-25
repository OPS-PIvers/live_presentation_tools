# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an interactive presentation tool built with React + TypeScript and Vite. The app allows users to create multi-slide presentations with media files, interactive tools like spotlight and pan/zoom, and can record/replay user interactions for demonstration purposes.

## Common Development Commands

- **Start development server**: `npm run dev` (runs on port 3000)
- **Build for production**: `npm run build`
- **Preview production build**: `npm run preview`
- **Install dependencies**: `npm install`

## Environment Setup

Create a `.env.local` file in the root directory and set `GEMINI_API_KEY` to your Gemini API key (though the current codebase doesn't actively use the Gemini API yet).

## Architecture

### Core State Management
- **Slides**: Array of slide objects, each containing media, transform state, and spotlight state
- **Tools**: Enum-based tool system (NONE, PAN_ZOOM, SPOTLIGHT)
- **Recording System**: Click sequence recording with replay functionality
- **Multi-slide Support**: Horizontal slide navigation with smooth transitions

### Key Components

- **App.tsx**: Main application state and orchestration
  - Manages slide collection and current slide index
  - Handles click recording/replay system
  - Coordinates tool states and keyboard shortcuts

- **Canvas.tsx**: Interactive canvas component for each slide
  - Handles media display (images/videos)
  - Implements pan/zoom transformations
  - Manages spotlight overlay rendering
  - Processes user interactions and mouse events

- **Toolbar.tsx**: Top toolbar with tool selection and controls
  - Tool selection buttons with keyboard shortcuts
  - Slide navigation and management
  - Recording controls and replay functionality

- **types.ts**: Core TypeScript interfaces
  - `Slide`: Media URL, transform state, spotlight state
  - `CanvasTransform`: Scale and translation coordinates
  - `SpotlightState`: Circle/rectangle spotlight definitions
  - `ClickRecord`: Recorded interactions with state snapshots

### File Organization
- `/components/` - React components (Canvas, Toolbar, icons)
- `/hooks/` - Custom React hooks (useKeyboardShortcuts)
- Root level - Main app files (App.tsx, index.tsx, types.ts)

### Key Features

- **Multi-slide presentations** with horizontal navigation
- **Media support** for images and videos via file upload
- **Interactive tools**: Pan/zoom and spotlight (circle/rectangle)
- **Recording system** that captures user interactions and can replay them
- **Keyboard shortcuts** for tool switching and navigation
- **Object URL management** with proper cleanup to prevent memory leaks

## Development Notes

- Uses Tailwind CSS via CDN for styling
- File uploads create object URLs that are properly cleaned up on slide changes
- State updates use immutable patterns with spread operators
- Async replay system uses sleep/animation loop for smooth playback
- Canvas coordinates are calculated relative to container bounds