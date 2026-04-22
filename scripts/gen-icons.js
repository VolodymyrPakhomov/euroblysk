import sharp from "sharp";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, "../public/logo2.svg");
const out = join(__dirname, "../public");

const sizes = [192, 512];
for (const size of sizes) {
  await sharp(src).resize(size, size).png().toFile(join(out, `icon-${size}.png`));
  console.log(`✓ icon-${size}.png`);
}
