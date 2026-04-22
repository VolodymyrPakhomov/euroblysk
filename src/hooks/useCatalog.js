import { useState, useEffect, useMemo } from "react";
import { EXTRA_TREE_GROUPS } from "../catalogData.js";
import { normalizeLabel } from "../utils/catalog.js";
import { PRODUCTS_URL } from "../config.js";

/**
 * Завантажує товари з PRODUCTS_URL і керує всім станом каталогу:
 * фільтрацією за 4-рівневою ієрархією категорій, текстовим пошуком
 * і станом розгорнутого/згорнутого дерева в сайдбарі.
 *
 * Структура об'єкта `tree`:
 *   { [category]: { [subcategory]: { [group]: Set<subgroup> } } }
 *
 * EXTRA_TREE_GROUPS з catalogData.js вливається в дерево, щоб категорії
 * відображались в меню навіть якщо жоден товар ще не належить до них.
 *
 * @returns {{
 *   products: Array,           — всі товари без фільтрації
 *   filtered: Array,           — товари після пошуку та фільтрів
 *   tree: Object,              — вкладене дерево категорій (див. структуру вище)
 *   search: string,
 *   setSearch: Function,
 *   activeCat: string|null,
 *   activeSub: string|null,
 *   activeGrp: string|null,
 *   activeSubgrp: string|null,
 *   openCats: Object,          — { [cat]: true } — які категорії розгорнуті
 *   breadcrumb: string,        — напр. "Краса та здоров'я → Особиста гігієна"
 *   toggleCat: Function,
 *   selectSub: Function,
 *   selectGrp: Function,
 *   selectSubgrp: Function,
 *   resetFilters: Function,
 *   updateProduct: Function,   — оновлює товар локально після збереження адміном
 * }}
 */
export function useCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const savedCat = localStorage.getItem("euroblysk_open_cat") || null;
  const [activeCat, setActiveCat] = useState(savedCat);
  const [activeSub, setActiveSub] = useState(null);
  const [activeGrp, setActiveGrp] = useState(null);
  const [activeSubgrp, setActiveSubgrp] = useState(null);
  const [openCats, setOpenCats] = useState(savedCat ? { [savedCat]: true } : {});
  const [sortBy, setSortBy] = useState("default");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [currency, setCurrency] = useState("");
  const [activeBrand, setActiveBrand] = useState(null);

  useEffect(() => {
    fetch(PRODUCTS_URL)
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false); })
      .catch(() => { console.error("Не вдалося завантажити products.json"); setLoading(false); });
  }, []);

  const tree = useMemo(() => {
    const t = {};
    products.forEach(p => {
      const cat = normalizeLabel(p.category || "");
      const sub = normalizeLabel(p.subcategory || "");
      const grp = normalizeLabel(p.group || "");
      const subgrp = normalizeLabel(p.subgroup || "");
      if (!cat) return;
      if (!t[cat]) t[cat] = {};
      if (sub && !t[cat][sub]) t[cat][sub] = {};
      if (sub && grp && !t[cat][sub][grp]) t[cat][sub][grp] = new Set();
      if (sub && grp && subgrp) t[cat][sub][grp].add(subgrp);
    });
    // Додаємо категорії з EXTRA_TREE_GROUPS, яких ще немає в товарах
    Object.entries(EXTRA_TREE_GROUPS).forEach(([cat, subMap]) => {
      if (!t[cat]) t[cat] = {};
      Object.entries(subMap).forEach(([sub, groupsMap]) => {
        if (!t[cat][sub]) t[cat][sub] = {};
        Object.entries(groupsMap).forEach(([grp, subgroups]) => {
          if (!t[cat][sub][grp]) t[cat][sub][grp] = new Set();
          subgroups.forEach(sg => t[cat][sub][grp].add(sg));
        });
      });
    });
    return t;
  }, [products]);

  const priceRange = useMemo(() => {
    const prices = products.map(p => Number(p.price)).filter(n => n > 0);
    if (!prices.length) return { min: 0, max: 0 };
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [products]);

  /** Витягти бренд з назви товару — перше слово */
  function extractBrand(title) {
    return title.trim().split(/\s+/)[0] || "";
  }

  /** Список брендів з кількістю (тільки ≥3 товари) */
  const brands = useMemo(() => {
    const pool = activeCat
      ? products.filter(p => normalizeLabel(p.category || "") === activeCat)
      : products;
    const counts = {};
    pool.forEach(p => {
      const b = extractBrand(p.title);
      if (b) counts[b] = (counts[b] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, n]) => n >= 3)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [products, activeCat]);

  const duplicateTitles = useMemo(() => {
    const seen = {};
    products.forEach(p => { seen[p.title] = (seen[p.title] || 0) + 1; });
    return new Set(Object.keys(seen).filter(t => seen[t] > 1));
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const minVal = priceMin !== "" ? Number(priceMin) : null;
    const maxVal = priceMax !== "" ? Number(priceMax) : null;
    const list = products.filter(p => {
      if (q && !p.title?.toLowerCase().includes(q) && !p.description?.toLowerCase().includes(q)) return false;
      if (activeCat && normalizeLabel(p.category || "") !== activeCat) return false;
      if (activeSub && normalizeLabel(p.subcategory || "") !== activeSub) return false;
      if (activeGrp && normalizeLabel(p.group || "") !== activeGrp) return false;
      if (activeSubgrp && normalizeLabel(p.subgroup || "") !== activeSubgrp) return false;
      const price = Number(p.price) || 0;
      if (minVal !== null && price < minVal) return false;
      if (maxVal !== null && price > maxVal) return false;
      if (currency && (p.currency || "UAH") !== currency) return false;
      if (activeBrand && extractBrand(p.title) !== activeBrand) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      const aOut = a.is_out_of_stock ? 1 : 0;
      const bOut = b.is_out_of_stock ? 1 : 0;
      if (aOut !== bOut) return aOut - bOut; // Відсутні товари падають вниз

      if (sortBy === "price_asc")  return (Number(a.price) || 0) - (Number(b.price) || 0);
      if (sortBy === "price_desc") return (Number(b.price) || 0) - (Number(a.price) || 0);
      if (sortBy === "newest")     return new Date(b.date || 0) - new Date(a.date || 0);
      return 0;
    });
  }, [products, search, activeCat, activeSub, activeGrp, activeSubgrp, sortBy, priceMin, priceMax, currency, activeBrand]);

  function toggleCat(cat) {
    // "Продукти" не має підкатегорій — клік фільтрує без розкриття підменю
    if (cat === "Продукти") {
      setOpenCats({});
    } else {
      setOpenCats(prev => (!prev[cat] ? { [cat]: true } : {}));
    }
    setActiveCat(cat === activeCat ? null : cat);
    setActiveSub(null);
    setActiveGrp(null);
    setActiveSubgrp(null);
  }

  function selectSub(cat, sub) {
    setActiveCat(cat);
    setActiveSub(sub === activeSub ? null : sub);
    setActiveGrp(null);
    setActiveSubgrp(null);
  }

  function selectGrp(cat, sub, grp) {
    setActiveCat(cat);
    setActiveSub(sub);
    setActiveGrp(grp === activeGrp ? null : grp);
    setActiveSubgrp(null);
  }

  function selectSubgrp(cat, sub, grp, subgrp) {
    setActiveCat(cat);
    setActiveSub(sub);
    setActiveGrp(grp);
    setActiveSubgrp(subgrp === activeSubgrp ? null : subgrp);
  }

  function resetFilters() {
    setActiveCat(null);
    setActiveSub(null);
    setActiveGrp(null);
    setActiveSubgrp(null);
    setSearch("");
    setOpenCats({});
    setPriceMin("");
    setPriceMax("");
    setCurrency("");
    setActiveBrand(null);
  }

  /** Оновлює один товар в локальному стані після збереження адміном (без перезавантаження) */
  function updateProduct(updatedProduct) {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  }

  const breadcrumb = [...[activeCat, activeSub, activeGrp, activeSubgrp].filter(Boolean), ...(activeBrand ? [`Бренд: ${activeBrand}`] : [])].join(" → ");

  return {
    products, loading, tree, filtered, search, setSearch,
    activeCat, activeSub, activeGrp, activeSubgrp, openCats,
    sortBy, setSortBy,
    priceMin, setPriceMin, priceMax, setPriceMax, priceRange,
    currency, setCurrency,
    activeBrand, setActiveBrand, brands,
    duplicateTitles,
    breadcrumb,
    toggleCat, selectSub, selectGrp, selectSubgrp, resetFilters, updateProduct,
  };
}
