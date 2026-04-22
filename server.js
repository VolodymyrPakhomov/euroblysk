import { createServer } from "http";
import { writeFile, readFile } from "fs/promises";
import { join, dirname, extname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

config();
const __dirname = dirname(fileURLToPath(import.meta.url));

const ADMIN_SECRET = process.env.ADMIN_SECRET;

if (!ADMIN_SECRET) {
  console.error("ERROR: ADMIN_SECRET is not set. Create a .env file (see .env.example).");
  process.exit(1);
}

const PRODUCTS_PATH  = join(__dirname, "public", "products.json");
const SETTINGS_PATH  = join(__dirname, "public", "settings.json");
const IMAGES_PATH    = join(__dirname, "public", "images");
const PORT = 3001;

const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;
const TG_CHAT_ID   = process.env.TG_CHAT_ID;

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function checkAuth(req, res) {
  const auth = (req.headers["authorization"] || "").replace("Bearer ", "");
  if (auth !== ADMIN_SECRET) {
    sendJson(res, 403, { error: "Forbidden" });
    return false;
  }
  return true;
}

const getBodyBuffer = (req) => new Promise((resolve, reject) => {
  const chunks = [];
  req.on("data", chunk => chunks.push(chunk));
  req.on("end", () => resolve(Buffer.concat(chunks)));
  req.on("error", reject);
});

const getJsonBody = async (req) => {
  const buf = await getBodyBuffer(req);
  return JSON.parse(buf.toString("utf-8"));
};

createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/api/ping") {
    if (!checkAuth(req, res)) return;
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && req.url === "/api/products") {
    if (!checkAuth(req, res)) return;
    try {
      const products = await getJsonBody(req);
      if (!Array.isArray(products)) throw new Error("Not an array");
      await writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 2), "utf-8");
      console.log(`[admin] Saved ${products.length} products`);
      sendJson(res, 200, { ok: true, count: products.length });
    } catch (e) {
      sendJson(res, 400, { error: e.message });
    }
    return;
  }

  // POST /api/order — відправляє замовлення в Telegram бот
  if (req.method === "POST" && req.url === "/api/order") {
    try {
      const order = await getJsonBody(req);
      const text = order.text;
      if (!text) throw new Error("No text");

      const tgRes = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: "HTML" }),
      });
      const tgData = await tgRes.json();
      if (!tgData.ok) throw new Error(tgData.description);

      console.log(`[order] Sent to Telegram`);
      sendJson(res, 200, { ok: true });
    } catch (e) {
      console.error("[order] Error:", e.message);
      sendJson(res, 500, { error: e.message });
    }
    return;
  }

  // GET /api/settings
  if (req.method === "GET" && req.url === "/api/settings") {
    if (!checkAuth(req, res)) return;
    try {
      const data = await readFile(SETTINGS_PATH, "utf-8");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(data);
    } catch (e) {
      sendJson(res, 200, { usdRate: 41 });
    }
    return;
  }

  // POST /api/settings
  if (req.method === "POST" && req.url === "/api/settings") {
    if (!checkAuth(req, res)) return;
    try {
      const settings = await getJsonBody(req);
      await writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf-8");
      console.log(`[admin] Settings saved:`, settings);
      sendJson(res, 200, { ok: true });
    } catch (e) {
      sendJson(res, 400, { error: e.message });
    }
    return;
  }

  // POST /api/upload?id=42  — сохраняет файл как images/{id}.webp
  if (req.method === "POST" && req.url?.startsWith("/api/upload")) {
    if (!checkAuth(req, res)) return;
    const params = new URL(req.url, "http://localhost").searchParams;
    const id = params.get("id");
    if (!id || isNaN(Number(id))) {
      sendJson(res, 400, { error: "Missing id" });
      return;
    }
    try {
      let imageBuffer = await getBodyBuffer(req);
      const filename = `${id}.webp`;

      await writeFile(join(IMAGES_PATH, filename), imageBuffer);
      
      console.log(`[admin] Uploaded image: ${filename}`);
      sendJson(res, 200, { ok: true, path: `images/${filename}` });
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return;
  }

  res.writeHead(404);
  res.end();
})
.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ Ошибка: Порт ${PORT} уже занят. Пожалуйста, закройте предыдущий сервер или используйте npx kill-port ${PORT}.\n`);
    process.exit(1);
  } else {
    console.error("Ошибка сервера:", err);
  }
})
.listen(PORT, () => {
  console.log(`Admin API: http://localhost:${PORT}`);
  console.log(`Secret:    ${ADMIN_SECRET}`);
});
