import React, { useState, memo } from 'react';
import WebRTCPlayer from './WebRTCPlayer';
import { useTranslation } from '../hooks/useTranslation';

interface VideoPlayerProps {
  streams: {
    main?: string;
    sub?: string;
  };
  quality: 'main' | 'sub';
  onQualityChange: (quality: 'main' | 'sub') => void;
  cameraName: string;
  onStreamFailure?: (mode: 'image' | 'hls') => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ streams, quality, onQualityChange, cameraName }) => {
  const [mode, setMode] = useState<'image' | 'hls'>('image'); // Start with image polling
  const [lastFailedMode, setLastFailedMode] = useState<'image' | 'hls' | null>(null);
  const { t } = useTranslation();

  const toggleMode = () => {
    setMode(prevMode => prevMode === 'image' ? 'hls' : 'image');
    setLastFailedMode(null); // Reset failure state when manually switching
  };

  // Auto-switch to image mode if HLS fails
  React.useEffect(() => {
    if (lastFailedMode === 'hls' && mode === 'hls') {
      console.log(`[VIDEOPLAYER] HLS failed, auto-switching to image mode`);
      setMode('image');
      setLastFailedMode(null);
    }
  }, [lastFailedMode, mode]);

  // Auto-switch to image mode if HLS fails
  React.useEffect(() => {
    if (lastFailedMode === 'hls' && mode === 'hls') {
      console.log(`[VIDEOPLAYER] HLS failed, auto-switching to image mode`);
      setMode('image');
      setLastFailedMode(null);
    }
  }, [lastFailedMode, mode]);

  return (
    <div className="w-full h-full relative group">
      <WebRTCPlayer
        streams={streams}
        quality={quality}
        onQualityChange={onQualityChange}
        mode={mode}
        cameraName={cameraName}
        onError={(failedMode) => setLastFailedMode(failedMode)}
      />

      {/* Mode toggle button */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button
          onClick={toggleMode}
          className="px-2 py-1 text-xs rounded bg-black/50 text-white hover:bg-black/70 transition-colors"
          title={`Switch to ${mode === 'image' ? 'HLS' : 'Image'} mode`}
        >
          {mode === 'image' ? 'HLS' : 'IMG'}
        </button>
      </div>
    </div>
  );
};

export default memo(VideoPlayer);