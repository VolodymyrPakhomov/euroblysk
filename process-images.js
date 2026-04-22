import { readFile, writeFile, rm, rename } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PRODUCTS_PATH = join(__dirname, "public", "products.json");
const IMAGES_PATH = join(__dirname, "public", "images");

async function run() {
  console.log("⏳ Починаємо обробку фотографій...");

  // 1. Читаємо поточну базу товарів
  const productsData = await readFile(PRODUCTS_PATH, "utf-8");
  const products = JSON.parse(productsData);

  let processedCount = 0;
  let errorCount = 0;

  for (const product of products) {
    try {
      if (!product.image) continue;
      
      const originalImagePath = join(__dirname, "public", product.image);
      const newImageName = `${product.id}.webp`;
      const newImagePath = join(IMAGES_PATH, newImageName);
      const tempImagePath = join(IMAGES_PATH, `${product.id}_temp.webp`);

      // Перевіряємо чи існує файл (іноді шлях у JSON може бути хибним)
      if (!existsSync(originalImagePath)) {
        console.warn(`⚠️ Файл не знайдено: ${originalImagePath}`);
        errorCount++;
        continue;
      }

      // 2. Читаємо оригінальний файл
      const buffer = await readFile(originalImagePath);

      // 3. Обробляємо через Sharp і зберігаємо у тимчасовий файл
      await sharp(buffer)
        .flatten({ background: '#ffffff' }) // Білий фон замість прозорого
        .resize(800, 800, { 
          fit: 'contain', 
          background: '#ffffff' 
        }) // Квадратна картка 800x800
        .sharpen() // Різкість
        .webp({ quality: 80 }) // Стиснення
        .toFile(tempImagePath);

      // 4. Якщо оригінальне фото мало інше розширення (.jpg, .png), видаляємо його
      if (originalImagePath !== newImagePath) {
        await rm(originalImagePath);
      }

      // 5. Перейменовуємо тимчасовий файл у фінальний (перезапише старий .webp, якщо він там був)
      await rename(tempImagePath, newImagePath);

      // 6. Оновлюємо шлях у JSON
      product.image = `images/${newImageName}`;
      processedCount++;

      if (processedCount % 50 === 0) {
        console.log(`✅ Оброблено: ${processedCount} / ${products.length}`);
      }

    } catch (err) {
      console.error(`❌ Помилка з товаром ID ${product.id}:`, err.message);
      errorCount++;
    }
  }

  // 7. Зберігаємо оновлений products.json з новими розширеннями
  await writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 2), "utf-8");

  console.log(`\n🎉 Готово! Успішно оброблено: ${processedCount}. Помилок: ${errorCount}.`);
  console.log(`Файл products.json оновлено: тепер всі фото мають формат .webp.`);
}

run();