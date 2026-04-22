// Стискає всі зображення в public/images до max 600px і якість 80%
// Запуск: node compress-images.mjs

import sharp from "sharp";
import { readdirSync, statSync, writeFileSync } from "fs";
import { join } from "path";

const DIR = "./public/images";
const MAX_PX = 600;
const QUALITY = 80;

const files = readdirSync(DIR).filter(f => /\.(webp|jpg|jpeg|png)$/i.test(f));
console.log(`Знайдено ${files.length} зображень...`);

let saved = 0;
let count = 0;
let skipped = 0;

for (const file of files) {
  const src = join(DIR, file);
  const sizeBefore = statSync(src).size;

  try {
    const buf = await sharp(src)
      .resize(MAX_PX, MAX_PX, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer();

    if (buf.length < sizeBefore) {
      const dest = src.replace(/\.(jpg|jpeg|png)$/i, ".webp");
      writeFileSync(dest, buf);
      saved += sizeBefore - buf.length;
      count++;
    } else {
      skipped++;
    }
  } catch (e) {
    console.warn(`⚠ ${file}: ${e.message}`);
  }

  const done = count + skipped;
  if (done % 100 === 0) {
    process.stdout.write(`\r${done}/${files.length} | зекономлено ${(saved/1024/1024).toFixed(1)}MB`);
  }
}

console.log(`\n\nГотово!`);
console.log(`Стиснуто: ${count} файлів`);
console.log(`Пропущено (вже малі): ${skipped}`);
console.log(`Зекономлено: ${(saved / 1024 / 1024).toFixed(1)} MB`);
