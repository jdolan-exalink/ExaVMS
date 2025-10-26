import { UserRole } from '../../types';
import { Server } from '../../config/serverConfig';

export interface StreamInfo {
  url: string;
  roles: string[];
}

export interface Camera {
  id: string; // camera name, e.g., 'front_door'
  name: string; // user-friendly name, e.g., 'Front Door'
  server: Server; // Reference to the server it belongs to
  streams: {
      main?: string; // The go2rtc WebRTC URL for the main stream
      sub?: string; // The go2rtc WebRTC URL for the sub stream
  };
  isOnline: boolean;
}


export interface GridCellState {
  id: number;
  camera: Camera | null;
  quality: 'main' | 'sub';
}

export type GridLayout = '1x1' | '2x2' | '3x3' | '1+5' | '1+11';

export interface SavedView {
  id: string;
  name: string;
  gridState: GridCellState[];
  layout: GridLayout;
  ownerId: string;
  sharedWith: UserRole[]; // An array of roles it's shared with. Empty means personal.
}

export type { UserRole };