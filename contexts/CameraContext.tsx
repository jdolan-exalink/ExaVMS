import React, { createContext, useState, useEffect, useMemo, useContext } from 'react';
import { updateAllCameras, getCachedCameras } from '../api/cameras';
import type { Camera } from '../modules/liveview/types';
import type { Server } from '../config/serverConfig';

interface CameraContextType {
  cameras: Camera[];
  servers: Server[];
  isLoading: boolean;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export const CameraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load initial data from cache immediately for a fast UI response
    const { cameras: cachedCameras, servers: cachedServers } = getCachedCameras();
    if (cachedCameras.length > 0) {
        setCameras(cachedCameras);
        setServers(cachedServers);
        setIsLoading(false);
    }

    // Then, fetch fresh data from servers and start polling
    const manageUpdates = async () => {
        const { cameras: freshCameras, servers: freshServers } = await updateAllCameras();
        setCameras(freshCameras);
        setServers(freshServers);
        if (isLoading) {
            setIsLoading(false);
        }
    };
    
    manageUpdates(); // Initial fetch
    const intervalId = setInterval(manageUpdates, 60000); // Poll every 60 seconds

    return () => clearInterval(intervalId);
  }, [isLoading]);

  const value = useMemo(() => ({
    cameras,
    servers,
    isLoading,
  }), [cameras, servers, isLoading]);

  return <CameraContext.Provider value={value}>{children}</CameraContext.Provider>;
};

export const useCameras = () => {
  const context = useContext(CameraContext);
  if (context === undefined) {
    throw new Error('useCameras must be used within a CameraProvider');
  }
  return context;
};
