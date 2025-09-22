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

export interface ClickRecord {
  id: number;
  x: number;
  y: number;
  toolState: {
    transform: CanvasTransform;
    spotlight: SpotlightState | null;
  };
}
