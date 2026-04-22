// Відновлює тільки потрібні фото з бекапу
// Не чіпає фото які вже виправлені вручну
// Запуск: node restore-images.mjs

import { readFileSync, writeFileSync, copyFileSync, existsSync } from "fs";
import { join } from "path";

const BACKUP_DIR   = "C:/Users/dell1/Downloads/Telegram Desktop/Chat_2026-04-10";
const CURRENT_DIR  = "./public";

const backupProducts  = JSON.parse(readFileSync(join(BACKUP_DIR, "products.json"), "utf8"));
const currentProducts = JSON.parse(readFileSync(join(CURRENT_DIR, "products.json"), "utf8"));

// Індекс бекапу: id → image
const backupMap = Object.fromEntries(backupProducts.map(p => [p.id, p.image]));

let restored = 0;
let skipped  = 0;

const updated = currentProducts.map(p => {
  const backupImage = backupMap[p.id];
  if (!backupImage) return p; // товар відсутній в бекапі

  // Пропускаємо якщо поточне фото вже webp і не збігається з тим що ми ламали
  // Ознака "треба відновити": поточний шлях — .jpg (ми його міняли після компресії)
  const needsRestore = p.image && p.image.endsWith(".jpg") && backupImage.endsWith(".webp");
  if (!needsRestore) {
    skipped++;
    return p;
  }

  // Копіюємо файл з бекапу
  const srcFile  = join(BACKUP_DIR, backupImage);
  const destFile = join(CURRENT_DIR, backupImage);

  if (!existsSync(srcFile)) {
    console.warn(`⚠ Файл не знайдено в бекапі: ${srcFile}`);
    skipped++;
    return p;
  }

  copyFileSync(srcFile, destFile);
  restored++;
  return { ...p, image: backupImage };
});

writeFileSync(join(CURRENT_DIR, "products.json"), JSON.stringify(updated, null, 2), "utf8");

console.log(`✓ Відновлено: ${restored} фото`);
console.log(`— Пропущено (вже виправлені або не потребують): ${skipped}`);
