
import type { Server } from '../config/serverConfig';
import { buildAuthHeaders, loginToFrigateServer } from '../config/serverConfig';

export interface ServerStatus {
  status: 'online' | 'offline';
  resources: {
    cpu: number; // percentage
    mem: number; // percentage
    hdd: number; // percentage
    gpu: number; // percentage
  };
}

interface FrigateStats {
  cpu_usages?: { [key: string]: { cpu: number } };
  gpu_usages?: { [key: string]: { gpu: number, mem: number } };
  nvidia?: { [key: string]: { gpu: number, mem: number } };
  intel_gpu?: { [key: string]: { usage: number } };
  amd_gpu?: { [key: string]: { usage: number } };
  service?: {
    storage?: {
      [key: string]: {
        total: number;
        used: number;
      };
    };
    mem_used?: number;
    mem_total?: number;
    mem_percentage?: number;
  };
}

// Fetches real status from a Frigate server
export const fetchServerStatus = async (server: Server): Promise<ServerStatus> => {
  const startTime = Date.now();
  console.log(`[STATUS] Fetching status for ${server.name} (${server.id})`);
  
  try {
    // Attempt login for Frigate servers before fetching stats
    if (server.auth?.type === 'frigate') {
      console.log(`[STATUS] ${server.name}: Attempting Frigate login...`);
      const loginSuccess = await loginToFrigateServer(server);
      console.log(`[STATUS] ${server.name}: Login ${loginSuccess ? 'SUCCESS' : 'FAILED'}`);
    }
    
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
    
    const buildApiUrl = (apiPath: string): string => {
      if (useProxy) return `/proxy/${server.id}${apiPath}`;
      try { return new URL(apiPath, server.url).toString(); } catch { return `${server.url.replace(/\/$/, '')}${apiPath}`; }
    };
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const headers = buildAuthHeaders(server);
    const statsUrl = buildApiUrl('/api/stats');
    
    console.log(`[STATUS] ${server.name}: Fetching ${statsUrl}`);
    console.log(`[STATUS] ${server.name}: Using proxy: ${useProxy}`);
    console.log(`[STATUS] ${server.name}: Auth type: ${server.auth?.type || 'none'}`);
    
    const fetchOptions: RequestInit = { 
      headers, 
      signal: controller.signal 
    };
    
    // Include credentials for Frigate auth to send cookies
    if (server.auth?.type === 'frigate') {
      fetchOptions.credentials = 'include';
      console.log(`[STATUS] ${server.name}: Including credentials for cookies`);
    }
    
    const response = await fetch(statsUrl, fetchOptions);
    clearTimeout(timeoutId);
    
    const elapsed = Date.now() - startTime;
    console.log(`[STATUS] ${server.name}: Response ${response.status} in ${elapsed}ms`);

    if (!response.ok) {
      throw new Error('Server offline');
    }

    const stats: FrigateStats = await response.json();

    const cpuUsage = stats.cpu_usages ? Object.values(stats.cpu_usages).reduce((sum: number, val: { cpu: number }) => sum + (val.cpu || 0), 0) : 0;
    
    let hddUsage = 0;
    if (stats.service?.storage) {
        const firstStorageId = Object.keys(stats.service.storage)[0];
        if(firstStorageId) {
            const storage = stats.service.storage[firstStorageId];
            if (storage) {
              hddUsage = storage.total > 0 ? Math.round((storage.used / storage.total) * 100) : 0;
            }
        }
    }

    let memUsage = 0;
    if (stats.service?.mem_percentage) {
        memUsage = Math.round(stats.service.mem_percentage);
    } else if (stats.service?.mem_used && stats.service?.mem_total && stats.service.mem_total > 0) {
        memUsage = Math.round((stats.service.mem_used / stats.service.mem_total) * 100);
    }

    let gpuUsage = 0;
    const gpuSources = [stats.nvidia, stats.gpu_usages];
    for (const source of gpuSources) {
        if (source) {
            gpuUsage = Object.values(source).reduce((sum, val) => sum + (val.gpu || 0), 0);
            if (gpuUsage > 0) break;
        }
    }
    if (gpuUsage === 0) {
        const otherGpuSources = [stats.intel_gpu, stats.amd_gpu];
        for (const source of otherGpuSources) {
            if (source) {
                gpuUsage = Object.values(source).reduce((sum, val) => sum + (val.usage || 0), 0);
                if (gpuUsage > 0) break;
            }
        }
    }

    console.log(`[STATUS] ${server.name}: Successfully parsed stats`);
    
    return {
      status: 'online',
      resources: {
        cpu: Math.min(100, Math.round(cpuUsage)),
        mem: Math.min(100, memUsage),
        hdd: hddUsage,
        gpu: Math.min(100, Math.round(gpuUsage)),
      },
    };
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[STATUS] ${server.name}: FAILED after ${elapsed}ms`);
    
    if (error instanceof Error) {
      console.error(`[STATUS] ${server.name}: Error type: ${error.name}`);
      console.error(`[STATUS] ${server.name}: Error message: ${error.message}`);
      
      if (error.name === 'AbortError') {
        console.error(`[STATUS] ${server.name}: Request timed out after 5 seconds`);
      } else if (error.message.includes('Failed to fetch')) {
        console.error(`[STATUS] ${server.name}: Network error - cannot reach server`);
      }
    } else {
      console.error(`[STATUS] ${server.name}: Unknown error:`, error);
    }
    
    return {
      status: 'offline',
      resources: { cpu: 0, mem: 0, hdd: 0, gpu: 0 },
    };
  }
};
