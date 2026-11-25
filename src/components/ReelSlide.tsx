import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import type { Reel } from '../data/reels';

interface Props {
  reel: Reel;
  active: boolean;
  onEnded?: () => void;
}

/** Gallery slide: plays muted when it is the active slide, pauses otherwise. Advances when the clip ends. */
export default function ReelSlide({ reel, active, onEnded }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [active]);

  if (failed) return null;

  const toggle = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    const v = ref.current;
    if (!v) return;
    v.muted = !muted;
    setMuted(!muted);
    if (muted) v.play().catch(() => {});
  };

  return (
    <div className="absolute inset-0 bg-black">
      <video
        ref={ref}
        src={`/reels/${reel.file}.mp4`}
        poster={`/reels/${reel.file}-poster.jpg`}
        muted
        playsInline
        preload={active ? 'auto' : 'none'}
        onEnded={onEnded}
        onError={() => setFailed(true)}
        onClick={toggle}
        aria-label={reel.title}
        className="w-full h-full object-cover"
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
        className="absolute bottom-3 left-3 z-20 w-9 h-9 rounded-full bg-black/55 text-white flex items-center justify-center"
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
    </div>
  );
}
