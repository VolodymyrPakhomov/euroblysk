import { useState, useEffect, useMemo } from "react";
import { parsePriceInfo, formatMoney } from "../utils/price.js";
import { CART_STORAGE_KEY, TELEGRAM_URL } from "../config.js";

/**
 * Керує кошиком покупок. Стан зберігається в localStorage під ключем CART_STORAGE_KEY,
 * тому кошик зберігається між перезавантаженнями сторінки.
 *
 * Структура елемента кошика:
 *   { id, title, qty: number, amount: number, currency: "UAH"|"USD" }
 *
 * `telegramUrl` — готове посилання t.me/share, яке відкриває Telegram
 * з попередньо заповненим текстом замовлення. Натискання "Відправити"
 * відкриває чат магазину з повним списком товарів.
 */
export function useCart() {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  function syncCartImages(products) {
    setCart(prev => {
      const map = Object.fromEntries(products.map(p => [p.id || p.title, p.image || ""]));
      const updated = prev.map(item => ({ ...item, image: map[item.id] ?? item.image ?? "" }));
      const changed = updated.some((item, i) => item.image !== prev[i].image);
      return changed ? updated : prev;
    });
  }

  function addToCart(product) {
    const priceInfo = parsePriceInfo(product);
    if (!priceInfo) return;
    const id = product.id || product.title;
    setCart(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) {
        return prev.map(item => item.id === id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { id, title: product.title, image: product.image || "", qty: 1, amount: priceInfo.amount, currency: priceInfo.currency }];
    });
  }

  function increaseItem(id) {
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: item.qty + 1 } : item));
  }

  function decreaseItem(id) {
    setCart(prev =>
      prev.map(item => item.id === id ? { ...item, qty: item.qty - 1 } : item)
          .filter(item => item.qty > 0)
    );
  }

  function clearCart() {
    setCart([]);
  }

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);

  const cartTotals = useMemo(() => {
    const totals = {};
    cart.forEach(item => {
      totals[item.currency] = (totals[item.currency] || 0) + item.amount * item.qty;
    });
    return totals;
  }, [cart]);

  const telegramUrl = useMemo(() => {
    if (!cart.length) return TELEGRAM_URL;
    const lines = [
      "Нове замовлення з сайту EuroBlysk:",
      "",
      ...cart.map(item => `• ${item.title} x${item.qty} = ${formatMoney(item.amount * item.qty, item.currency)}`),
      "",
      "Разом:",
      ...Object.entries(cartTotals).map(([cur, total]) => `- ${formatMoney(total, cur)}`),
    ];
    const text = encodeURIComponent(lines.join("\n"));
    return `https://t.me/share/url?url=${encodeURIComponent(TELEGRAM_URL)}&text=${text}`;
  }, [cart, cartTotals]);

  return { cart, cartCount, cartTotals, telegramUrl, addToCart, increaseItem, decreaseItem, clearCart, syncCartImages };
}
