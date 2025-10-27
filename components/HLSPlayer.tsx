import React, { useEffect, useRef, useState, memo } from 'react';
import Hls from 'hls.js';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useTranslation } from '../hooks/useTranslation';

interface HLSPlayerProps {
  streams: {
    main?: string;
    sub?: string;
  };
  quality: 'main' | 'sub';
  onQualityChange: (quality: 'main' | 'sub') => void;
  cameraName: string;
}

const HLSPlayer: React.FC<HLSPlayerProps> = ({ streams, quality, onQualityChange, cameraName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
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

  useEffect(() => {
    console.log(`[HLS] ⚡ useEffect EXECUTING with cameraName: ${cameraName}, streamUrl: ${streamUrl}`);

    if (!cameraName) {
      console.log(`[HLS] ❌ No cameraName provided, setting status to failed`);
      setStatus('failed');
      return;
    }

    setStatus('connecting');
    console.log(`[HLS] 🔄 Set status to connecting, processing camera: ${cameraName}`);

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Build HLS URL
    const baseUrl = useProxy ? `/proxy/casa` : 'http://10.1.1.252:5000';
    const hlsUrl = `${baseUrl}/api/${cameraName}/hls/index.m3u8`;

    console.log(`[HLS] 🎥 HLS URL: ${hlsUrl}`);

    // Check if HLS is supported
    if (!Hls.isSupported()) {
      console.log(`[HLS] ❌ HLS not supported, falling back to image polling`);
      setStatus('failed');
      return;
    }

    if (!videoRef.current) {
      console.log(`[HLS] ❌ Video element not available`);
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
      console.log(`[HLS] 📺 Media attached`);
    });

    hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
      console.log(`[HLS] 📋 Manifest parsed, found ${data.levels.length} quality levels`);
      setStatus('connected');
    });

    hls.on(Hls.Events.ERROR, (event, data) => {
      console.error(`[HLS] ❌ HLS Error:`, data);
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.log(`[HLS] 🔄 Network error, attempting recovery`);
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.log(`[HLS] 🔄 Media error, attempting recovery`);
            hls.recoverMediaError();
            break;
          default:
            console.log(`[HLS] 💀 Fatal error, destroying HLS`);
            hls.destroy();
            setStatus('failed');
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
      console.log(`[HLS] ✅ Video loaded successfully`);
      setStatus('connected');
    };

    video.onerror = (e) => {
      console.error(`[HLS] ❌ Video error:`, e);
      setStatus('failed');
    };

    return () => {
      console.log(`[HLS] 🧹 Cleaning up HLS player`);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [cameraName, quality, useProxy]);

  return (
    <div className="w-full h-full relative bg-black group">
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={3}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
        pinch={{ step: 1.5 }}
        doubleClick={{ mode: 'reset' }}
      >
        <TransformComponent>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
        </TransformComponent>
      </TransformWrapper>

      {status === 'connecting' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white/50"></div>
        </div>
      )}

      {status === 'failed' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <p className="text-white/70 text-sm">HLS Stream Failed</p>
        </div>
      )}

      {isBuffering && status === 'connected' && (
        <div className="absolute top-2 left-2">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white/50"></div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-white text-xs font-bold">{t('liveview_quality')}:</span>
            <button
              onClick={() => onQualityChange('sub')}
              disabled={!streams.sub}
              className={`px-2 py-0.5 text-xs rounded ${quality === 'sub' ? 'bg-primary-500 text-white' : 'bg-gray-500/50 text-gray-300'} disabled:bg-gray-700/50 disabled:cursor-not-allowed`}
            >
              {t('liveview_quality_sub')}
            </button>
            <button
              onClick={() => onQualityChange('main')}
              disabled={!streams.main}
              className={`px-2 py-0.5 text-xs rounded ${quality === 'main' ? 'bg-primary-500 text-white' : 'bg-gray-500/50 text-gray-300'} disabled:bg-gray-700/50 disabled:cursor-not-allowed`}
            >
              {t('liveview_quality_main')}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-white text-xs">
              {status === 'connected' ? 'HLS' : status === 'connecting' ? 'Connecting...' : 'Failed'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(HLSPlayer);