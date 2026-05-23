export type ActivePage = 'map' | 'layers' | 'report' | 'dashboard';

export interface Stop {
  id: string;
  name: string;
  street: string;
  intensity: 'low' | 'medium' | 'high';
  trafficScore: number; // 0 - 100 percentage or count
  lines: string[];
  lat: number; // mapped coordinates on our detailed mockup grid
  lng: number; // mapped coordinates on our detailed mockup grid
  description: string;
  dailyPassengers: number;
}

export interface MapLayer {
  id: 'bdot10k' | 'satellite' | 'terrain' | 'transit-flow';
  name: string;
  visible: boolean;
}

export type AnalysisTab = 'tab1' | 'tab2' | 'tab3' | 'tab4' | 'tab5';

export interface TabInfo {
  id: AnalysisTab;
  label: string;
  description: string;
}

export interface ChartDataPoint {
  time: string;
  flowCount: number;
  delayMinutes: number;
  averageSpeed: number;
}

export interface ZoneDataPoint {
  zone: string;
  passengers: number;
  capacity: number;
}
