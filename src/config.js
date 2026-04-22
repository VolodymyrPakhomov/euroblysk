// ─────────────────────────────────────────────────────────────────
//  src/config.js — центральний файл конфігурації
//
//  Все що може знадобитись змінити при рефакторингу, ребрендингу
//  або деплої — знаходиться тут. Один файл, одне місце.
// ─────────────────────────────────────────────────────────────────

// Контакти (використовуються в Header, Footer, useCart)
export const PHONE_NUMBER    = "+380989419395";
export const PHONE_DISPLAY   = "+38 098 941 93 95";
export const TELEGRAM_HANDLE = "EuroBlysk_OD";
export const TELEGRAM_URL    = `https://t.me/${TELEGRAM_HANDLE}`;

// Hero-банери (шляхи відносно /public)
// Щоб додати фото: покласти файл в public/images/Hero/ і додати сюди рядок
export const HERO_IMAGES = [
  "images/Hero/Gemini_Generated_Image_b47m0lb47m0lb47m.png",
  "images/Hero/Gemini_Generated_Image_m7ic7um7ic7um7ic.png",
  "images/Hero/Gemini_Generated_Image_rypt85rypt85rypt.png",
  "images/Hero/Gemini_Generated_Image_wtaefpwtaefpwtae.png",
  "images/Hero/Gemini_Generated_Image_z9z773z9z773z9z7.png",
];

// localStorage ключ для кошика
// Змінити тільки якщо потрібно скинути всі кошики користувачів при деплої
export const CART_STORAGE_KEY = "euroblysk_cart";

// URL файлу з товарами (відносно кореня сайту)
export const PRODUCTS_URL = "/products.json";
