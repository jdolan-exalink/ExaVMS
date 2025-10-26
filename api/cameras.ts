import { getServers, Server } from '../config/serverConfig';
import type { Camera } from '../modules/liveview/types';

const CAMERAS_KEY = 'cameras_cache';

const buildGo2RtcUrl = (server: Server, cameraKey: string): string => {
    try {
        const url = new URL(server.url);
        const protocol = url.protocol === 'https:"' ? 'wss:' : 'ws:';
        return `${protocol}//${url.host}/api/ws?src=${cameraKey}`;
    } catch {
        return '';
    }
}

export const fetchAndProcessCameras = async (server: Server): Promise<Camera[]> => {
    if (!server.enabled) {
        return [];
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const headers = server.token ? { 'Authorization': `Bearer ${server.token}` } : {};
        const configPromise = fetch(new URL('/api/config', server.url).toString(), { headers, signal: controller.signal });
        
        const configRes = await configPromise;
        clearTimeout(timeoutId);

        if (!configRes.ok) {
            console.error(`Failed to fetch config for ${server.name}: ${configRes.statusText}`);
            return [];
        }
        
        const config = await configRes.json();
        
        const cameras: Camera[] = Object.entries(config.cameras || {}).map(([id, camConfig]: [string, any]) => {
            const streams: Camera['streams'] = {};
            
            for (const input of (camConfig.ffmpeg.inputs || [])) {
                if (input.roles.includes('record')) {
                    streams.main = buildGo2RtcUrl(server, id);
                }
                if (input.roles.includes('detect')) {
                    streams.sub = buildGo2RtcUrl(server, id);
                }
            }
            // Fallback if only one stream is defined
            if (Object.keys(streams).length === 1) {
                if (streams.main) streams.sub = streams.main;
                if (streams.sub) streams.main = streams.sub;
            }

            return {
                id: id,
                name: camConfig.name,
                // FIX: Added 'enabled' property to satisfy the 'Server' type required by the 'Camera' interface.
                server: { id: server.id, name: server.name, url: server.url, enabled: server.enabled },
                streams,
                isOnline: true, // Assuming online if config is fetched. Status can be refined later.
            };
        });

        return cameras.filter(c => Object.keys(c.streams).length > 0);

    } catch (error) {
        // This is expected for offline servers, so we don't spam the console.
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            // console.debug(`Could not connect to server "${server.name}" to fetch camera config.`);
        } else {
            console.error(`Error processing camera config for server ${server.name}:`, error);
        }
        return [];
    }
};

export const updateAllCameras = async (): Promise<{ cameras: Camera[], servers: Server[] }> => {
    const servers = await getServers();
    const enabledServers = servers.filter(s => s.enabled);
    const cameraPromises = enabledServers.map(fetchAndProcessCameras);
    const cameraArrays = await Promise.all(cameraPromises);
    
    const allCameras = cameraArrays.flat();
    
    const onlineServerIds = new Set(allCameras.map(cam => cam.server.id));
    const onlineServers = servers.filter(s => onlineServerIds.has(s.id));
    
    try {
        const storedCameras = localStorage.getItem(CAMERAS_KEY);
        // Avoid unnecessary writes if data is the same
        if (storedCameras !== JSON.stringify(allCameras)) {
            localStorage.setItem(CAMERAS_KEY, JSON.stringify(allCameras));
        }
    } catch (error) {
        console.error("Failed to save cameras to localStorage", error);
    }
    
    return { cameras: allCameras, servers: onlineServers };
};

export const getCachedCameras = (): { cameras: Camera[], servers: Server[] } => {
    try {
        const storedCameras = localStorage.getItem(CAMERAS_KEY);
        const cameras: Camera[] = storedCameras ? JSON.parse(storedCameras) : [];
        const onlineServerIds = new Set(cameras.map(cam => cam.server.id));
        const allServers: Server[] = JSON.parse(localStorage.getItem('servers_conf') || '[]');
        const onlineServers = allServers.filter(s => onlineServerIds.has(s.id));
        return { cameras, servers: onlineServers };
    } catch (error) {
        console.error("Failed to parse cached cameras from localStorage", error);
        return { cameras: [], servers: [] };
    }
};