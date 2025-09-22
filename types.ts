export enum Tool {
  NONE = 'none',
  PAN_ZOOM = 'pan_zoom',
  SPOTLIGHT = 'spotlight',
}

export interface CanvasTransform {
  scale: number;
  x: number;
  y: number;
}

export interface SpotlightState {
  type: 'circle' | 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
}

export interface Slide {
  id: number;
  mediaUrl: string | null;
  mediaType: 'image' | 'video' | null;
  transform: CanvasTransform;
  spotlight: SpotlightState | null;
}

export interface ClickRecord {
  id: number;
  slideIndex: number;
  x: number;
  y: number;
  toolState: {
    transform: CanvasTransform;
    spotlight: SpotlightState | null;
  };
}
