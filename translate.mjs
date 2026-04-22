import { readFileSync, writeFileSync } from "fs";

const PRODUCTS_PATH = "d:/euroblysk/public/products.json";

async function translate(text) {
  if (!text || !text.trim()) return text;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ru&tl=uk&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  const data = await res.json();
  return data[0].map(x => x[0]).join("");
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

const products = JSON.parse(readFileSync(PRODUCTS_PATH, "utf-8"));
console.log(`Товарів: ${products.length}`);

const updated = [];
for (let i = 0; i < products.length; i++) {
  const p = products[i];
  try {
    const title = await translate(p.title);
    const description = await translate(p.description);
    updated.push({ ...p, title, description });
    if ((i + 1) % 10 === 0) {
      console.log(`${i + 1}/${products.length} — ${title}`);
      writeFileSync(PRODUCTS_PATH, JSON.stringify(updated.concat(products.slice(i + 1)), null, 2), "utf-8");
    }
  } catch (e) {
    console.error(`Помилка на ${i} (${p.title}):`, e.message);
    updated.push(p);
  }
  await sleep(80);
}

writeFileSync(PRODUCTS_PATH, JSON.stringify(updated, null, 2), "utf-8");
console.log("Готово!");
