import { IconTelegram } from "./icons.jsx";
import { TELEGRAM_URL } from "../config.js";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/logo2.svg" alt="EuroBlysk" className="footer-logo" />
          <span className="footer-name">EuroBlysk</span>
        </div>
        <p className="footer-desc">Побутова хімія та засоби догляду преміальної якості</p>
        <a className="footer-tg" href={TELEGRAM_URL} target="_blank" rel="noreferrer">
          <IconTelegram size={18} />
          Написати в Telegram
        </a>
        <p className="footer-copy">© {new Date().getFullYear()} EuroBlysk. Усі права захищені.</p>
      </div>
    </footer>
  );
}
