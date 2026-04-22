import { useState } from "react";
import PropTypes from "prop-types";
import { parsePriceInfo, parsePriceOld } from "../utils/price.js";
import { PriceDisplay } from "./PriceDisplay.jsx";

export function ProductCard({ product, index, usdRate, cartQty, showSubtitle, onSelect, onAddToCart, onIncrease, onDecrease, isAdmin, onEdit, onDelete, inWishlist, onToggleWishlist }) {
  const priceInfo = parsePriceInfo(product);
  const priceOld = parsePriceOld(product);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const discountPercent = (priceOld && priceInfo && priceOld > priceInfo.amount) 
    ? Math.round((1 - priceInfo.amount / priceOld) * 100) 
    : 0;

  const handleAddToCart = (e) => {
    if (product.is_out_of_stock) return;
    e.stopPropagation();
    onAddToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);

    // Анимация полета картинки в корзину
    if (product.image && !imgError) {
      const card = e.currentTarget.closest(".card");
      const img = card?.querySelector(".card-img");
      
      // Ищем иконку корзины (мобильную или десктопную)
      let cartIcon = document.querySelector(".mobile-sticky-cart");
      if (!cartIcon || window.getComputedStyle(cartIcon).display === "none") {
        cartIcon = document.querySelector(".cart-indicator");
      }

      if (img && cartIcon) {
        const imgRect = img.getBoundingClientRect();
        const cartRect = cartIcon.getBoundingClientRect();

        const clone = img.cloneNode(true);
        clone.style.position = "fixed";
        clone.style.top = `${imgRect.top}px`;
        clone.style.left = `${imgRect.left}px`;
        clone.style.width = `${imgRect.width}px`;
        clone.style.height = `${imgRect.height}px`;
        clone.style.zIndex = 9999;
        clone.style.transition = "all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)";
        clone.style.borderRadius = "12px";
        clone.style.pointerEvents = "none";
        clone.style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)";
        document.body.appendChild(clone);

        clone.getBoundingClientRect(); // Принудительный reflow для старта анимации

        const targetTop = cartRect.top + cartRect.height / 2 - imgRect.height / 4;
        const targetLeft = cartRect.left + cartRect.width / 2 - imgRect.width / 4;

        clone.style.top = `${targetTop}px`;
        clone.style.left = `${targetLeft}px`;
        clone.style.transform = "scale(0.1)";
        clone.style.opacity = "0";

        setTimeout(() => {
          clone.remove();
          cartIcon.classList.add("cart-bump");
          setTimeout(() => cartIcon.classList.remove("cart-bump"), 300);
        }, 600);
      }
    }
  };

  return (
    <article
      className={`card ${product.is_out_of_stock ? "out-of-stock" : ""}`}
      style={{ animationDelay: `${Math.min(index, 15) * 0.04}s` }}
      onClick={() => onSelect(product)}
    >
      <div className="card-img-wrap">
        {product.image && !imgError
          ? <img 
              src={product.image} 
              alt={product.title} 
              className={`card-img ${imgLoaded ? "loaded" : ""}`} 
              loading={index < 8 ? "eager" : "lazy"} 
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)} 
            />
          : <div className="card-no-img">📦</div>
        }
        {(product.is_new || product.is_sale || priceOld) && (
          <div className="card-badges">
            {product.is_new && <span className="badge badge--new">Новинка</span>}
            {(product.is_sale || priceOld) && <span className="badge badge--sale">Акція {discountPercent > 0 ? `-${discountPercent}%` : ""}</span>}
          </div>
        )}
        {onToggleWishlist && !isAdmin && (
          <button
            className={`card-wishlist-btn ${inWishlist ? "card-wishlist-btn--active" : ""}`}
            onClick={e => { e.stopPropagation(); onToggleWishlist(product.id); }}
            aria-label={inWishlist ? "Прибрати з обраного" : "Додати в обране"}
          >
            {inWishlist ? "♥" : "♡"}
          </button>
        )}
      </div>
      <div className="card-body">
        {product.subgroup && <span className="card-tag">{product.subgroup}</span>}
        <h2 className="card-title">{product.title}</h2>
        {showSubtitle && (product.group || product.subcategory) && (
          <p className="card-subtitle">{product.group || product.subcategory}</p>
        )}
        <PriceDisplay priceInfo={priceInfo} priceOld={priceOld} usdRate={usdRate} className="card-price" />
        {cartQty > 0 && !product.is_out_of_stock ? (
          <div className="card-qty-ctrl" onClick={e => e.stopPropagation()}>
            <button
              className="card-qty-btn card-qty-btn--minus"
              onClick={() => onDecrease(product.id)}
              aria-label="Зменшити"
            >−</button>
            <span className="card-qty-val">{cartQty}</span>
            <button
              className="card-qty-btn card-qty-btn--plus"
              onClick={() => onIncrease(product.id)}
              aria-label="Збільшити"
            >+</button>
          </div>
        ) : (
          <button
            className={`add-cart-btn ${justAdded ? "added-success" : ""}`}
            disabled={!priceInfo || product.is_out_of_stock}
            onClick={handleAddToCart}
          >
            {product.is_out_of_stock ? "Немає в наявності" : (!priceInfo ? "Немає ціни" : justAdded ? "✓ Додано" : "+ до кошика")}
          </button>
        )}
        {isAdmin && (
          <div className="admin-card-btns">
            <button
              className="edit-card-btn"
              onClick={e => { e.stopPropagation(); onEdit(product); }}
              aria-label="Редагувати"
            >✏️</button>
            <button
              className="delete-card-btn"
              onClick={e => { e.stopPropagation(); onDelete(product); }}
              aria-label="Видалити"
            >🗑️</button>
          </div>
        )}
      </div>
    </article>
  );
}

const productShape = PropTypes.shape({
  id:          PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  title:       PropTypes.string.isRequired,
  description: PropTypes.string,
  image:       PropTypes.string,
  price:       PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  price_old:   PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  currency:    PropTypes.oneOf(["UAH", "USD"]),
  category:    PropTypes.string,
  subcategory: PropTypes.string,
  group:       PropTypes.string,
  subgroup:    PropTypes.string,
});

ProductCard.propTypes = {
  product:     productShape.isRequired,
  index:       PropTypes.number.isRequired,  // для затримки анімації появи
  onSelect:    PropTypes.func.isRequired,
  onAddToCart: PropTypes.func.isRequired,
  isAdmin:     PropTypes.bool.isRequired,
  onEdit:      PropTypes.func.isRequired,
  onDelete:    PropTypes.func.isRequired,
};
