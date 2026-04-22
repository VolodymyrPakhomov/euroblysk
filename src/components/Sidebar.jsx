import { useMemo, useRef, useEffect, useState } from "react";
import { normalizeLabel, getCatIcon } from "../utils/catalog.js";

const STORAGE_KEY = "euroblysk_open_cat";

function Arrow({ open }) {
  return <span className={`menu-arrow ${open ? "menu-arrow--open" : ""}`} />;
}

function CatIcon({ label, size = 15, className = "cat-icon" }) {
  const Icon = getCatIcon(label);
  if (!Icon) return null;
  return <Icon size={size} className={className} strokeWidth={1.75} />;
}

function SubItem({ label, count, isActive, onClick, refProp, hasChildren }) {
  return (
    <button
      ref={refProp}
      className={`sub-item ${isActive ? "active" : ""}`}
      onClick={onClick}
    >
      <span className="cat-name">{label}</span>
      <CatIcon label={label} size={18} />
      <span className="cat-count">{count}</span>
      {hasChildren && <Arrow open={isActive} />}
    </button>
  );
}

function GrpItem({ label, count, isActive, onClick, refProp, hasChildren }) {
  return (
    <button
      ref={refProp}
      className={`grp-item ${isActive ? "active" : ""}`}
      onClick={onClick}
    >
      <span className="cat-name">{label}</span>
      <CatIcon label={label} size={16} />
      <span className="cat-count">{count}</span>
      {hasChildren && <Arrow open={isActive} />}
    </button>
  );
}

function SubgrpItem({ label, count, isActive, onClick, refProp }) {
  return (
    <button
      ref={refProp}
      className={`subgrp-item ${isActive ? "active" : ""}`}
      onClick={onClick}
    >
      <span className="cat-name">{label}</span>
      <CatIcon label={label} size={14} />
      <span className="cat-count">{count}</span>
    </button>
  );
}

export function Sidebar({ tree, products, activeCat, activeSub, activeGrp, activeSubgrp, openCats, onReset, onToggleCat, onSelectSub, onSelectGrp, onSelectSubgrp, onClose, search, onSearch, priceMin, priceMax, priceRange, onPriceMin, onPriceMax, currency, onCurrency, brands, activeBrand, onBrand }) {
  const activeRef = useRef(null);
  const activeCatRef = useRef(null);
  const sidebarRef = useRef(null);
  const [priceOpen, setPriceOpen] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const [brandOpen, setBrandOpen] = useState(false);

  useEffect(() => {
    if (activeCat) localStorage.setItem(STORAGE_KEY, activeCat);
    else localStorage.removeItem(STORAGE_KEY);
  }, [activeCat]);

  // На мобільному — скролимо sidebar так, щоб активна категорія була зверху
  useEffect(() => {
    if (!activeCat || !activeCatRef.current || !sidebarRef.current) return;
    if (window.innerWidth > 768) return;
    const catTop = activeCatRef.current.offsetTop;
    sidebarRef.current.scrollTo({ top: catTop, behavior: "smooth" });
  }, [activeCat]);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeSub, activeGrp, activeSubgrp]);

  const counts = useMemo(() => {
    const cat = {}, sub = {}, grp = {}, subgrp = {};
    products.forEach(p => {
      const c = normalizeLabel(p.category || "");
      const s = normalizeLabel(p.subcategory || "");
      const g = normalizeLabel(p.group || "");
      const sg = normalizeLabel(p.subgroup || "");
      if (c) cat[c] = (cat[c] || 0) + 1;
      if (c && s) { const k = `${c}|${s}`; sub[k] = (sub[k] || 0) + 1; }
      if (c && s && g) { const k = `${c}|${s}|${g}`; grp[k] = (grp[k] || 0) + 1; }
      if (c && s && g && sg) { const k = `${c}|${s}|${g}|${sg}`; subgrp[k] = (subgrp[k] || 0) + 1; }
    });
    return { cat, sub, grp, subgrp };
  }, [products]);

  const hasActiveFilter = !!(activeCat || activeSub || activeGrp || activeSubgrp || priceMin || priceMax || currency || activeBrand);

  return (
    <aside className="sidebar" ref={sidebarRef}>
      <div className="sidebar-header">
        <span className="sidebar-title">Категорії</span>
        <div className="sidebar-header-right">
          {hasActiveFilter && (
            <button
              className="sidebar-reset-btn"
              onClick={() => { onReset(); }}
              title="Скинути фільтри"
            >
              Скинути ×
            </button>
          )}
          {priceRange && priceRange.max > 0 && (
            <button
              className={`price-pill-btn ${priceOpen ? "active" : ""} ${(priceMin || priceMax) ? "has-value" : ""}`}
              onClick={() => setPriceOpen(o => !o)}
            >
              Ціна {(priceMin || priceMax) ? "●" : ""}
            </button>
          )}
          {brands && brands.length > 0 && (
            <button
              className={`price-pill-btn ${brandOpen ? "active" : ""} ${activeBrand ? "has-value" : ""}`}
              onClick={() => setBrandOpen(o => !o)}
            >
              Бренд {activeBrand ? "●" : ""}
            </button>
          )}
          <button className="sidebar-close" onClick={onClose} aria-label="Закрити">×</button>
        </div>
      </div>

      <div className="sidebar-search-wrap">
        <span className="search-icon">⌕</span>
        <input
          className="sidebar-search"
          type="text"
          placeholder="Пошук товарів..."
          value={search}
          onChange={e => onSearch(e.target.value)}
        />
        {search && (
          <button className="search-clear" onClick={() => onSearch("")} aria-label="Очистити">×</button>
        )}
      </div>

      {/* Панель фільтру ціни */}
      {priceRange && priceRange.max > 0 && (
        <div className={`price-filter-body ${priceOpen ? "price-filter-body--open" : ""}`}>
          <div>
            <div className="price-filter-inputs">
              <input className="price-input" type="number" min={0} placeholder={priceRange.min} value={priceMin} onChange={e => onPriceMin(e.target.value)} />
              <span className="price-dash">—</span>
              <input className="price-input" type="number" min={0} placeholder={priceRange.max} value={priceMax} onChange={e => onPriceMax(e.target.value)} />
            </div>
            <div className="currency-filter">
              {["", "UAH", "USD"].map(c => (
                <button key={c || "all"} className={`currency-btn ${currency === c ? "active" : ""}`} onClick={() => onCurrency(c)}>
                  {c || "Всі"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Фільтр по бренду */}
      {brands && brands.length > 0 && brandOpen && (
        <div className="brand-filter">
            <div className="brand-filter-body">
              <input
                className="brand-search-input"
                type="text"
                placeholder="Пошук бренду..."
                value={brandSearch}
                onChange={e => setBrandSearch(e.target.value)}
              />
              <div className="brand-list">
                {brands
                  .filter(b => !brandSearch || b.name.toLowerCase().includes(brandSearch.toLowerCase()))
                  .map(b => (
                    <button
                      key={b.name}
                      className={`brand-item ${activeBrand === b.name ? "active" : ""}`}
                      onClick={() => { onBrand(activeBrand === b.name ? null : b.name); setBrandOpen(false); setBrandSearch(""); }}
                    >
                      <span className="brand-name">{b.name}</span>
                      <span className="brand-count">{b.count}</span>
                    </button>
                  ))
                }
              </div>
            </div>
        </div>
      )}

      {/* Список категорій — ховається коли відкрита підкатегорія */}
      {!activeCat && (
        <div className="top-cat-tabs">
          <button
            className="top-cat-tab top-cat-tab--all active"
            onClick={() => { onReset(); onClose(); }}
          >
            <span className="cat-name">Всі</span>
          </button>
          {Object.keys(tree).map(cat => {
            const hasSubs = Object.keys(tree[cat] || {}).length > 0;
            return (
              <button
                key={cat}
                className="top-cat-tab"
                onClick={() => { onToggleCat(cat); if (!hasSubs) onClose(); }}
              >
                <span className="cat-name">{cat}</span>
                <CatIcon label={cat} size={20} />
                {hasSubs && <Arrow open={false} />}
              </button>
            );
          })}
        </div>
      )}

      {/* Drill-down: підкатегорії обраної категорії */}
      {activeCat && (
        <div className="drill-down">
          <button className="drill-back-btn" onClick={() => onToggleCat(activeCat)}>
            <span className="drill-back-arrow">‹</span>
            <span>Категорії</span>
          </button>
          <div className="drill-title">
            <CatIcon label={activeCat} size={18} />
            <span>{activeCat}</span>
          </div>
          <div className="cat-list">
            {Object.entries(tree[activeCat] || {}).filter(([sub]) => sub !== activeCat).map(([sub, groupsMap]) => {
              const isSubActive = activeSub === sub;
              const hasGroups = Object.keys(groupsMap).length > 0;
              return (
                <div key={sub}>
                  <SubItem
                    label={sub}
                    count={counts.sub[`${activeCat}|${sub}`] || 0}
                    isActive={isSubActive}
                    hasChildren={hasGroups}
                    onClick={() => { onSelectSub(activeCat, sub); if (!hasGroups) onClose(); }}
                    refProp={isSubActive && !activeGrp ? activeRef : null}
                  />
                  <div className={`grp-list ${isSubActive ? "grp-list--open" : ""}`}>
                    <div>
                      {Object.keys(groupsMap).map(grp => {
                        const isGrpActive = activeGrp === grp && isSubActive;
                        const hasSubgroups = groupsMap[grp].size > 0;
                        return (
                          <div key={grp}>
                            <GrpItem
                              label={grp}
                              count={counts.grp[`${activeCat}|${sub}|${grp}`] || 0}
                              isActive={isGrpActive}
                              hasChildren={hasSubgroups}
                              onClick={() => { onSelectGrp(activeCat, sub, grp); if (!hasSubgroups) onClose(); }}
                              refProp={isGrpActive && !activeSubgrp ? activeRef : null}
                            />
                            <div className={`subgrp-list ${isGrpActive ? "subgrp-list--open" : ""}`}>
                              <div>
                                {[...groupsMap[grp]].map(subgrp => {
                                  const isSubgrpActive = activeSubgrp === subgrp && isGrpActive;
                                  return (
                                    <SubgrpItem
                                      key={`${grp}-${subgrp}`}
                                      label={subgrp}
                                      count={counts.subgrp[`${activeCat}|${sub}|${grp}|${subgrp}`] || 0}
                                      isActive={isSubgrpActive}
                                      onClick={() => { onSelectSubgrp(activeCat, sub, grp, subgrp); onClose(); }}
                                      refProp={isSubgrpActive ? activeRef : null}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
