import { useState, useEffect } from "react";

const SETTINGS_URL = "/settings.json";

export function useSettings() {
  const [usdRate, setUsdRate] = useState(41);

  useEffect(() => {
    fetch(SETTINGS_URL + "?_=" + Date.now())
      .then(r => r.json())
      .then(d => { if (d.usdRate) setUsdRate(Number(d.usdRate)); })
      .catch(() => {});
  }, []);

  /** Зберегти новий курс через API адміна */
  async function saveRate(rate, adminKey) {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminKey}` },
      body: JSON.stringify({ usdRate: Number(rate) }),
    });
    if (!res.ok) throw new Error("Помилка збереження");
    setUsdRate(Number(rate));
  }

  return { usdRate, saveRate };
}
