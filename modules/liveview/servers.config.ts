export interface ServerConfig {
  id: string;
  name:string;
  url: string;
  enabled: boolean;
}

// This file replaces the requested CONF/servers.conf for a web environment.
export const servers: ServerConfig[] = [
    { id: 'server1', name: 'Main Warehouse', url: 'http://frigate.main.warehouse', enabled: true },
    { id: 'server2', name: 'Office Building', url: 'http://frigate.office.building', enabled: true },
    { id: 'server3', name: 'Parking Lot', url: 'http://frigate.parking.lot', enabled: false },
];
