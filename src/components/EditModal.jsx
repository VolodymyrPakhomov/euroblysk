import { useState, useEffect, useRef } from "react";
import { EXTRA_TREE_GROUPS } from "../catalogData.js";

const CURRENCIES = ["UAH", "USD"];
const CATEGORIES = Object.keys(EXTRA_TREE_GROUPS);

export function EditModal({ product, onSave, onClose, saving, adminKey }) {
  useEffect(() => {
    const handler = e => { if (e.key === "Escape" && !saving) onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, saving]);

  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = "." + file.name.split(".").pop().toLowerCase();
      const res = await fetch(`/api/upload?id=${product.id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${adminKey}`,
          "Content-Type": file.type,
          "x-file-ext": ext,
        },
        body: file,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set("image", data.path);
    } catch (err) {
      alert("Помилка завантаження: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  const [form, setForm] = useState({
    title: product.title || "",
    description: product.description || "",
    image: product.image || "",
    price: product.price ?? "",
    price_old: product.price_old ?? "",
    currency: product.currency || "UAH",
    category: product.category || "",
    subcategory: product.subcategory || "",
    group: product.group || "",
    subgroup: product.subgroup || "",
    is_new: !!product.is_new,
    is_sale: !!product.is_sale,
    is_out_of_stock: !!product.is_out_of_stock,
  });

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const updated = {
      ...product,
      title: form.title.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      price: form.price !== "" ? Number(form.price) : "",
      price_old: form.price_old !== "" ? Number(form.price_old) : "",
      currency: form.currency,
      category: form.category.trim(),
      subcategory: form.subcategory.trim(),
      group: form.group.trim(),
      subgroup: form.subgroup.trim(),
      is_new: form.is_new,
      is_sale: form.is_sale,
      is_out_of_stock: form.is_out_of_stock,
    };
    onSave(updated);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box edit-modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{product.__isNew ? "Новий товар" : `Редагувати товар #${product.id}`}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Закрити">×</button>
        </div>

        <form className="edit-form" onSubmit={handleSubmit}>
          <label className="edit-label">
            Назва
            <input
              className="edit-input"
              value={form.title}
              onChange={e => set("title", e.target.value)}
              required
            />
          </label>

          <label className="edit-label">
            Опис
            <textarea
              className="edit-textarea"
              value={form.description}
              onChange={e => set("description", e.target.value)}
              rows={3}
            />
          </label>

          <label className="edit-label">
            Зображення
            <div className="edit-image-wrap">
              <input
                className="edit-input"
                value={form.image}
                onChange={e => set("image", e.target.value)}
                placeholder="images/1.webp"
              />
              <button
                type="button"
                className="edit-upload-btn"
                onClick={() => fileInputRef.current.click()}
                disabled={uploading || saving}
              >
                {uploading ? "Завантаження…" : "📁 Завантажити фото"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
              {form.image && (
                <img src={form.image} alt="preview" className="edit-image-preview" />
              )}
            </div>
          </label>

          <div className="edit-row">
            <label className="edit-label">
              Ціна
              <input
                className="edit-input"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={e => set("price", e.target.value)}
              />
            </label>
            <label className="edit-label">
              Стара ціна
              <input
                className="edit-input"
                type="number"
                min="0"
                step="0.01"
                value={form.price_old}
                onChange={e => set("price_old", e.target.value)}
              />
            </label>
            <label className="edit-label">
              Валюта
              <select
                className="edit-input"
                value={form.currency}
                onChange={e => set("currency", e.target.value)}
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>

          <div className="edit-row">
            <label className="edit-label">
              Категорія
              <select className="edit-input" value={form.category} onChange={e => {
                set("category", e.target.value);
                set("subcategory", ""); set("group", ""); set("subgroup", "");
              }}>
                <option value="">— оберіть —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="edit-label">
              Підкатегорія
              {(() => {
                const subs = form.category ? Object.keys(EXTRA_TREE_GROUPS[form.category] || {}) : [];
                return subs.length ? (
                  <select className="edit-input" value={form.subcategory} onChange={e => {
                    set("subcategory", e.target.value);
                    set("group", ""); set("subgroup", "");
                  }}>
                    <option value="">— оберіть —</option>
                    {subs.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input className="edit-input" value={form.subcategory} onChange={e => set("subcategory", e.target.value)} />
                );
              })()}
            </label>
          </div>

          <div className="edit-row">
            <label className="edit-label">
              Група
              {(() => {
                const grps = form.category && form.subcategory
                  ? Object.keys((EXTRA_TREE_GROUPS[form.category] || {})[form.subcategory] || {})
                  : [];
                return grps.length ? (
                  <select className="edit-input" value={form.group} onChange={e => {
                    set("group", e.target.value); set("subgroup", "");
                  }}>
                    <option value="">— оберіть —</option>
                    {grps.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                ) : (
                  <input className="edit-input" value={form.group} onChange={e => set("group", e.target.value)} />
                );
              })()}
            </label>
            <label className="edit-label">
              Підгрупа
              {(() => {
                const subgrps = form.category && form.subcategory && form.group
                  ? [...(((EXTRA_TREE_GROUPS[form.category] || {})[form.subcategory] || {})[form.group] || [])]
                  : [];
                return subgrps.length ? (
                  <select className="edit-input" value={form.subgroup} onChange={e => set("subgroup", e.target.value)}>
                    <option value="">— оберіть —</option>
                    {subgrps.map(sg => <option key={sg} value={sg}>{sg}</option>)}
                  </select>
                ) : (
                  <input className="edit-input" value={form.subgroup} onChange={e => set("subgroup", e.target.value)} />
                );
              })()}
            </label>
          </div>

          <div className="edit-badges-row">
            <label className="edit-badge-label">
              <input
                type="checkbox"
                checked={form.is_new}
                onChange={e => set("is_new", e.target.checked)}
              />
              <span className="badge badge--new">Новинка</span>
            </label>
            <label className="edit-badge-label">
              <input
                type="checkbox"
                checked={form.is_sale}
                onChange={e => set("is_sale", e.target.checked)}
              />
              <span className="badge badge--sale">Акція</span>
            </label>
            <label className="edit-badge-label">
              <input
                type="checkbox"
                checked={form.is_out_of_stock}
                onChange={e => set("is_out_of_stock", e.target.checked)}
              />
              <span className="badge" style={{background: "#888", color: "#fff"}}>Немає в наявності</span>
            </label>
          </div>

          <div className="edit-actions">
            <button type="button" className="edit-cancel-btn" onClick={onClose} disabled={saving}>
              Скасувати
            </button>
            <button type="submit" className="edit-save-btn" disabled={saving}>
              {saving ? "Зберігаємо…" : "Зберегти"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
