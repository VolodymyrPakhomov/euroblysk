export function parsePriceInfo(product) {
  const raw = String(product.price || "").trim();
  const num = Number(raw.replace(",", "."));
  if (raw && Number.isFinite(num) && num > 0) {
    return { amount: num, currency: product.currency || "UAH" };
  }
  return null;
}

export function parsePriceOld(product) {
  const raw = String(product.price_old || "").trim();
  const num = Number(raw.replace(",", "."));
  if (raw && Number.isFinite(num) && num > 0) return num;
  return null;
}

export function formatMoney(amount, currency) {
  const sym = currency === "USD" ? "$" : "грн";
  const val = Number.isInteger(amount) || amount % 1 === 0 ? amount : amount.toFixed(2);
  return `${val} ${sym}`;
}

/** Конвертує суму в UAH якщо потрібно */
export function toUah(amount, currency, usdRate) {
  if (currency === "UAH" || !usdRate) return { amount, currency: "UAH" };
  return { amount: Math.round(amount * usdRate), currency: "UAH" };
}
