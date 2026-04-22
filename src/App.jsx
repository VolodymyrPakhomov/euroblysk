import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import "./App.css";
import { useCatalog } from "./hooks/useCatalog.js";
import { useCart } from "./hooks/useCart.js";
import { useAdmin } from "./hooks/useAdmin.js";
import { useSettings } from "./hooks/useSettings.js";
import { useWishlist } from "./hooks/useWishlist.js";
import { BubblesBg, HeaderBubbles } from "./components/BubblesBg.jsx";
import { Sidebar } from "./components/Sidebar.jsx";
import { ProductCard } from "./components/ProductCard.jsx";
import { ProductModal } from "./components/ProductModal.jsx";
import { CartPage } from "./components/CartPage.jsx";
import { EditModal } from "./components/EditModal.jsx";
import { HeroSlider } from "./components/HeroSlider.jsx";
import { Footer } from "./components/Footer.jsx";
import { IconPhone, IconTelegram, IconBag } from "./components/icons.jsx";
import { SearchBox } from "./components/SearchBox.jsx";
import { HERO_IMAGES, PHONE_NUMBER, TELEGRAM_URL } from "./config.js";

const PAGE_SIZE = 48;

function UsdRateEditor({ usdRate, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");
  const [saving, setSaving] = useState(false);

  function open() { setVal(String(usdRate)); setEditing(true); }

  async function save() {
    const n = Number(val);
    if (!n || n <= 0) return;
    setSaving(true);
    try { await onSave(n); setEditing(false); } catch {}
    setSaving(false);
  }

  if (!editing) return (
    <button className="admin-badge" onClick={open} title="Змінити курс USD">
      1$ = {usdRate} грн
    </button>
  );

  return (
    <div className="rate-editor">
      <span>1$ =</span>
      <input
        className="rate-input"
        type="number"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
        autoFocus
      />
      <span>грн</span>
      <button className="admin-badge" onClick={save} disabled={saving}>
        {saving ? "…" : "✓"}
      </button>
      <button className="admin-badge" onClick={() => setEditing(false)}>✕</button>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("catalog");
  const [selected, setSelected] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (window.innerWidth > 768) return;
    if (sidebarOpen) {
      const y = window.scrollY;
      document.body.dataset.scrollY = y;
      document.body.style.top = `-${y}px`;
      document.body.classList.add("menu-open");
    } else {
      const y = Number(document.body.dataset.scrollY || 0);
      document.body.classList.remove("menu-open");
      document.body.style.top = "";
      window.scrollTo(0, y);
    }
    return () => {
      document.body.classList.remove("menu-open");
      document.body.style.top = "";
    };
  }, [sidebarOpen]);

  // Відстежуємо скрол для кнопки "Вгору" та ховання шапки
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setShowScrollTop(currentY > 500);
      
      if (currentY > 100 && currentY > lastScrollY.current) {
        setIsHeaderVisible(false); // Скрол вниз
      } else {
        setIsHeaderVisible(true);  // Скрол вгору
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [cartToast, setCartToast] = useState("");
  const sentinelRef = useRef(null);

  const catalog = useCatalog();
  const { cart, cartCount, cartTotals, telegramUrl, addToCart, increaseItem, decreaseItem, clearCart, syncCartImages } = useCart();
  const { isAdmin, adminKey, logout } = useAdmin();
  const { usdRate, saveRate } = useSettings();
  const { wishlistIds, toggleWishlist, inWishlist, wishlistCount } = useWishlist();
  const [showWishlist, setShowWishlist] = useState(false);
  const cartSynced = useRef(false);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [catalog.activeCat, catalog.activeSub, catalog.activeGrp, catalog.activeSubgrp]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) setVisibleCount(v => v + PAGE_SIZE);
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (catalog.products.length && !cartSynced.current) {
      cartSynced.current = true;
      syncCartImages(catalog.products);
    }
  }, [catalog.products]);

  const saveProducts = useCallback((products) =>
    fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminKey}` },
      body: JSON.stringify(products),
    }).then(res => { if (!res.ok) throw new Error("Помилка сервера"); }),
  [adminKey]);

  const isNewProduct = editTarget && editTarget.__isNew;

  const addToCartWithToast = useCallback((product) => {
    addToCart(product);
    const name = product.title.length > 30 ? product.title.slice(0, 30) + "…" : product.title;
    setCartToast(name);
    setTimeout(() => setCartToast(""), 2500);
  }, [addToCart]);

  const handleSave = useCallback(async (updatedProduct) => {
    setSaving(true);
    setSaveMsg("");
    try {
      const { __isNew, ...product } = updatedProduct;
      const newList = __isNew
        ? [...catalog.products, product]
        : catalog.products.map(p => p.id === product.id ? product : p);
      await saveProducts(newList);
      if (__isNew) {
        setSaveMsg("Збережено ✓ Оновлення...");
        setTimeout(() => window.location.reload(), 800);
        return;
      } else {
        catalog.updateProduct(product);
        setEditTarget(null);
        setSaveMsg("Збережено ✓");
        setTimeout(() => setSaveMsg(""), 3000);
      }
    } catch {
      setSaveMsg("Помилка збереження ✗");
    } finally {
      setSaving(false);
    }
  }, [catalog, saveProducts]);

  function handleAddProduct() {
    const newId = Date.now();
    setEditTarget({ id: newId, title: "", description: "", price: "", price_old: "", currency: "UAH", category: "", subcategory: "", group: "", subgroup: "", __isNew: true });
  }

  const handleDelete = useCallback(async (product) => {
    if (!window.confirm(`Видалити «${product.title}»?`)) return;
    try {
      await saveProducts(catalog.products.filter(p => p.id !== product.id));
      window.location.reload();
    } catch {
      alert("Помилка видалення");
    }
  }, [catalog, saveProducts]);

  return (
    <div className="app">
      <BubblesBg />
      <HeaderBubbles />

      <header className={`header ${!isHeaderVisible ? "header--hidden" : ""}`}>
        <div className="header-inner">
          {page === "catalog" && (
            <button className="burger" onClick={() => setSidebarOpen(o => !o)} aria-label="Меню">☰</button>
          )}
          {page === "catalog" && (
            <button className="mobile-search-btn" onClick={() => setSidebarOpen(true)} aria-label="Пошук">⌕</button>
          )}
          <button className="logo-btn" onClick={() => setPage("catalog")}>
            <img src="/logo2.svg" alt="EuroBlysk" className="logo-img" />
            <span className="logo-text">EuroBlysk</span>
          </button>
          {page === "catalog" && (
            <SearchBox
              value={catalog.search}
              onChange={catalog.setSearch}
              products={catalog.products}
              usdRate={usdRate}
              onSelect={p => { catalog.setSearch(""); setSelected(p); }}
            />
          )}
          <button
            className={`cart-indicator ${page === "cart" ? "active" : ""}`}
            onClick={() => setPage("cart")}
          >
            <IconBag size={20} /> <span className="cart-label">Кошик</span>
            <span className="cart-badge">{cartCount}</span>
            {cartTotals.UAH > 0 && (
              <span className="cart-total-hint">{Math.round(cartTotals.UAH)} грн</span>
            )}
          </button>

          <div className="header-contacts">
            <a className="header-icon-btn" href={`tel:${PHONE_NUMBER}`} aria-label="Телефон">
              <IconPhone size={24} />
            </a>
            <a className="header-icon-btn header-icon-btn--tg" href={TELEGRAM_URL} target="_blank" rel="noreferrer" aria-label="Telegram">
              <IconTelegram size={24} />
            </a>
            {isAdmin && (
              <>
                <UsdRateEditor usdRate={usdRate} onSave={rate => saveRate(rate, adminKey)} />
                <button className="admin-badge" onClick={logout} title="Вийти з режиму адміна">Адмін ✕</button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="layout">
        {page === "catalog" && sidebarOpen && (
          <div
            className="overlay"
            onClick={() => setSidebarOpen(false)}
            onTouchMove={e => e.preventDefault()}
          />
        )}

        {page === "catalog" && (
          <div className={`sidebar-wrap ${sidebarOpen ? "open" : ""}`}>
            <Sidebar
              tree={catalog.tree}
              products={catalog.products}
              activeCat={catalog.activeCat}
              activeSub={catalog.activeSub}
              activeGrp={catalog.activeGrp}
              activeSubgrp={catalog.activeSubgrp}
              openCats={catalog.openCats}
              onReset={catalog.resetFilters}
              onToggleCat={catalog.toggleCat}
              onSelectSub={catalog.selectSub}
              onSelectGrp={catalog.selectGrp}
              onSelectSubgrp={catalog.selectSubgrp}
              onClose={() => setSidebarOpen(false)}
              search={catalog.search}
              onSearch={catalog.setSearch}
              priceMin={catalog.priceMin}
              priceMax={catalog.priceMax}
              priceRange={catalog.priceRange}
              onPriceMin={catalog.setPriceMin}
              onPriceMax={catalog.setPriceMax}
              currency={catalog.currency}
              onCurrency={catalog.setCurrency}
              brands={catalog.brands}
              activeBrand={catalog.activeBrand}
              onBrand={catalog.setActiveBrand}
            />
          </div>
        )}

        <main className="content">
          {page === "catalog" ? (
            <>
              {!catalog.activeCat && <HeroSlider images={HERO_IMAGES} />}
              <div className="toolbar">
                <div className="breadcrumb">
                  {catalog.breadcrumb ? (
                    <>
                      <button className="bc-reset" onClick={catalog.resetFilters}>Всі товари</button>
                      <span className="bc-sep"> / </span>
                      <span className="bc-current">{catalog.breadcrumb}</span>
                    </>
                  ) : (
                    <span className="bc-current">Всі товари</span>
                  )}
                </div>
                <button
                  className={`wishlist-filter-btn ${showWishlist ? "wishlist-filter-btn--active" : ""}`}
                  onClick={() => setShowWishlist(v => !v)}
                >
                  {showWishlist ? "♥" : "♡"} Обране
                  {wishlistCount > 0 && <span className="wishlist-filter-count">{wishlistCount}</span>}
                </button>
                <span className="count-text">{catalog.filtered.length} товарів</span>
                <select
                  className="sort-select"
                  value={catalog.sortBy}
                  onChange={e => catalog.setSortBy(e.target.value)}
                >
                  <option value="default">За замовчуванням</option>
                  <option value="price_asc">Ціна: від дешевих</option>
                  <option value="price_desc">Ціна: від дорогих</option>
                  <option value="newest">Новинки</option>
                </select>
                {isAdmin && (
                  <button className="add-product-btn" onClick={handleAddProduct}>+ Додати товар</button>
                )}
              </div>

              <div className="grid">
                {catalog.loading && (
                  Array.from({ length: 12 }).map((_, i) => (
                    <article key={`skeleton-${i}`} className="card skeleton-card">
                      <div className="card-img-wrap skeleton-img"></div>
                      <div className="card-body">
                        <div className="skeleton-line skeleton-title"></div>
                        <div className="skeleton-line skeleton-subtitle"></div>
                        <div className="skeleton-line skeleton-price"></div>
                        <div className="skeleton-btn"></div>
                      </div>
                    </article>
                  ))
                )}
                {!catalog.loading && catalog.filtered.length === 0 && (
                  <div className="empty-state">
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="11" cy="11" r="7" fill="var(--accent-light)" stroke="var(--accent)" strokeWidth="1.5"/>
                      <path d="M20 20L17 17" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M11 8A3 3 0 0 0 8 11" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <p className="empty-state-title">Нічого не знайдено</p>
                    <p className="empty-state-desc">Спробуйте змінити пошуковий запит або скинути фільтри</p>
                  </div>
                )}
                {(() => {
                  const displayList = showWishlist
                    ? catalog.filtered.filter(p => inWishlist(p.id))
                    : catalog.filtered;
                  if (showWishlist && displayList.length === 0) {
                    return (
                      <div className="empty-state">
                        <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="var(--accent-light)" stroke="var(--accent)" strokeWidth="1.5"/>
                          <path d="M16.5 6A2.5 2.5 0 0 1 19 8.5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <p className="empty-state-title">В обраному порожньо</p>
                        <p className="empty-state-desc">Додавайте сюди товари, щоб не загубити їх</p>
                      </div>
                    );
                  }
                  return displayList.slice(0, visibleCount).map((p, i) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      index={i}
                      usdRate={usdRate}
                      cartQty={cart.find(c => c.id === (p.id || p.title))?.qty || 0}
                      showSubtitle={catalog.duplicateTitles.has(p.title)}
                      onSelect={setSelected}
                      onAddToCart={addToCartWithToast}
                      onIncrease={increaseItem}
                      onDecrease={decreaseItem}
                      isAdmin={isAdmin}
                      onEdit={setEditTarget}
                      onDelete={handleDelete}
                      inWishlist={inWishlist(p.id)}
                      onToggleWishlist={toggleWishlist}
                    />
                  ));
                })()}
              </div>
              <div ref={sentinelRef} className="scroll-sentinel" />
              {visibleCount < (showWishlist ? catalog.filtered.filter(p => inWishlist(p.id)) : catalog.filtered).length && (
                <div className="load-more-indicator">
                  <span className="catalog-spinner" />
                </div>
              )}
            </>
          ) : (
            <CartPage
              cart={cart}
              cartTotals={cartTotals}
              usdRate={usdRate}
              onIncrease={increaseItem}
              onDecrease={decreaseItem}
              onClear={clearCart}
              onBack={() => setPage("catalog")}
            />
          )}
        </main>
      </div>

      {selected && (
        <ProductModal
          product={selected}
          usdRate={usdRate}
          onAddToCart={addToCartWithToast}
          onClose={() => setSelected(null)}
          products={catalog.products}
          onSelect={setSelected}
        />
      )}

      {editTarget && (
        <EditModal
          product={editTarget}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
          saving={saving}
          adminKey={adminKey}
        />
      )}

      {saveMsg && (
        <div className={`save-toast ${saveMsg.includes("✓") ? "save-toast--ok" : "save-toast--err"}`}>
          {saveMsg}
        </div>
      )}


      {cartToast && (
        <div className="cart-toast">
          <span className="cart-toast-icon">🛍</span> {cartToast} — додано до кошика
        </div>
      )}

      <Footer />

      {/* Кнопка швидкого повернення нагору */}
      {showScrollTop && (
        <button className="scroll-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Вгору">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </button>
      )}

      {/* Плаваюча корзина для мобільних */}
      {cartCount > 0 && page === "catalog" && (
        <div className="mobile-sticky-cart" onClick={() => setPage("cart")}>
          <div className="sticky-cart-info">
            <IconBag size={24} />
            <span>{cartCount} товарів на {Math.round(cartTotals.UAH)} грн</span>
          </div>
          <button className="sticky-cart-btn">Оформити</button>
        </div>
      )}
    </div>
  );
}
