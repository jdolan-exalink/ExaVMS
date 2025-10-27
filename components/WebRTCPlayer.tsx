import React, { useEffect, useRef, useState, memo } from 'react';
import Hls from 'hls.js';
import { useTranslation } from '../hooks/useTranslation';

interface WebRTCPlayerProps {
  streams: {
    main?: string;
    sub?: string;
  };
  quality: 'main' | 'sub';
  onQualityChange: (quality: 'main' | 'sub') => void;
  mode?: 'image' | 'hls'; // Add mode prop
  cameraName?: string; // Add camera name for HLS
  onError?: (mode: 'image' | 'hls') => void; // Add error callback
}

const WebRTCPlayer: React.FC<WebRTCPlayerProps> = ({ streams, quality, onQualityChange, mode = 'image', cameraName, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting');
  const [isBuffering, setIsBuffering] = useState(false);
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

  console.log(`[PLAYER] COMPONENT RENDER - mode: ${mode}, cameraName: ${cameraName}`);

  useEffect(() => {
    console.log(`[PLAYER] ⚡ Starting ${mode} mode for camera: ${cameraName}`);

    if (mode === 'hls' && !cameraName) {
      console.log(`[PLAYER] ❌ HLS mode requires cameraName`);
      setStatus('failed');
      return;
    }

    if (mode === 'image' && !streamUrl) {
      console.log(`[PLAYER] ❌ Image mode requires streamUrl`);
      setStatus('failed');
      return;
    }

    setStatus('connecting');
    console.log(`[PLAYER] 🔄 Set status to connecting, processing mode: ${mode}`);

    // Clean up previous instances
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (mode === 'hls') {
      // HLS mode
      console.log(`[PLAYER] 🎥 Starting HLS mode for camera: ${cameraName}`);

      // Build HLS URL
      const baseUrl = useProxy ? `/proxy/casa` : 'http://10.1.1.252:5000';
      const hlsUrl = `${baseUrl}/api/${cameraName}/hls/index.m3u8`;

      console.log(`[PLAYER] 🎥 HLS URL: ${hlsUrl}`);

      // Check if HLS is supported
      if (!Hls.isSupported()) {
        console.log(`[PLAYER] ❌ HLS not supported, falling back to image polling`);
        setStatus('failed');
        return;
      }

      if (!videoRef.current) {
        console.log(`[PLAYER] ❌ Video element not available`);
        setStatus('failed');
        return;
      }

      // Create HLS instance
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hlsRef.current = hls;

      // HLS event handlers
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log(`[PLAYER] 📺 Media attached`);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log(`[PLAYER] 📋 Manifest parsed, found ${data.levels.length} quality levels`);
        setStatus('connected');
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error(`[PLAYER] ❌ HLS Error:`, data);
        console.error(`[PLAYER] Error details - Type: ${data.type}, Fatal: ${data.fatal}, Details:`, data.details);

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Check if it's a 404 or other permanent error
              if (data.details === 'manifestLoadError' || data.details === 'levelLoadError') {
                console.log(`[PLAYER] 💀 Network error (likely 404), HLS not available - falling back to image mode`);
                hls.destroy();
                setStatus('failed');
                if (onError) onError('hls');
              } else {
                console.log(`[PLAYER] 🔄 Network error, attempting recovery`);
                hls.startLoad();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log(`[PLAYER] 📺 Media error, attempting recovery`);
              hls.recoverMediaError();
              break;
            default:
              console.log(`[PLAYER] 💀 Fatal error, HLS not available - falling back to image mode`);
              hls.destroy();
              setStatus('failed');
              if (onError) onError('hls');
              break;
          }
        }
      });

      hls.on(Hls.Events.BUFFER_APPENDED, () => {
        setIsBuffering(false);
      });

      hls.on(Hls.Events.BUFFER_EOS, () => {
        setIsBuffering(false);
      });

      hls.on(Hls.Events.BUFFER_FLUSHING, () => {
        setIsBuffering(true);
      });

      // Load and attach HLS
      hls.loadSource(hlsUrl);
      hls.attachMedia(videoRef.current);

      // Video event handlers
      const video = videoRef.current;
      video.onloadeddata = () => {
        console.log(`[PLAYER] ✅ Video loaded successfully`);
        setStatus('connected');
      };

      video.onerror = (e) => {
        console.error(`[PLAYER] ❌ Video error:`, e);
        setStatus('failed');
      };

    } else {
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
                if (onError) onError('image');
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
    }

    return () => {
      console.log(`[PLAYER] 🧹 Cleaning up player (mode: ${mode})`);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [streamUrl, mode, cameraName, quality, useProxy]);

  return (
    <div className="w-full h-full relative bg-black">
      {mode === 'hls' ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-contain"
        />
      ) : (
        <img
          ref={imgRef}
          className="w-full h-full object-contain"
          alt="Camera stream"
        />
      )}
      {status === 'connecting' && (
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white/50"></div>
        </div>
      )}
      {status === 'failed' && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <p className="text-white/70 text-sm">{mode === 'hls' ? 'HLS Stream Failed' : 'Stream Failed'}</p>
        </div>
      )}
      {mode === 'hls' && isBuffering && status === 'connected' && (
        <div className="absolute top-2 left-2">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white/50"></div>
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