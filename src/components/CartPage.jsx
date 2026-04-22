import { useState } from "react";
import PropTypes from "prop-types";
import { formatMoney, toUah } from "../utils/price.js";

const FREE_SPOTS = ["Преображенське (Ленселище)", "7небо", "Авангард", "Застава"];
const FREE_MIN_UAH = 1500;

export function CartPage({ cart, cartTotals, onIncrease, onDecrease, onClear, onBack, usdRate }) {
  const [step, setStep] = useState("cart"); // cart | form | sent
  const [delivery, setDelivery] = useState("free");
  const [spot, setSpot] = useState(FREE_SPOTS[0]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [np, setNp] = useState("");
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const uahTotal = (cartTotals["UAH"] || 0) + ((cartTotals["USD"] || 0) * (usdRate || 44.5));
  const freeAvailable = uahTotal >= FREE_MIN_UAH;

  function validate() {
    const e = {};
    if (name.trim().length < 2) e.name = "Введіть ім'я";
    if (!/\d{7,}/.test(phone.replace(/\D/g, ""))) e.phone = "Невірний номер";
    if (delivery === "np") {
      if (!city.trim()) e.city = "Введіть місто";
      if (!np.trim()) e.np = "Введіть номер відділення";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function buildText() {
    const lines = [
      "<b>🛒 Нове замовлення EuroBlysk</b>",
      "",
      ...cart.map(item => { const c = toUah(item.amount * item.qty, item.currency, usdRate); return `• ${item.title} x${item.qty} — ${formatMoney(Math.round(c.amount), c.currency)}`; }),
      "",
      `<b>💰 Разом: ${formatMoney(Math.round(uahTotal), "UAH")}</b>`,
      "",
      delivery === "free"
        ? `<b>🚗 Доставка:</b> ${spot}`
        : `<b>📦 Нова Пошта:</b> м. ${city}, відд. №${np}`,
      "",
      `<b>👤 Ім'я:</b> ${name}`,
      `<b>📞 Телефон:</b> ${phone}`,
    ];
    return lines.join("\n");
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSending(true);
    setSendError("");
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: buildText() }),
      });
      if (!res.ok) throw new Error("Помилка сервера");
      onClear();
      setStep("sent");
    } catch (e) {
      setSendError("Не вдалось відправити. Перевірте з'єднання.");
    }
    setSending(false);
  }

  return (
    <section className="cart-page">
      <button className="cart-back-btn" onClick={step === "form" ? () => setStep("cart") : onBack}>
        ← {step === "form" ? "Назад до кошика" : "Назад до каталогу"}
      </button>

      <section className="cart-box">
        <div className="cart-head">
          <h3>{step === "form" ? "Оформлення замовлення" : "Кошик"}</h3>
          {step === "cart" && cart.length > 0 && (
            <button className="clear-cart-btn" onClick={onClear}>Очистити</button>
          )}
        </div>

        {cart.length === 0 ? (
          <p className="cart-empty">Кошик порожній. Додайте товари у каталозі.</p>
        ) : step === "sent" ? (
          <div className="cart-sent-box">
            <p className="cart-sent-msg">✓ Замовлення відправлено! Очікуйте відповіді в Telegram.</p>
            <button className="cart-sent-clear" onClick={() => { setStep("cart"); onBack(); }}>
              До каталогу
            </button>
          </div>
        ) : step === "cart" ? (
          <>
            <div className="cart-list">
              {cart.map(item => (
                <div key={item.id} className="cart-row">
                  {item.image && <img src={item.image} alt={item.title} className="cart-row-img" loading="lazy" />}
                  <div className="cart-row-main">
                    <div className="cart-row-title">{item.title}</div>
                    <div className="cart-row-price">
                      {(() => { const c = toUah(item.amount, item.currency, usdRate); return formatMoney(c.amount, c.currency); })()} × {item.qty}
                    </div>
                  </div>
                  <div className="cart-row-actions">
                    <button onClick={() => onDecrease(item.id)} aria-label="Зменшити">−</button>
                    <button onClick={() => onIncrease(item.id)} aria-label="Збільшити">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="free-delivery-bar">
              {uahTotal >= FREE_MIN_UAH ? (
                <div className="free-delivery-bar__reached">
                  <span>🎉</span>
                  <span>Безкоштовна доставка доступна!</span>
                </div>
              ) : (
                <>
                  <div className="free-delivery-bar__text">
                    <span>До безкоштовної доставки</span>
                    <span className="free-delivery-bar__left">ще {Math.round(FREE_MIN_UAH - uahTotal)} грн</span>
                  </div>
                  <div className="free-delivery-bar__track">
                    <div
                      className="free-delivery-bar__fill"
                      style={{ width: `${Math.min((uahTotal / FREE_MIN_UAH) * 100, 100)}%` }}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="cart-total">
              <div>{formatMoney(Math.round(uahTotal), "UAH")}</div>
            </div>
            <button className="cart-checkout-btn" onClick={() => setStep("form")}>
              Оформити замовлення →
            </button>
          </>
        ) : (
          /* Форма замовлення */
          <div className="order-form">

            {/* Вибір доставки */}
            <div className="order-section-title">Спосіб доставки</div>
            <div className="delivery-options">
              <label className={`delivery-opt ${delivery === "free" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="delivery"
                  value="free"
                  checked={delivery === "free"}
                  onChange={() => setDelivery("free")}
                />
                <div className="delivery-opt-content">
                  <span className="delivery-opt-title">Безкоштовна доставка</span>
                  <span className="delivery-opt-sub">
                    {freeAvailable ? "Оберіть пункт видачі" : `від ${FREE_MIN_UAH} грн (у вас ${Math.round(uahTotal)} грн)`}
                  </span>
                </div>
              </label>

              <label className={`delivery-opt ${delivery === "np" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="delivery"
                  value="np"
                  checked={delivery === "np"}
                  onChange={() => setDelivery("np")}
                />
                <div className="delivery-opt-content">
                  <span className="delivery-opt-title">Нова Пошта</span>
                  <span className="delivery-opt-sub">Доставка по Україні</span>
                </div>
              </label>
            </div>

            {/* Пункт безкоштовної доставки */}
            {delivery === "free" && (
              <div className="order-field">
                <label className="order-label">Пункт видачі</label>
                <select className="order-input" value={spot} onChange={e => setSpot(e.target.value)}>
                  {FREE_SPOTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            {/* НП поля */}
            {delivery === "np" && (
              <>
                <div className="order-field">
                  <label className="order-label">Місто</label>
                  <input className={`order-input ${errors.city ? "error" : ""}`} type="text" placeholder="Наприклад: Київ" value={city} onChange={e => setCity(e.target.value)} />
                  {errors.city && <span className="order-error">{errors.city}</span>}
                </div>
                <div className="order-field">
                  <label className="order-label">Номер відділення НП</label>
                  <input className={`order-input ${errors.np ? "error" : ""}`} type="text" placeholder="Наприклад: 12" value={np} onChange={e => setNp(e.target.value)} />
                  {errors.np && <span className="order-error">{errors.np}</span>}
                </div>
              </>
            )}

            <div className="order-section-title" style={{ marginTop: 16 }}>Контактні дані</div>
            <div className="order-field">
              <label className="order-label">Ім'я</label>
              <input className={`order-input ${errors.name ? "error" : ""}`} type="text" placeholder="Ваше ім'я" value={name} onChange={e => setName(e.target.value)} />
              {errors.name && <span className="order-error">{errors.name}</span>}
            </div>
            <div className="order-field">
              <label className="order-label">Телефон</label>
              <input className={`order-input ${errors.phone ? "error" : ""}`} type="tel" placeholder="+380..." value={phone} onChange={e => setPhone(e.target.value)} />
              {errors.phone && <span className="order-error">{errors.phone}</span>}
            </div>

            <div className="cart-total" style={{ marginTop: 16 }}>
              <div>{formatMoney(Math.round(uahTotal), "UAH")}</div>
            </div>

            {sendError && <p className="order-error" style={{textAlign:"center",marginTop:8}}>{sendError}</p>}
            <button className="cart-checkout-btn" onClick={handleSubmit} disabled={sending}>
              {sending ? "Відправляємо…" : "Відправити замовлення →"}
            </button>
          </div>
        )}
      </section>
    </section>
  );
}

CartPage.propTypes = {
  cart:        PropTypes.array.isRequired,
  cartTotals:  PropTypes.object.isRequired,
  onIncrease:  PropTypes.func.isRequired,
  onDecrease:  PropTypes.func.isRequired,
  onClear:     PropTypes.func.isRequired,
  onBack:      PropTypes.func.isRequired,
  usdRate:     PropTypes.number,
};
