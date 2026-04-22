import { useState, useRef, useEffect, useCallback } from "react";
import { parsePriceInfo } from "../utils/price.js";
import { formatMoney } from "../utils/price.js";
import { toUah } from "../utils/price.js";

const MIN_QUERY = 2;
const MAX_SUGGESTIONS = 8;

function normalize(str) {
  return str.toLowerCase().replace(/\s+/g, " ").trim();
}

export function SearchBox({ value, onChange, products, usdRate, onSelect }) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const suggestions = useCallback(() => {
    if (!value || value.length < MIN_QUERY) return [];
    const q = normalize(value);
    return products
      .filter(p => normalize(p.title).includes(q))
      .slice(0, MAX_SUGGESTIONS);
  }, [value, products])();

  useEffect(() => {
    setCursor(-1);
    setOpen(suggestions.length > 0);
  }, [value]);

  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleKeyDown(e) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor(c => Math.min(c + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor(c => Math.max(c - 1, -1));
    } else if (e.key === "Enter" && cursor >= 0) {
      e.preventDefault();
      pick(suggestions[cursor]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function pick(product) {
    setOpen(false);
    onChange("");
    onSelect(product);
  }

  return (
    <div className="search-wrap" ref={wrapRef}>
      <span className="search-icon">⌕</span>
      <input
        ref={inputRef}
        className="search"
        type="text"
        placeholder="Пошук товарів..."
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {value && (
        <button className="search-clear" onClick={() => onChange("")} aria-label="Очистити пошук">×</button>
      )}
      {open && (
        <ul className="search-suggestions">
          {suggestions.map((p, i) => {
            const priceInfo = parsePriceInfo(p);
            const priceStr = priceInfo
              ? (() => { const c = toUah(priceInfo.amount, priceInfo.currency, usdRate); return formatMoney(Math.round(c.amount), c.currency); })()
              : "";
            return (
              <li
                key={p.id}
                className={`search-suggestion ${cursor === i ? "search-suggestion--active" : ""}`}
                onMouseDown={() => pick(p)}
                onMouseEnter={() => setCursor(i)}
              >
                {p.image
                  ? <img src={p.image} alt="" className="sugg-img" loading="lazy" />
                  : <div className="sugg-img sugg-img--empty" />
                }
                <span className="sugg-title">{p.title}</span>
                {priceStr && <span className="sugg-price">{priceStr}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
