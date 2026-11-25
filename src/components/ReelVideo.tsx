import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import type { Reel } from '../data/reels';

interface ReelVideoProps {
  reel: Reel;
  className?: string;
}

/** Vertical 9:16 reel: muted loop, plays only while in view, tap toggles sound. Video bytes load only when needed. */
export default function ReelVideo({ reel, className = '' }: ReelVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);

  // Do not download the poster or video until the reel is close to the screen
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setNear(true); return; }
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { setNear(true); io.disconnect(); } }, { rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!near || !v || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting && e.intersectionRatio >= 0.6) {
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        });
      },
      { threshold: [0, 0.6, 1] }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [near]);

  const toggleSound = () => {
    const v = ref.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    setMuted(next);
    if (!next) v.play().catch(() => {});
  };

  if (failed) return null;

  return (
    <div ref={boxRef} className={`relative overflow-hidden rounded-2xl bg-black aspect-[9/16] ${className}`}>
      {near && <video
        ref={ref}
        src={`/reels/${reel.file}.mp4`}
        poster={`/reels/${reel.file}-poster.jpg`}
        muted
        loop
        playsInline
        preload="none"
        onError={() => setFailed(true)}
        onClick={toggleSound}
        aria-label={reel.title}
        className="w-full h-full object-cover cursor-pointer"
      />}
      <button
        type="button"
        onClick={toggleSound}
        aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
        className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-black/55 text-white flex items-center justify-center"
      >
        {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
      </button>
    </div>
  );
}
