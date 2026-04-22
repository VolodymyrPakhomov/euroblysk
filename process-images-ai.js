import { readFile, writeFile, rm, rename } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";
import { removeBackground } from "@imgly/background-removal-node";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PRODUCTS_PATH = join(__dirname, "public", "products.json");
const IMAGES_PATH = join(__dirname, "public", "images");

// Запускаем sharp в изолированном процессе, чтобы избежать конфликта C-библиотек (GLib/GObject)
function runSharpWorker(inputPath, outputPath, action) {
  const script = `
    const sharp = require('sharp');
    const action = process.argv[1];
    const input = process.argv[2];
    const output = process.argv[3];

    if (action === 'toPng') {
      sharp(input).png().toFile(output).then(() => process.exit(0));
    } else if (action === 'composite') {
      // Чистый композитинг напрямую через sharp (скрывает погрешности нейросети)
      sharp(input)
        .trim() // Обрезаем невидимые поля для идеальной центровки
        .resize(600, 600, { fit: 'inside' })
        .toBuffer()
        .then(resizedItem => {
          // Накладываем на белый квадрат
          sharp({ create: { width: 800, height: 800, channels: 4, background: '#ffffff' } })
            .composite([{ input: resizedItem, gravity: 'center' }])
            .modulate({ brightness: 1.02, saturation: 1.1 })
            .sharpen({ sigma: 1, m1: 1, m2: 10 })
            .webp({ quality: 85 })
            .toFile(output)
            .then(() => process.exit(0));
        });
    }
  `;
  execFileSync(process.execPath, ['-e', script, action, inputPath, outputPath], { stdio: 'inherit' });
}

async function run() {
  console.log("🤖 Запускаем AI-обработку фотографий...");
  console.log("ВНИМАНИЕ: Обработка ИИ требует ресурсов. Первое фото может обрабатываться долго (скачивается AI-модель).\n");

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

      if (!existsSync(originalImagePath)) {
        console.warn(`⚠️ Файл не найден: ${originalImagePath}`);
        errorCount++;
        continue;
      }

      process.stdout.write(`Обработка товара [${product.id}]... `);

      const tempPngPath = join(IMAGES_PATH, `${product.id}_temp.png`);

      // 1. Sharp (в дочернем процессе): конвертируем WebP -> PNG
      runSharpWorker(originalImagePath, tempPngPath, 'toPng');

      // 2. ИИ: Вырезаем товар (удаляем фон).
      const pngBuffer = await readFile(tempPngPath);
      const aiBlob = await removeBackground(new Blob([pngBuffer], { type: 'image/png' }));
      const aiBuffer = Buffer.from(await aiBlob.arrayBuffer());

      // Сохраняем вырезанный результат обратно во временный PNG
      await writeFile(tempPngPath, aiBuffer);

      // 3. Sharp (в дочернем процессе): помещаем вырезанный товар на идеальный белый квадрат 800x800
      runSharpWorker(tempPngPath, tempImagePath, 'composite');

      // 4. Очистка временного файла PNG
      if (existsSync(tempPngPath)) await rm(tempPngPath);

      // Если оригинальное фото было не .webp, удаляем его
      if (originalImagePath !== newImagePath && existsSync(originalImagePath)) {
        await rm(originalImagePath);
      }

      // Сохраняем результат
      await rename(tempImagePath, newImagePath);
      product.image = `images/${newImageName}`;
      
      console.log("✅ Готово!");
      processedCount++;

    } catch (err) {
      console.log(`❌ Ошибка: ${err.message}`);
      errorCount++;
    }
  }

  // Сохраняем обновленный products.json
  await writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 2), "utf-8");
  console.log(`\n🎉 Завершено! Успешно: ${processedCount}. Ошибок: ${errorCount}.`);
}

run();