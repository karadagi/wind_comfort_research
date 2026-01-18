
export interface SceneProps {
  progress: number; // 0 to 1 progress within the scene
  isActive: boolean;
}

export enum ComfortClass {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E'
}

export const COMFORT_COLORS: Record<ComfortClass, string> = {
  [ComfortClass.A]: '#4ade80', // green-400
  [ComfortClass.B]: '#a3e635', // lime-400
  [ComfortClass.C]: '#facc15', // yellow-400
  [ComfortClass.D]: '#fb923c', // orange-400
  [ComfortClass.E]: '#f87171'  // red-400
};

export const WIND_COLORS = {
  low: '#93c5fd',    // blue-300
  medium: '#fbbf24', // amber-400
  high: '#ef4444'    // red-500
};
