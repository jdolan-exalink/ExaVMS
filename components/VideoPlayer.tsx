import React, { memo } from 'react';
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
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ streams, quality, onQualityChange, cameraName }) => {
  const { t } = useTranslation();

  // Auto-switch to main quality if available
  React.useEffect(() => {
    if (streams.main && quality !== 'main') {
      console.log(`[VIDEOPLAYER] Main stream available, auto-switching to main quality`);
      onQualityChange('main');
    }
  }, [streams.main, quality, onQualityChange]);

  return (
    <div className="w-full h-full relative group">
      <WebRTCPlayer
        streams={streams}
        quality={quality}
        onQualityChange={onQualityChange}
        cameraName={cameraName}
      />
    </div>
  );
};

export default memo(VideoPlayer);