import { getServers, Server } from '../config/serverConfig';
import FrigateAPI, { FrigateConfig } from './frigate';
import type { Camera } from '../modules/liveview/types';

const CAMERAS_KEY = 'cameras_cache';

// Decide when to use the Vite proxy
const useProxy = (() => {
    try {
        const env: any = (import.meta as any)?.env || {};
        if (env?.DEV) return true;
        if (env?.VITE_FORCE_PROXY === 'true') return true;
        if (typeof window !== 'undefined' && window.location?.port === '3000') return true;
    } catch {}
    return false;
})();

const buildApiUrl = (server: Server, apiPath: string): string => {
    if (useProxy) {
        return `/proxy/${server.id}${apiPath}`;
    }
    try { return new URL(apiPath, server.url).toString(); } catch { return `${server.url.replace(/\/$/, '')}${apiPath}`; }
};

const buildStreamUrl = (server: Server, cameraKey: string, streamType: 'main' | 'sub', cameraConfig?: any): string => {
    try {
        console.log(`[STREAM_URL] Building ${streamType} stream URL for camera "${cameraKey}" on server "${server.name}"`);
        console.log(`[STREAM_URL] Camera config:`, cameraConfig);

        // Generate RTSP URL for WebRTC streaming
        // Format: rtsp://SERVER:8554/CAMERA_sub or rtsp://SERVER:8554/CAMERA_main
        const rtspUrl = `rtsp://${server.url.replace(/^https?:\/\//, '').split(':')[0]}:8554/${cameraKey}_${streamType}`;
        console.log(`[STREAM_URL] Generated RTSP URL: ${rtspUrl}`);
        return rtspUrl;
    } catch (error) {
        console.error(`[STREAM_URL] Error building stream URL for camera "${cameraKey}":`, error);
        return '';
    }
}

export const fetchAndProcessCameras = async (server: Server): Promise<Camera[]> => {
    console.log(`[CAMERAS] ${server.name}: Starting camera fetch`);
    console.log(`[CAMERAS] ${server.name}: Server enabled: ${server.enabled}`);
    console.log(`[CAMERAS] ${server.name}: Auth type: ${server.auth?.type || 'none'}`);
    
    if (!server.enabled) {
        console.log(`[CAMERAS] ${server.name}: Server disabled, returning empty`);
        return [];
    }

    if (server.auth?.type === 'frigate') {
        console.log(`[CAMERAS] ${server.name}: Using Frigate API`);
        const frigateConfig: FrigateConfig = {
            baseUrl: server.url,
            authType: 'cookie',
            username: server.auth.username,
            password: server.auth.password,
        };
        const frigate = new FrigateAPI(frigateConfig);
        try {
            console.log(`[CAMERAS] ${server.name}: Attempting Frigate login`);
            await frigate.login();
            console.log(`[CAMERAS] ${server.name}: Login successful, fetching cameras`);
            const cameras = await frigate.getCameras();
            console.log(`[CAMERAS] ${server.name}: Fetched ${cameras.length} cameras from Frigate`);
            return cameras as Camera[];
        } catch (e) {
            console.error(`[CAMERAS] ${server.name}: Error with Frigate:`, e);
            return [];
        }
    }

    // Procesar cámaras para servidores no-Frigate
    console.log(`[CAMERAS] ${server.name}: Using standard API`);
    try {
        // Obtener configuración del servidor (simulación: endpoint /api/config)
        const configUrl = buildApiUrl(server, '/api/config');
        console.log(`[CAMERAS] ${server.name}: Fetching config from ${configUrl}`);
        const res = await fetch(configUrl, {
            credentials: 'include',
        });
        console.log(`[CAMERAS] ${server.name}: Config response status: ${res.status}`);
        if (!res.ok) {
            console.error(`[CAMERAS] ${server.name}: Failed to fetch config: ${res.status} ${res.statusText}`);
            throw new Error('No se pudo obtener la configuración de cámaras');
        }
        const config = await res.json();
        console.log(`[CAMERAS] ${server.name}: Config received:`, config);
        const cameras: Camera[] = Object.entries(config.cameras || {}).map(([id, camConfig]: [string, any]) => {
            console.log(`[CAMERAS] ${server.name}: Processing camera ${id}:`, camConfig);
            const streams: Camera['streams'] = {};
            for (const input of (camConfig.ffmpeg?.inputs || [])) {
                if (input.roles.includes('record')) {
                    streams.main = buildStreamUrl(server, id, 'main', camConfig);
                    console.log(`[CAMERAS] ${server.name}: Assigned MAIN stream to camera ${id}: ${streams.main}`);
                }
                if (input.roles.includes('detect')) {
                    streams.sub = buildStreamUrl(server, id, 'sub', camConfig);
                    console.log(`[CAMERAS] ${server.name}: Assigned SUB stream to camera ${id}: ${streams.sub}`);
                }
            }
            // Fallback si solo hay un stream
            if (Object.keys(streams).length === 1) {
                if (streams.main) {
                    streams.sub = streams.main;
                    console.log(`[CAMERAS] ${server.name}: Fallback: Assigned MAIN stream as SUB for camera ${id}`);
                }
                if (streams.sub) {
                    streams.main = streams.sub;
                    console.log(`[CAMERAS] ${server.name}: Fallback: Assigned SUB stream as MAIN for camera ${id}`);
                }
            }
            const camera: Camera = {
                id: id,
                name: camConfig.name,
                server: { id: server.id, name: server.name, url: server.url, enabled: server.enabled },
                streams,
                isOnline: true,
            };
            console.log(`[CAMERAS] ${server.name}: Final camera object for ${id}:`, {
                id: camera.id,
                name: camera.name,
                streams: camera.streams,
                streamTypes: {
                    main: streams.main ? (streams.main.includes('.m3u8') ? 'HLS' : streams.main.includes('.webp') ? 'IMAGE' : 'UNKNOWN') : 'NONE',
                    sub: streams.sub ? (streams.sub.includes('.m3u8') ? 'HLS' : streams.sub.includes('.webp') ? 'IMAGE' : 'UNKNOWN') : 'NONE'
                }
            });
            return camera;
        });
        console.log(`[CAMERAS] ${server.name}: Total cameras processed: ${cameras.length}`);
        return cameras;
    } catch (error) {
        console.error(`[CAMERAS] ${server.name}: Error processing cameras:`, error);
        // Esto es esperado para servidores offline, no spamear el log
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            // console.debug(`No se pudo conectar al servidor "${server.name}" para obtener la config de cámaras.`);
        } else {
            console.error(`Error procesando la config de cámaras para el servidor ${server.name}:`, error);
        }
        return [];
    }
};

export const updateAllCameras = async (): Promise<{ cameras: Camera[], servers: Server[] }> => {
    const allServers = await getServers();
    const cameraPromises = allServers.map(fetchAndProcessCameras);
    const cameraArrays = await Promise.all(cameraPromises);

    const allCameras = cameraArrays.flat();

    const onlineServerIds = new Set(allCameras.map(cam => cam.server.id));
    // Preserve the full server list; optionally annotate status so UI can use it in future
    const serversWithStatus: Server[] = allServers.map(s => ({
        ...s,
        status: onlineServerIds.has(s.id) ? 'online' : 'offline'
    }));

    try {
        const storedCameras = localStorage.getItem(CAMERAS_KEY);
        // Avoid unnecessary writes if data is the same
        if (storedCameras !== JSON.stringify(allCameras)) {
            localStorage.setItem(CAMERAS_KEY, JSON.stringify(allCameras));
        }
    } catch (error) {
        console.error("Failed to save cameras to localStorage", error);
    }

    return { cameras: allCameras, servers: serversWithStatus };
};

export const getCachedCameras = (): { cameras: Camera[], servers: Server[] } => {
    try {
        const storedCameras = localStorage.getItem(CAMERAS_KEY);
        const cameras: Camera[] = storedCameras ? JSON.parse(storedCameras) : [];
        const allServers: Server[] = JSON.parse(localStorage.getItem('servers_conf') || '[]');
        // Include all servers; if cameras cached, annotate status based on presence
        const cameraServerIds = new Set(cameras.map(cam => cam.server.id));
        const serversWithStatus: Server[] = allServers.map(s => ({
            ...s,
            status: cameraServerIds.has(s.id) ? 'online' : 'offline'
        }));
        return { cameras, servers: serversWithStatus };
    } catch (error) {
        console.error("Failed to parse cached cameras from localStorage", error);
        return { cameras: [], servers: [] };
    }
};