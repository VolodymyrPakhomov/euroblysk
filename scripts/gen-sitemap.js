/**
 * gen-sitemap.js
 * Генерує sitemap.xml з датою оновлення.
 * Запуск: node scripts/gen-sitemap.js
 * Додай у package.json scripts: "sitemap": "node scripts/gen-sitemap.js"
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PRODUCTS_PATH = join(__dirname, "../public/products.json");
const SITEMAP_PATH  = join(__dirname, "../public/sitemap.xml");

const BASE_URL = "https://euroblysk.com.ua";
const today = new Date().toISOString().split("T")[0];

const products = JSON.parse(readFileSync(PRODUCTS_PATH, "utf-8"));
const categories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();

const urls = [
  { loc: `${BASE_URL}/`,    priority: "1.0", changefreq: "daily"   },
  ...categories.map(cat => ({
    loc: `${BASE_URL}/?cat=${encodeURIComponent(cat)}`,
    priority: "0.8",
    changefreq: "weekly",
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

writeFileSync(SITEMAP_PATH, xml, "utf-8");
console.log(`✓ sitemap.xml: ${urls.length} URLs (${categories.length} категорій + головна)`);
