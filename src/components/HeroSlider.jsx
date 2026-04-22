import { useState, useEffect, useRef } from "react";

export function HeroSlider({ images }) {
  const [current, setCurrent] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      if (!paused.current) setCurrent(i => (i + 1) % images.length);
    }, 4000);
    return () => clearInterval(id);
  }, [images.length]);

  if (!images.length) return null;

  return (
    <div
      className="hero"
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
    >
      <div className="hero-track" style={{ transform: `translateX(-${current * 100}%)` }}>
        {images.map((src, i) => (
          <div key={i} className="hero-slide">
            <img src={src} alt={`Hero ${i + 1}`} className="hero-img" />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button className="hero-arrow hero-arrow--prev" onClick={() => setCurrent(i => (i - 1 + images.length) % images.length)} aria-label="Попереднє">‹</button>
          <button className="hero-arrow hero-arrow--next" onClick={() => setCurrent(i => (i + 1) % images.length)} aria-label="Наступне">›</button>
          <div className="hero-dots">
            {images.map((_, i) => (
              <button key={i} className={`hero-dot ${i === current ? "active" : ""}`} onClick={() => setCurrent(i)} aria-label={`Слайд ${i + 1}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
