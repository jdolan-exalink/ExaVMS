
import type { Server } from '../config/serverConfig';

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
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const headers = server.token ? { 'Authorization': `Bearer ${server.token}` } : {};
    const response = await fetch(new URL('/api/stats', server.url).toString(), { headers, signal: controller.signal });
    clearTimeout(timeoutId);

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
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        // Silently fail for network errors during polling to avoid console spam.
        // The UI will reflect the offline status, and the initial load error is more descriptive.
    } else {
        console.error(`An unexpected error occurred while fetching status for ${server.name}:`, error);
    }
    return {
      status: 'offline',
      resources: { cpu: 0, mem: 0, hdd: 0, gpu: 0 },
    };
  }
};
