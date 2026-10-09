import React, { useState } from 'react';
import { isMediaVideo } from '../services/channelService';

interface ChannelAvatarMediaProps {
  src: string;
  type?: 'video' | 'gif' | 'image';
  alt?: string;
  className?: string;
  fallbackSrc?: string;
}

export const ChannelAvatarMedia: React.FC<ChannelAvatarMediaProps> = ({
  src,
  type,
  alt = 'Logo del canal',
  className = '',
  fallbackSrc = 'https://media.giphy.com/media/d31vTpVi1LAcDvdm/giphy.gif'
}) => {
  const [hasError, setHasError] = useState(false);
  const isVideo = isMediaVideo(src, type) && !hasError;

  if (isVideo) {
    return (
      <video
        key={src}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        onError={() => setHasError(true)}
        className={className}
      />
    );
  }

  return (
    <img
      key={src}
      src={hasError ? fallbackSrc : src || fallbackSrc}
      alt={alt}
      onError={() => {
        if (!hasError) setHasError(true);
      }}
      className={className}
    />
  );
};
