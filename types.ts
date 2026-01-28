
export interface ObservationResult {
  commonName: string;
  scientificName: string;
  behavior: string;
  dangerLevel: 'Low' | 'Moderate' | 'High' | 'Extreme';
  commentary: string;
  stats: {
    aggression: number;
    intelligence: number;
    hydration: number;
  };
}

export interface SavedObservation extends ObservationResult {
  id: string;
  timestamp: number;
  imageData: string; // base64 image captured at the time
}

export enum AppState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  OBSERVING = 'OBSERVING',
  ANALYZING = 'ANALYZING',
  HAZARD = 'HAZARD',
  ERROR = 'ERROR'
}
