# GEMINI.md

## Project Overview

This project is an interactive, web-based presentation tool built with React, TypeScript, and Vite. It allows users to create and navigate a slideshow by adding images or videos to slides. The key feature is the ability to record and replay a sequence of interactions, such as clicks, pans, zooms, and spotlight effects, making it ideal for creating guided demonstrations.

The application features a central canvas for displaying media and a floating toolbar for accessing tools. Users can paste images directly or drag-and-drop files to create new slides.

**Core Technologies:**
*   **Frontend:** React, TypeScript
*   **Build Tool:** Vite
*   **Styling:** (Likely) Tailwind CSS, based on class names like `h-screen`, `flex-col`, `bg-gray-900`.

**Key Features:**
*   Multi-slide presentations from images/videos.
*   **Interactive Tools:**
    *   **Pan & Zoom:** Allows focusing on specific parts of a slide.
    *   **Spotlight:** A tool to highlight areas with a circular or rectangular overlay.
*   **Capture & Replay:** Records user actions (tool usage, clicks) and replays them as an animated sequence.
*   **Keyboard Shortcuts:** Provides quick access to tools and navigation (`A` for Pan/Zoom, `S` for Spotlight, `C` for Capture, Arrow keys for navigation).
*   File input via drag-and-drop and clipboard paste.

## Building and Running

The project uses `npm` for package management and `vite` as the development server and build tool.

**Prerequisites:**
*   Node.js installed.
*   A Gemini API key.

**Setup:**
1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Create a `.env.local` file in the root of the project.
3.  Add your Gemini API key to the `.env.local` file:
    ```
    GEMINI_API_KEY=your_api_key_here
    ```

**Commands:**
*   **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

*   **Build for production:**
    ```bash
    npm run build
    ```
    This creates a `dist` directory with the optimized production assets.

*   **Preview the production build:**
    ```bash
    npm run preview
    ```

## Development Conventions

*   **Component-Based Architecture:** The UI is broken down into reusable React components located in the `src/components` directory (e.g., `Canvas.tsx`, `Toolbar.tsx`).
*   **Styling:** The project uses utility-first CSS classes, which strongly suggests a framework like Tailwind CSS.
*   **State Management:** The main application state is managed within the `App.tsx` component using React hooks (`useState`, `useEffect`, `useCallback`).
*   **Types:** Custom types are defined in `types.ts` and used throughout the application for type safety.
*   **Custom Hooks:** Logic that can be reused across components, like keyboard shortcuts, is extracted into custom hooks (e.g., `useKeyboardShortcuts.ts`).
*   **File Structure:**
    *   `App.tsx`: Main application component and state management.
    *   `index.tsx`: Application entry point.
    *   `components/`: Contains reusable React components.
    *   `hooks/`: Contains custom React hooks.
    *   `types.ts`: TypeScript type definitions.
    *   `vite.config.ts`: Vite build and server configuration.
