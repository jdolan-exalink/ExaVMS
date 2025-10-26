
import { servers as defaultServers } from './servers.conf.example';

export interface Server {
  id: string;
  name: string;
  url: string;
  token?: string;
  enabled: boolean;
  // MQTT settings
  mqttHost?: string;
  mqttPort?: number;
  mqttUser?: string;
  mqttPassword?: string;
  // Real-time status
  status?: 'online' | 'offline';
  resources?: {
    cpu: number; // percentage
    mem: number; // percentage
    hdd: number; // percentage
  };
}

const CONFIG_KEY = 'servers_conf';

export const getServers = (): Promise<Server[]> => {
  return new Promise((resolve) => {
    try {
      const storedConfig = localStorage.getItem(CONFIG_KEY);
      if (storedConfig) {
        resolve(JSON.parse(storedConfig));
      } else {
        // If nothing is stored, initialize with the example config
        localStorage.setItem(CONFIG_KEY, JSON.stringify(defaultServers));
        resolve(defaultServers);
      }
    } catch (error) {
      console.error("Failed to parse server config from localStorage", error);
      // Fallback to default if parsing fails
      resolve(defaultServers);
    }
  });
};

const saveServers = (servers: Server[]): Promise<void> => {
    return new Promise((resolve) => {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(servers));
        resolve();
    });
};


export const addServer = async (server: Omit<Server, 'id'>): Promise<Server> => {
    const servers = await getServers();
    const newServer: Server = { ...server, id: `server_${Date.now()}` };
    const updatedServers = [...servers, newServer];
    await saveServers(updatedServers);
    return newServer;
};

export const updateServer = async (updatedServer: Server): Promise<Server> => {
    const servers = await getServers();
    const serverIndex = servers.findIndex(s => s.id === updatedServer.id);
    if (serverIndex === -1) {
        throw new Error("Server not found");
    }
    const updatedServers = [...servers];
    updatedServers[serverIndex] = updatedServer;
    await saveServers(updatedServers);
    return updatedServer;
};

export const deleteServer = async (serverId: string): Promise<void> => {
    const servers = await getServers();
    const updatedServers = servers.filter(s => s.id !== serverId);
    await saveServers(updatedServers);
};
