import { useState, useEffect } from "react";

/**
 * Визначає режим адміна.
 *
 * Як увійти в режим адміна:
 *   1. Запустити: npm run server  (API сервер на порту 3001)
 *   2. Відкрити:  http://localhost:5173/?admin=<ключ>
 *      — або натиснути "Режим адміна" і ввести ключ у спливаючому вікні.
 *
 * Ключ зберігається в sessionStorage (не в URL), тому він не потрапляє
 * до історії браузера і зникає після закриття вкладки.
 */
const SESSION_KEY = "euroblysk_admin";

export function useAdmin() {
  const [adminKey, setAdminKey] = useState(() => {
    // Якщо ключ є в URL — зберегти в sessionStorage і прибрати з URL
    const params = new URLSearchParams(window.location.search);
    const urlKey = params.get("admin");
    if (urlKey) {
      sessionStorage.setItem(SESSION_KEY, urlKey);
      params.delete("admin");
      const newUrl = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
      window.history.replaceState(null, "", newUrl);
      return urlKey;
    }
    return sessionStorage.getItem(SESSION_KEY) || "";
  });

  const [showPrompt, setShowPrompt] = useState(false);
  const [promptValue, setPromptValue] = useState("");

  // Таємне подвійне натискання на лого вмикає форму входу
  useEffect(() => {
    if (!showPrompt) setPromptValue("");
  }, [showPrompt]);

  function login(key) {
    sessionStorage.setItem(SESSION_KEY, key);
    setAdminKey(key);
    setShowPrompt(false);
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setAdminKey("");
  }

  return {
    isAdmin: !!adminKey,
    adminKey,
    showPrompt,
    promptValue,
    setPromptValue,
    setShowPrompt,
    login,
    logout,
  };
}
