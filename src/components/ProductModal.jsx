import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { parsePriceInfo, parsePriceOld, formatMoney, toUah } from "../utils/price.js";
import { PriceDisplay } from "./PriceDisplay.jsx";

const MAX_SIMILAR = 6;

function getSimilar(product, products) {
  if (!products || !products.length) return [];
  const others = products.filter(p => p.id !== product.id);
  const bySub = others.filter(p => p.subcategory && p.subcategory === product.subcategory);
  if (bySub.length >= MAX_SIMILAR) return bySub.slice(0, MAX_SIMILAR);
  const byCat = others.filter(p => p.category && p.category === product.category && p.subcategory !== product.subcategory);
  return [...bySub, ...byCat].slice(0, MAX_SIMILAR);
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ src, alt, onClose }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const lastPos = useRef({ x: 0, y: 0 });

  // pinch-to-zoom
  const lastDist = useRef(null);

  useEffect(() => {
    const handler = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Mouse drag (when zoomed in)
  function onMouseDown(e) {
    if (scale <= 1) return;
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX - lastPos.current.x, y: e.clientY - lastPos.current.y };
  }
  function onMouseMove(e) {
    if (!dragging) return;
    const nx = e.clientX - dragStart.current.x;
    const ny = e.clientY - dragStart.current.y;
    lastPos.current = { x: nx, y: ny };
    setPos({ x: nx, y: ny });
  }
  function onMouseUp() { setDragging(false); }

  // Touch pinch
  function onTouchStart(e) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastDist.current = Math.hypot(dx, dy);
    }
  }
  function onTouchMove(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (lastDist.current) {
        const delta = dist / lastDist.current;
        setScale(s => Math.min(Math.max(s * delta, 1), 4));
      }
      lastDist.current = dist;
    }
  }
  function onTouchEnd() { lastDist.current = null; }

  // Double click / double tap to zoom toggle
  const lastTap = useRef(0);
  function onDoubleClick() {
    if (scale > 1) {
      setScale(1); setPos({ x: 0, y: 0 }); lastPos.current = { x: 0, y: 0 };
    } else {
      setScale(2.5);
    }
  }
  function onTouchEndTap(e) {
    const now = Date.now();
    if (now - lastTap.current < 300) onDoubleClick();
    lastTap.current = now;
  }

  // Wheel zoom
  function onWheel(e) {
    e.preventDefault();
    setScale(s => Math.min(Math.max(s - e.deltaY * 0.003, 1), 4));
  }

  const imgStyle = {
    transform: `scale(${scale}) translate(${pos.x / scale}px, ${pos.y / scale}px)`,
    cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in",
    transition: dragging ? "none" : "transform 0.2s ease",
    touchAction: "none",
    userSelect: "none",
  };

  return (
    <div
      className="lightbox-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <button className="lightbox-close" onClick={onClose} aria-label="Закрити">×</button>
      {scale > 1 && (
        <button className="lightbox-reset" onClick={() => { setScale(1); setPos({ x: 0, y: 0 }); lastPos.current = { x: 0, y: 0 }; }}>
          1:1
        </button>
      )}
      <img
        src={src}
        alt={alt}
        className="lightbox-img"
        style={imgStyle}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onDoubleClick={onDoubleClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={e => { onTouchEnd(); onTouchEndTap(e); }}
        onWheel={onWheel}
        draggable={false}
      />
      <div className="lightbox-hint">
        {scale > 1 ? "Двічі клікніть для скидання" : "Двічі клікніть або скрольте для збільшення"}
      </div>
    </div>
  );
}

// ── ProductModal ──────────────────────────────────────────────────────────────
export function ProductModal({ product, usdRate, onAddToCart, onClose, products, onSelect }) {
  const priceInfo = parsePriceInfo(product);
  const priceOld = parsePriceOld(product);
  const [added, setAdded] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const similar = useMemo(() => getSimilar(product, products), [product, products]);

  useEffect(() => {
    const handler = e => { if (e.key === "Escape" && !lightbox) onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, lightbox]);

  function handleAdd() {
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose} aria-label="Закрити">×</button>
          {product.image && (
            <div className="modal-img-wrap" onClick={() => setLightbox(true)}>
              <img src={product.image} alt={product.title} className="modal-img" loading="lazy" />
              <div className="modal-img-zoom-hint">🔍</div>
            </div>
          )}
          <div className="modal-body">
            <div className="modal-meta">
              {product.category && <span className="modal-tag">{product.category}</span>}
              {product.subcategory && <span className="modal-tag">{product.subcategory}</span>}
            </div>
            <h2 className="modal-title">{product.title}</h2>
            <PriceDisplay priceInfo={priceInfo} priceOld={priceOld} usdRate={usdRate} className="modal-price" />
            {priceInfo && priceOld && priceOld > priceInfo.amount && (
              <span className="modal-discount">
                -{Math.round((1 - priceInfo.amount / priceOld) * 100)}%
              </span>
            )}
            {product.description && (
              <p className="modal-desc">{product.description}</p>
            )}
            <button
              className={`modal-cart-btn ${added ? "modal-cart-btn--added" : ""}`}
              disabled={!priceInfo}
              onClick={handleAdd}
            >
              {!priceInfo ? "Немає ціни" : added ? "Додано ✓" : "🛍 Додати в кошик"}
            </button>

            {similar.length > 0 && (
              <div className="modal-similar">
                <div className="modal-similar-title">Схожі товари</div>
                <div className="modal-similar-list">
                  {similar.map(p => {
                    const pi = parsePriceInfo(p);
                    const priceStr = pi
                      ? (() => { const c = toUah(pi.amount, pi.currency, usdRate); return formatMoney(Math.round(c.amount), c.currency); })()
                      : "";
                    return (
                      <button
                        key={p.id}
                        className="modal-similar-card"
                        onClick={() => onSelect(p)}
                      >
                        {p.image
                          ? <img src={p.image} alt={p.title} className="modal-similar-img" loading="lazy" />
                          : <div className="modal-similar-img modal-similar-img--empty" />
                        }
                        <span className="modal-similar-name">{p.title}</span>
                        {priceStr && <span className="modal-similar-price">{priceStr}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {lightbox && (
        <Lightbox
          src={product.image}
          alt={product.title}
          onClose={() => setLightbox(false)}
        />
      )}
    </>
  );
}
