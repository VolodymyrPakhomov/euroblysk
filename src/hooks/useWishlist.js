import { useState, useCallback } from "react";

const STORAGE_KEY = "euroblysk_wishlist";

function load() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); }
  catch { return new Set(); }
}

function save(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

export function useWishlist() {
  const [ids, setIds] = useState(load);

  const toggle = useCallback((id) => {
    setIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      save(next);
      return next;
    });
  }, []);

  const has = useCallback((id) => ids.has(id), [ids]);

  return { wishlistIds: ids, toggleWishlist: toggle, inWishlist: has, wishlistCount: ids.size };
}
