import React, { useEffect, useRef, useState, memo } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useTranslation } from '../hooks/useTranslation';

interface WebRTCPlayerProps {
  streams: {
    main?: string;
    sub?: string;
  };
  quality: 'main' | 'sub';
  onQualityChange: (quality: 'main' | 'sub') => void;
  cameraName: string;
}

const WebRTCPlayer: React.FC<WebRTCPlayerProps> = ({ streams, quality, onQualityChange, cameraName }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting');
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const { t } = useTranslation();

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

  const streamUrl = quality === 'main' ? (streams.main || streams.sub) : (streams.sub || streams.main);

  console.log(`[PLAYER] COMPONENT RENDER - cameraName: ${cameraName}`);

  // Handle window resize for responsive zoom
  // When window size changes, we update the key of TransformWrapper to force re-mount
  // This ensures the zoom container adjusts to the new available space
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const newSize = {
          width: window.innerWidth,
          height: window.innerHeight
        };
        console.log(`[PLAYER] Window resized to ${newSize.width}x${newSize.height}, adjusting zoom container`);
        setWindowSize(newSize);
      }, 100); // Debounce 100ms
    };

    // Set initial size
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    console.log(`[PLAYER] ⚡ Starting image polling mode for camera: ${cameraName}`);

    if (!cameraName) {
      console.log(`[PLAYER] ❌ Image mode requires cameraName`);
      setStatus('failed');
      return;
    }

    setStatus('connecting');
    console.log(`[PLAYER] 🔄 Set status to connecting, processing camera: ${cameraName}`);

    // Clean up previous instances
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // Image polling mode using Frigate snapshots
    console.log(`[PLAYER] 📸 Starting image polling mode`);

    let isFirstLoad = true;
    let nextImageUrl = '';
    let currentBuffer = 0;
    const imageBuffers = [new Image(), new Image()];
    let lastImageTime = 0;

    const pollImage = () => {
      const now = Date.now();
      // Throttle to prevent excessive requests (max ~20 FPS)
      if (now - lastImageTime < 50) return;
      lastImageTime = now;

      if (imgRef.current) {
        // Use cameraName prop to get images from Frigate API with quality parameter
        const height = quality === 'main' ? 720 : 360;
        const imageUrl = `http://10.1.1.252:5000/api/${cameraName}/latest.jpg?h=${height}&${Date.now()}`;

        // Preload next image for smoother transition using double buffering
        if (nextImageUrl !== imageUrl) {
          nextImageUrl = imageUrl;
          const bufferImg = imageBuffers[currentBuffer];

          bufferImg.onload = () => {
            if (imgRef.current && bufferImg.src === imageUrl) {
              // Switch to the loaded buffer
              imgRef.current.src = bufferImg.src;

              if (isFirstLoad) {
                console.log(`[PLAYER] ✅ First image loaded successfully - Double buffering active`);
                setStatus('connected');
                isFirstLoad = false;
              }
            }
          };
          bufferImg.onerror = (e) => {
            console.error(`[PLAYER] ❌ Image load error:`, e);
            if (isFirstLoad) {
              setStatus('failed');
              isFirstLoad = false;
            }
          };
          bufferImg.src = imageUrl;
        }
      }
    };

    // Initial load
    pollImage();

    // Set up polling interval (300ms for even smoother video)
    pollIntervalRef.current = setInterval(pollImage, 300);
    console.log(`[PLAYER] 📸 Image polling started with 300ms interval and double buffering at ${quality} quality`);

    return () => {
      console.log(`[PLAYER] 🧹 Cleaning up player`);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [cameraName, quality]);

  return (
    <div className="w-full h-full relative bg-black group overflow-hidden">
      <TransformWrapper
        key={`zoom-${windowSize.width}-${windowSize.height}`}
        initialScale={1}
        minScale={1}
        maxScale={3}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
        pinch={{ step: 1.5 }}
        doubleClick={{ mode: 'reset' }}
        limitToBounds={false}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute top-2 left-2 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <button
                onClick={() => zoomIn()}
                className="w-8 h-8 bg-black/50 text-white rounded hover:bg-black/70 transition-colors flex items-center justify-center text-sm"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={() => zoomOut()}
                className="w-8 h-8 bg-black/50 text-white rounded hover:bg-black/70 transition-colors flex items-center justify-center text-sm"
                title="Zoom Out"
              >
                −
              </button>
              <button
                onClick={() => resetTransform()}
                className="w-8 h-8 bg-black/50 text-white rounded hover:bg-black/70 transition-colors flex items-center justify-center text-xs"
                title="Reset Zoom"
              >
                ⟲
              </button>
            </div>
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%' }}
              contentStyle={{ width: '100%', height: '100%' }}
            >
              <img
                ref={imgRef}
                className="w-full h-full object-contain"
                alt="Camera stream"
                style={{ width: '100%', height: '100%', minWidth: '100%', minHeight: '100%' }}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
      {status === 'connecting' && (
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white/50"></div>
        </div>
      )}
      {status === 'failed' && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <p className="text-white/70 text-sm">Stream Failed</p>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="flex items-center justify-end space-x-2">
          <span className="text-white text-xs font-bold">{t('liveview_quality')}:</span>
          <button onClick={() => onQualityChange('sub')} disabled={!streams.sub} className={`px-2 py-0.5 text-xs rounded ${quality === 'sub' ? 'bg-primary-500 text-white' : 'bg-gray-500/50 text-gray-300'} disabled:bg-gray-700/50 disabled:cursor-not-allowed`}>{t('liveview_quality_sub')}</button>
          <button onClick={() => onQualityChange('main')} disabled={!streams.main} className={`px-2 py-0.5 text-xs rounded ${quality === 'main' ? 'bg-primary-500 text-white' : 'bg-gray-500/50 text-gray-300'} disabled:bg-gray-700/50 disabled:cursor-not-allowed`}>{t('liveview_quality_main')}</button>
        </div>
      </div>
    </div>
  );
};

export default memo(WebRTCPlayer);