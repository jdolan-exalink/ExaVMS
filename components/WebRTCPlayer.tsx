import React, { useEffect, useRef, useState, memo } from 'react';
import { useTranslation } from '../hooks/useTranslation';

interface WebRTCPlayerProps {
  streams: {
    main?: string;
    sub?: string;
  };
  quality: 'main' | 'sub';
  onQualityChange: (quality: 'main' | 'sub') => void;
}

const WebRTCPlayer: React.FC<WebRTCPlayerProps> = ({ streams, quality, onQualityChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting');
  const { t } = useTranslation();

  const streamUrl = quality === 'main' ? (streams.main || streams.sub) : (streams.sub || streams.main);

  useEffect(() => {
    if (!streamUrl) {
      setStatus('failed');
      return;
    }

    setStatus('connecting');

    const pc = new RTCPeerConnection();
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && webSocketRef.current?.readyState === WebSocket.OPEN) {
        webSocketRef.current.send(JSON.stringify(event.candidate));
      }
    };

    pc.ontrack = (event) => {
      if (videoRef.current && event.streams && event.streams[0]) {
        videoRef.current.srcObject = event.streams[0];
      }
    };
    
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setStatus('connected');
      } else if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        setStatus('failed');
      }
    };

    pc.addTransceiver('video');

    const ws = new WebSocket(streamUrl);
    webSocketRef.current = ws;

    ws.onopen = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        ws.send(JSON.stringify(offer));
      } catch (e) {
        console.error("WebRTC offer error:", e);
        setStatus('failed');
      }
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(data));
        } else if (data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data));
        }
      } catch (e) {
        console.error("WebRTC message error:", e);
      }
    };

    ws.onerror = (e) => {
      console.error("WebSocket error:", e);
      setStatus('failed');
    };

    ws.onclose = () => {
      // Don't set failed on clean close, connection state will handle it.
    };

    return () => {
      if (ws) {
        ws.close();
      }
      if (pc) {
        pc.close();
      }
      peerConnectionRef.current = null;
      webSocketRef.current = null;
    };
  }, [streamUrl]);

  return (
    <div className="w-full h-full relative bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-contain"
      />
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