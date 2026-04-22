# EuroBlysk Catalog

React 19 + Vite каталог товарів для магазину побутової хімії. Товари зберігаються у статичному файлі `public/products.json`, замовлення надсилаються через Telegram, адмін редагує товари прямо в браузері.

---

## Швидкий старт

```bash
npm install

# Термінал 1 — Vite dev сервер
npm run dev          # http://localhost:5173

# Термінал 2 — Admin API (тільки для режиму адміна)
npm run server       # http://localhost:3001

# Production build
npm run build        # → dist/
```

---

## Режим адміна

1. Запустити `npm run server`
2. Відкрити `http://localhost:5173/?admin=euroadmin2024`
3. При наведенні на картку товару з'являються кнопки **✏️** (редагувати) і **🗑️** (видалити)
4. Зміни POST-уються на `/api/products` → `server.js` перезаписує `public/products.json`

**Змінити пароль:** встановити змінну середовища `ADMIN_SECRET` перед запуском сервера:
```bash
ADMIN_SECRET=мійпароль node server.js
```
Або змінити значення за замовчуванням напряму в `server.js`.

---

## Структура даних — products.json

Масив об'єктів. Кожен товар:

| Поле | Тип | Опис |
|------|-----|------|
| `id` | number | Унікальний ID (відповідає назві фото: `images/<id>.jpg`) |
| `title` | string | Назва товару |
| `description` | string | Опис |
| `image` | string | Шлях відносно `/public`, напр. `"images/332.jpg"` |
| `category` | string | Категорія 1-го рівня |
| `subcategory` | string | Категорія 2-го рівня |
| `group` | string | Категорія 3-го рівня |
| `subgroup` | string | Категорія 4-го рівня |
| `price` | number\|"" | Ціна (порожній рядок = ціна невідома) |
| `price_old` | number\|"" | Стара ціна (закреслена), необов'язкова |
| `currency` | "UAH"\|"USD" | Валюта |
| `date` | string | Дата публікації |

---

## Ієрархія категорій

4 рівні: **category → subcategory → group → subgroup**

Дерево будується автоматично з товарів під час виконання. Категорії, які мають з'являтись в меню до додавання товарів, описуються в `src/catalogData.js` → `EXTRA_TREE_GROUPS`.

Псевдоніми для нормалізації назв категорій — `LABEL_ALIASES` (той самий файл).
Емодзі для кожної категорії — `LABEL_EMOJI` (той самий файл).

---

## Де що знаходиться

```
src/
  config.js          ← ВСІ налаштування: телефон, Telegram, hero-фото, ключі
  catalogData.js     ← дерево категорій, псевдоніми, емодзі
  App.jsx            ← кореневий компонент: роутинг між каталогом і кошиком
  App.css            ← всі стилі (~1100 рядків, секції підписані)
  components/
    BubblesBg.jsx    ← анімований фон з бульбашками
    CartPage.jsx     ← сторінка кошика
    EditModal.jsx    ← модалка редагування товару (тільки адмін)
    Footer.jsx       ← підвал сайту
    HeroSlider.jsx   ← банерна карусель
    icons.jsx        ← SVG іконки (IconPhone, IconTelegram, IconBag)
    PriceDisplay.jsx ← компонент відображення ціни (ціна + закреслена стара)
    ProductCard.jsx  ← картка товару в гріді
    ProductModal.jsx ← модалка з деталями товару
    Sidebar.jsx      ← навігація по категоріях
  hooks/
    useAdmin.js      ← визначає режим адміна за URL-параметром
    useCatalog.js    ← завантаження товарів, фільтрація, дерево категорій
    useCart.js       ← кошик з localStorage, генерація Telegram-посилання
  utils/
    catalog.js       ← normalizeLabel, withEmoji
    price.js         ← parsePriceInfo, parsePriceOld, formatMoney
public/
  products.json      ← база даних товарів (612 записів)
  images/            ← фото товарів (назви = ID товару, напр. 332.jpg)
  images/Hero/       ← фото для hero-банеру
server.js            ← Node.js Admin API (POST /api/products → перезаписує products.json)
```

---

## Часті задачі

**Додати hero-банер:**
1. Покласти фото в `public/images/Hero/`
2. Додати шлях до масиву `HERO_IMAGES` в `src/config.js`

**Змінити контакти (телефон, Telegram):**
→ Тільки `src/config.js`

**Додати товар вручну:**
→ Відредагувати `public/products.json` або використати режим адміна в браузері

**Додати нову категорію до меню (без товарів):**
→ `src/catalogData.js` → `EXTRA_TREE_GROUPS`

---

## Змінні середовища

| Змінна | За замовчуванням | Опис |
|--------|-----------------|------|
| `ADMIN_SECRET` | `euroadmin2024` | Пароль адмін-режиму, перевіряється в `server.js` |
