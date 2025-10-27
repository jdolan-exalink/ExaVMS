
import { servers as defaultServers } from './servers.conf.example';

export interface Server {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  
  // Authentication settings
  auth?: {
    type: 'none' | 'basic' | 'token' | 'frigate';
    username?: string;
    password?: string;
    token?: string;
  };
  
  
  // MQTT settings
  mqtt?: {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    useSSL?: boolean;
    wsPort?: number;
    wsPath?: string;
  };
  
  // Real-time status
  status?: 'online' | 'offline' | 'testing';
  lastTest?: {
    timestamp: number;
    result: 'success' | 'error';
    message?: string;
    responseTime?: number;
  };
  resources?: {
    cpu: number; // percentage
    mem: number; // percentage
    hdd: number; // percentage
    gpu: number; // percentage
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
    const newServer: Server = { 
        ...server, 
        id: server.name.toLowerCase().replace(/\s+/g, '_'),
        // Ensure proper defaults
        auth: server.auth || { type: 'none' },
        mqtt: server.mqtt || { port: 1883, useSSL: false }
    };
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

// Test server connection
export const testServerConnection = async (server: Server): Promise<{ success: boolean; message: string; responseTime?: number }> => {
    const startTime = Date.now();
    
    console.log(`[TEST] ${server.name}: Starting connection test`);
    console.log(`[TEST] ${server.name}: URL: ${server.url}`);
    console.log(`[TEST] ${server.name}: Auth type: ${server.auth?.type || 'none'}`);
    
    try {
        const headers = buildAuthHeaders(server);
        const testUrl = buildTestUrl(server);
        
        console.log(`[TEST] ${server.name}: Test URL: ${testUrl}`);
        console.log(`[TEST] ${server.name}: Headers:`, headers);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const fetchOptions: RequestInit = {
            headers,
            signal: controller.signal,
        };

        if (server.auth && server.auth.type !== 'none') {
            fetchOptions.credentials = 'include';
            console.log(`[TEST] ${server.name}: Using credentials: include`);
        }

        console.log(`[TEST] ${server.name}: Fetching...`);
        const response = await fetch(testUrl, fetchOptions);
        
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        
        console.log(`[TEST] ${server.name}: Response status: ${response.status} ${response.statusText}`);
        console.log(`[TEST] ${server.name}: Response time: ${responseTime}ms`);
        
        if (response.ok) {
            console.log(`[TEST] ${server.name}: Test SUCCESS`);
            return {
                success: true,
                message: `Connection successful (${responseTime}ms)`,
                responseTime
            };
        } else {
            console.log(`[TEST] ${server.name}: Test FAILED - Bad response`);
            return {
                success: false,
                message: `Server responded with ${response.status}: ${response.statusText}`,
                responseTime
            };
        }
    } catch (error) {
        const responseTime = Date.now() - startTime;
        console.error(`[TEST] ${server.name}: Test ERROR:`, error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
            responseTime
        };
    }
};

// Helper function to build authentication headers
export const buildAuthHeaders = (server: Server): Record<string, string> => {
    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': 'ExaVMS/1.0'
    };
    
    if (!server.auth || server.auth.type === 'none') {
        return headers;
    }
    
    switch (server.auth.type) {
        case 'basic':
            if (server.auth.username && server.auth.password) {
                const creds = btoa(`${server.auth.username}:${server.auth.password}`);
                headers['Authorization'] = `Basic ${creds}`;
            }
            break;
        case 'token':
            if (server.auth.token) {
                headers['Authorization'] = `Bearer ${server.auth.token}`;
            }
            break;
        case 'frigate':
            // For frigate, we rely on the browser to send the session cookie.
            // The login is handled separately.
            break;
    }
    
    return headers;
};

export const loginToFrigateServer = async (server: Server): Promise<boolean> => {
    if (server.auth?.type !== 'frigate' || !server.auth.username || !server.auth.password) {
        console.log(`[LOGIN] ${server.name}: Not a Frigate server or no credentials`);
        return true; // Not a frigate server or no creds, nothing to do.
    }

    const loginUrl = buildTestUrl(server).replace('/api/stats', '/api/login');
    console.log(`[LOGIN] ${server.name}: Attempting login to ${loginUrl}`);
    console.log(`[LOGIN] ${server.name}: Username: ${server.auth.username}`);

    try {
        const response = await fetch(loginUrl, {
            credentials: 'include', // Always include credentials for login
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user: server.auth.username,
                password: server.auth.password,
            }),
        });

        console.log(`[LOGIN] ${server.name}: Response status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const cookies = document.cookie;
            console.log(`[LOGIN] ${server.name}: Login SUCCESS`);
            console.log(`[LOGIN] ${server.name}: Cookies after login:`, cookies || 'none');
            return true;
        }

        console.error(`[LOGIN] ${server.name}: Login FAILED - ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.error(`[LOGIN] ${server.name}: Response body:`, text);
        return false;
    } catch (error) {
        console.error(`[LOGIN] ${server.name}: Exception during login:`, error);
        if (error instanceof Error) {
            console.error(`[LOGIN] ${server.name}: Error message:`, error.message);
        }
        return false;
    }
};

// Helper function to build test URL
const buildTestUrl = (server: Server): string => {
    const useProxy = (() => {
        try {
            const env: any = (import.meta as any)?.env || {};
            if (env?.DEV) return true;
            if (env?.VITE_FORCE_PROXY === 'true') return true;
            // Check if running on development ports (3000, 3001, 5173, etc.)
            if (typeof window !== 'undefined') {
                const port = window.location?.port;
                if (port && (port === '3000' || port === '3001' || port === '5173')) return true;
            }
        } catch {}
        return false;
    })();
    
    if (useProxy) {
        return `/proxy/${server.id}/api/stats`;
    }
    
    try {
        return new URL('/api/stats', server.url).toString();
    } catch {
        return `${server.url.replace(/\/$/, '')}/api/stats`;
    }
};

// Update server with test results
export const updateServerTestResult = async (serverId: string, result: 'success' | 'error', message: string, responseTime?: number): Promise<void> => {
    const servers = await getServers();
    const serverIndex = servers.findIndex(s => s.id === serverId);
    
    if (serverIndex === -1) {
        throw new Error("Server not found");
    }
    
    servers[serverIndex].lastTest = {
        timestamp: Date.now(),
        result,
        message,
        responseTime
    };
    
    servers[serverIndex].status = result === 'success' ? 'online' : 'offline';
    
    await saveServers(servers);
};
