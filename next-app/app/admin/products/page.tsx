"use client";

import { useCallback, useEffect, useState } from "react";
import LanguageSwitcher, { useAppLanguage } from "../../components/LanguageSwitcher";

type Product = { id: string; name: string; english: string; varieties: string[]; pricePerKg: number; note?: string; emoji?: string; active?: boolean };
const blank: Product = { id: "", name: "", english: "", varieties: [], pricePerKg: 0, note: "", emoji: "🌾", active: true };

export default function AdminProductsPage() {
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
    const payload = { ...form, varieties: varietyText.split(",").map((v) => v.trim()).filter(Boolean) };
    try {
      const response = await fetch("/api/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (response.status === 401) { setAuthenticated(false); throw new Error("Session संपली. पुन्हा login करा."); }
      if (!response.ok) throw new Error(data.error || "उत्पादन सेव्ह झाले नाही.");
      setMessage("उत्पादन सेव्ह झाले.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "उत्पादन सेव्ह झाले नाही."); }
    finally { setLoading(false); }
  }

  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); setAuthenticated(false); }

  return <main className="container-fluid py-4" style={{ minHeight: "100vh", background: "#f5f7f2", color: "#203126", padding: "24px 14px 60px" }}>
    <div style={{ maxWidth: 1050, margin: "0 auto" }}>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3"><a href="/admin" style={{ color: "#1f5b3b", fontWeight: 700 }}>← Admin Orders</a><LanguageSwitcher /></div>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", margin: "20px 0" }}>
        <div><h1 style={{ margin: 0 }}>{t("उत्पादन व किंमत व्यवस्थापन")}</h1><p>{t("धान्याचे वाण, किलोचा दर आणि उपलब्धता बदला.")}</p></div>
        {authenticated && <button onClick={() => void logout()} style={{ padding: 10 }}>Logout</button>}
      </header>
      {message && <p role="status" style={{ padding: 12, borderRadius: 8, background: "#eaf2e8" }}>{message}</p>}
      {!authenticated ? <section className="card shadow-sm border-0" style={{ background: "#fff", padding: 20, borderRadius: 14, maxWidth: 420 }}>
        <h2>Admin Login</h2><form onSubmit={login}><label htmlFor="password">Admin Password</label><input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%", padding: 12, margin: "8px 0 14px" }} /><button disabled={loading}>Login करा</button></form>
      </section> : <>
        <section className="card shadow-sm border-0 mb-4" style={{ background: "#fff", padding: 20, borderRadius: 14, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}><h2>{form.id ? t("उत्पादन बदला") : t("नवीन उत्पादन")}</h2><button type="button" onClick={newProduct}>＋ {t("नवीन उत्पादन")}</button></div>
          <form onSubmit={save} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
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
        <section className="card shadow-sm border-0" style={{ background: "#fff", padding: 20, borderRadius: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><h2>{t("सर्व उत्पादने")} ({products.length})</h2><button type="button" onClick={() => void load()} disabled={loading}>Refresh</button></div>
          <div style={{ display: "grid", gap: 10 }}>
            {products.map((product) => <article key={product.id} style={{ border: "1px solid #e2e8df", borderRadius: 12, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div><strong>{product.emoji} {product.name} / {product.english}</strong><p style={{ margin: "5px 0", color: "#657267" }}>ID: {product.id} · वाण: {product.varieties.join(", ")}</p><strong>₹{product.pricePerKg}/किलो</strong> · {product.active === false ? t("ग्राहकांना लपवलेले") : product.pricePerKg <= 0 ? t("किंमत निश्चित करणे बाकी") : t("उपलब्ध")}</div>
              <button type="button" onClick={() => edit(product)}>{t("उत्पादन बदला")}</button>
            </article>)}
          </div>
        </section>
      </>}
    </div>
  </main>;
}
