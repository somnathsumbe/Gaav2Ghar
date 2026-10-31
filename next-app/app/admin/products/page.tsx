"use client";

import { useCallback, useEffect, useState } from "react";
import LanguageSwitcher, { useAppLanguage } from "../../components/LanguageSwitcher";

type Product = { id: string; name: string; english: string; varieties: string[]; pricePerKg: number; note?: string; emoji?: string; active?: boolean };
const blank: Product = { id: "", name: "", english: "", varieties: [], pricePerKg: 0, note: "", emoji: "🌾", active: true };

export default function AdminProductsPage() {
  const { t } = useAppLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<Product>(blank);
  const [varietyText, setVarietyText] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "उत्पादने लोड झाली नाहीत.");
      setProducts(data.products || []);
      setMessage("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "उत्पादने लोड झाली नाहीत."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void fetch("/api/admin/orders", { cache: "no-store" }).then((r) => { if (r.ok) setAuthenticated(true); }).catch(() => undefined);
    void load();
  }, [load]);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login झाले नाही.");
      setAuthenticated(true); setPassword(""); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Login झाले नाही."); }
    finally { setLoading(false); }
  }

  function edit(product: Product) { setForm({ ...product }); setVarietyText(product.varieties.join(", ")); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function newProduct() { setForm({ ...blank }); setVarietyText(""); }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    const isNewProduct = !products.some((product) => product.id === form.id);
    const payload = { ...form, varieties: varietyText.split(",").map((v) => v.trim()).filter(Boolean) };
    try {
      const response = await fetch("/api/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (response.status === 401) { setAuthenticated(false); throw new Error("Session संपली. पुन्हा login करा."); }
      if (!response.ok) throw new Error(data.error || "उत्पादन सेव्ह झाले नाही.");
      setMessage(isNewProduct ? "नवीन उत्पादन यशस्वीरित्या जोडले गेले." : "उत्पादनातील बदल सेव्ह झाले.");
      window.alert(isNewProduct ? "नवीन उत्पादन यशस्वीरित्या जोडले गेले!" : "उत्पादनातील बदल यशस्वीरित्या सेव्ह झाले!");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "उत्पादन सेव्ह झाले नाही."); }
    finally { setLoading(false); }
  }

  async function removeProduct(product: Product) {
    const confirmed = window.confirm(`"${product.name}" (${product.english}) हे उत्पादन कायमचे delete करायचे आहे का? हा बदल MongoDB मध्येही लागू होईल.`);
    if (!confirmed) return;
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id }),
      });
      const data = await response.json();
      if (response.status === 401) { setAuthenticated(false); throw new Error("Session संपली. पुन्हा login करा."); }
      if (!response.ok) throw new Error(data.error || "उत्पादन delete झाले नाही.");
      setProducts((current) => current.filter((item) => item.id !== product.id));
      if (form.id === product.id) newProduct();
      setMessage("उत्पादन MongoDB मधून delete झाले.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "उत्पादन delete झाले नाही.");
    } finally { setLoading(false); }
  }

  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); setAuthenticated(false); }

  return <main className="container-fluid admin-products-shell">
    <div className="admin-products-wrap">
      <div className="admin-products-nav d-flex justify-content-between align-items-center flex-wrap gap-3">
        <a href="/admin" className="admin-back-link">← Admin Orders</a>
        <LanguageSwitcher />
      </div>
      <header className="admin-products-header">
        <div><span className="admin-eyebrow">Gaav2Ghar Inventory</span><h1>{t("उत्पादन व किंमत व्यवस्थापन")}</h1><p className="text-secondary mb-0">{t("धान्याचे वाण, किलोचा दर आणि उपलब्धता बदला.")}</p></div>
        {authenticated && <button className="btn btn-outline-success" onClick={() => void logout()}><span aria-hidden="true">↪</span> Logout</button>}
      </header>
      {message && <p className="admin-product-message" role="status">{message}</p>}
      {!authenticated ? <section className="card admin-login-card border-0">
        <h2>Admin Login</h2><form onSubmit={login}><label htmlFor="password">Admin Password</label><input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%", padding: 12, margin: "8px 0 14px" }} /><button disabled={loading}>Login करा</button></form>
      </section> : <>
        <section className="card admin-editor-card border-0 mb-4">
          <div className="admin-card-heading"><div><span className="admin-eyebrow">Product editor</span><h2>{form.id ? t("उत्पादन बदला") : t("नवीन उत्पादन")}</h2></div><button type="button" className="btn btn-success" onClick={newProduct}>＋ {t("नवीन उत्पादन")}</button></div>
          <form className="admin-product-form" onSubmit={save}>
            <label>Product ID (English, unique)<input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} required maxLength={40} disabled={products.some((p) => p.id === form.id)} style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }} /></label>
            <label>{t("नाव (मराठी)")}<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={80} style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }} /></label>
            <label>English name<input value={form.english} onChange={(e) => setForm({ ...form, english: e.target.value })} required maxLength={80} style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }} /></label>
            <label>{t("दर (₹ प्रति किलो)")}<input type="number" min="0" max="100000" step="0.01" value={form.pricePerKg} onChange={(e) => setForm({ ...form, pricePerKg: Number(e.target.value) })} required style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }} /><small>0 ठेवल्यास ग्राहकाला किंमत निश्चित नसल्याचे दिसेल आणि खरेदी करता येणार नाही.</small></label>
            <label>{t("वाण (comma ने वेगळे करा)")}<input value={varietyText} onChange={(e) => setVarietyText(e.target.value)} required placeholder="उदा. लोकवन, शरबती" style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }} /></label>
            <label>Emoji<input value={form.emoji || ""} onChange={(e) => setForm({ ...form, emoji: e.target.value })} maxLength={12} style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }} /></label>
            <label>{t("वर्णन")}<input value={form.note || ""} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={200} style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }} /></label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={form.active !== false} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> {t("ग्राहकांना उपलब्ध")}</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}><button disabled={loading}>{t("सेव्ह करा")}</button><button type="button" onClick={newProduct} style={{ background: "#e8f0e6", color: "#1f5b3b" }}>{t("रद्द करा")}</button></div>
          </form>
        </section>
        <section className="card admin-product-list-card border-0">
          <div className="admin-card-heading"><div><span className="admin-eyebrow">Catalogue</span><h2>{t("सर्व उत्पादने")} ({products.length})</h2></div><button className="btn btn-outline-success" type="button" onClick={() => void load()} disabled={loading}>↻ Refresh</button></div>
          <div className="admin-product-list">
            {products.map((product) => <article className="admin-product-row" key={product.id}>
              <div className="admin-product-info"><span className="admin-product-emoji">{product.emoji || "🌾"}</span><div><strong>{product.name} <small>/ {product.english}</small></strong><p>ID: {product.id} · वाण: {product.varieties.join(", ")}</p><span className="admin-product-price">₹{product.pricePerKg}/किलो</span> <span className={product.active === false ? "status-pill inactive" : "status-pill"}>{product.active === false ? t("ग्राहकांना लपवलेले") : product.pricePerKg <= 0 ? t("किंमत निश्चित करणे बाकी") : t("उपलब्ध")}</span></div></div>
              <div className="admin-product-actions">
                <button type="button" onClick={() => edit(product)}>{t("उत्पादन बदला")}</button>
                <button type="button" onClick={() => void removeProduct(product)} disabled={loading} style={{ background: "#fff0ed", color: "#a83222", border: "1px solid #f0c7bf", padding: "9px 12px", borderRadius: 8 }}>{t("Delete")}</button>
              </div>
            </article>)}
          </div>
        </section>
      </>}
    </div>
  </main>;
}
