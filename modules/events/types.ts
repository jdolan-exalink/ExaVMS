
export type ObjectType = 'person' | 'car' | 'motorcycle' | 'bicycle' | 'bus' | 'truck';

export interface Event {
  id: string;
  timestamp: string;
  serverName: string;
  cameraId: string;
  cameraName: string;
  thumbnailUrl: string;
  videoUrl: string;
  objects: ObjectType[];
}

export interface EventFilters {
  searchType: 'time' | 'detection';
  serverId: string | 'all';
  cameraId: string | 'all';
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  objects: ObjectType[];
}
