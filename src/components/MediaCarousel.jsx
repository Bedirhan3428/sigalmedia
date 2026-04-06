import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Volume2, VolumeX } from 'lucide-react';

const getCdnUrl = (url) => {
  if (!url) return url;
  return url.replace('https://firebasestorage.googleapis.com', 'https://sigal-cdn.abimer2350.workers.dev');
};

export default function MediaCarousel({ media = [], aspectRatio = null, showIndicator = true, onDoubleTap }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState({}); // { index: boolean }
  const scrollRef = useRef(null);
  const lastTap = useRef(0);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const index = Math.round(scrollLeft / clientWidth);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  // Pause videos on background/unmount
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        const videos = scrollRef.current?.querySelectorAll('video');
        videos?.forEach(v => v.pause());
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      const videos = scrollRef.current?.querySelectorAll('video');
      videos?.forEach(v => v.pause());
    };
  }, []);

  const scrollTo = (index) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      left: index * scrollRef.current.clientWidth,
      behavior: 'smooth'
    });
  };

  const handleTouchEnd = (index, e) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (onDoubleTap) onDoubleTap(e);
    }
    lastTap.current = now;
  };

  const togglePlay = (index) => {
    setPlaying(prev => ({ ...prev, [index]: !prev[index] }));
  };

  if (!media || media.length === 0) return null;

  return (
    <div style={{ position: 'relative', width: '100%', backgroundColor: '#000', overflow: 'hidden' }}>
      {/* Indicator */}
      {showIndicator && media.length > 1 && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(0,0,0,0.7)', color: '#fff',
          padding: '4px 8px', borderRadius: 12, fontSize: 12,
          fontWeight: 600, zIndex: 10, pointerEvents: 'none'
        }}>
          {currentIndex + 1}/{media.length}
        </div>
      )}

      {/* Track */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {media.map((item, i) => (
          <div
            key={i}
            onClick={(e) => handleTouchEnd(i, e)}
            style={{
              flex: '0 0 100%',
              width: '100%',
              scrollSnapAlign: 'start',
              position: 'relative',
              aspectRatio: aspectRatio || 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#000'
            }}
          >
            {item.type === 'video' ? (
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <video
                  src={getCdnUrl(item.url)}
                  loop
                  muted={muted}
                  playsInline
                  autoPlay={i === currentIndex}
                  preload={i === currentIndex ? 'auto' : 'none'}
                  poster={getCdnUrl(item.thumbnailUrl) || ""}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const v = e.target;
                    if (v.paused) v.play(); else v.pause();
                  }}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
                  style={{
                    position: 'absolute', bottom: 12, right: 12,
                    background: 'rgba(0,0,0,0.6)', border: 'none',
                    borderRadius: '50%', width: 32, height: 32,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', cursor: 'pointer'
                  }}
                >
                  {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
              </div>
            ) : (
              <img
                src={getCdnUrl(item.url)}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                draggable={false}
              />
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows (Desktop) */}
      {media.length > 1 && currentIndex > 0 && (
        <button
          onClick={() => scrollTo(currentIndex - 1)}
          style={{
            position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', cursor: 'pointer', zIndex: 10
          }}
        >
          <ChevronLeft size={20} />
        </button>
      )}
      {media.length > 1 && currentIndex < media.length - 1 && (
        <button
          onClick={() => scrollTo(currentIndex + 1)}
          style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', cursor: 'pointer', zIndex: 10
          }}
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Dots */}
      {media.length > 1 && (
        <div style={{
          position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 4, zIndex: 10
        }}>
          {media.map((_, i) => (
            <div
              key={i}
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: i === currentIndex ? '#0095F6' : 'rgba(255,255,255,0.4)',
                transition: 'background 0.2s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}