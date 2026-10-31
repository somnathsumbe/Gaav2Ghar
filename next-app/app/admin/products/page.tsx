"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import LanguageSwitcher, { useAppLanguage } from "../../components/LanguageSwitcher";

type Product = { id: string; name: string; english: string; varieties: string[]; pricePerKg: number; note?: string; emoji?: string; active?: boolean };
const blank: Product = { id: "", name: "", english: "", varieties: [], pricePerKg: 0, note: "", emoji: "🌾", active: true };

export default function AdminProductsPage() {
  const { t } = useAppLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<Product>(blank);
  const [varietyText, setVarietyText] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "hidden" | "unpriced">("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Products could not be loaded.");
      setProducts(data.products || []);
      setMessage("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Products could not be loaded."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void fetch("/api/admin/orders", { cache: "no-store" })
      .then((r) => { if (r.ok) setAuthenticated(true); })
      .catch(() => undefined)
      .finally(() => setAuthChecked(true));
    void load();
  }, [load]);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed.");
      setAuthenticated(true); setPassword(""); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Login failed."); }
    finally { setLoading(false); }
  }

  function edit(product: Product) {
    setForm({ ...product });
    setVarietyText(product.varieties.join(", "));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function newProduct() { setForm({ ...blank }); setVarietyText(""); }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    const isNewProduct = !products.some((product) => product.id === form.id);
    const payload = { ...form, varieties: varietyText.split(",").map((v) => v.trim()).filter(Boolean) };
    try {
      const response = await fetch("/api/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (response.status === 401) { setAuthenticated(false); throw new Error("Session expired. Please log in again."); }
      if (!response.ok) throw new Error(data.error || "Product could not be saved.");
      setMessage(isNewProduct ? "New product added successfully." : "Product changes saved successfully.");
      newProduct();
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Product could not be saved."); }
    finally { setLoading(false); }
  }

  async function removeProduct(product: Product) {
    if (!window.confirm(`Delete "${product.name}" (${product.english}) permanently? This will also remove it from MongoDB.`)) return;
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/products", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: product.id }) });
      const data = await response.json();
      if (response.status === 401) { setAuthenticated(false); throw new Error("Session expired. Please log in again."); }
      if (!response.ok) throw new Error(data.error || "Product could not be deleted.");
      if (form.id === product.id) newProduct();
      setMessage("Product deleted from MongoDB.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Product could not be deleted."); }
    finally { setLoading(false); }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setProducts([]);
  }

  const visibleProducts = useMemo(() => products.filter((product) => {
    const query = search.trim().toLocaleLowerCase();
    const matchesSearch = !query || [product.id, product.name, product.english, ...product.varieties].join(" ").toLocaleLowerCase().includes(query);
    const matchesFilter = filter === "all" || (filter === "active" && product.active !== false) || (filter === "hidden" && product.active === false) || (filter === "unpriced" && product.pricePerKg <= 0);
    return matchesSearch && matchesFilter;
  }), [products, search, filter]);
  const activeCount = products.filter((p) => p.active !== false).length;
  const hiddenCount = products.length - activeCount;
  const priced = products.filter((p) => p.pricePerKg > 0);
  const averagePrice = priced.length ? priced.reduce((sum, p) => sum + p.pricePerKg, 0) / priced.length : 0;

  return <main className="inventory-app">
    <aside className={`inventory-sidebar ${sidebarOpen ? "is-open" : ""}`}>
      <div className="inventory-brand"><span className="brand-symbol">🌾</span><strong>Gaav2Ghar</strong><button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation">×</button></div>
      <p className="sidebar-caption">INVENTORY ADMIN</p>
      <nav className="inventory-nav">
        <a href="/admin"><span>▦</span> Dashboard</a>
        <a href="/admin"><span>▤</span> Order Management</a>
        <a href="/admin/products" className="selected"><span>▣</span> Products & Pricing</a>
        <a href="/admin" aria-label="Customers (not available yet)"><span>♙</span> Customers</a>
        <a href="/admin" aria-label="Sales analytics (not available yet)"><span>▥</span> Sales Analytics</a>
      </nav>
      <div className="sidebar-bottom"><p className="sidebar-caption">SYSTEM</p><button type="button" onClick={() => void logout()} disabled={!authenticated}>↪ <span>Logout</span></button></div>
    </aside>
    {sidebarOpen && <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
    <section className="inventory-main">
      <header className="inventory-topbar">
        <button className="mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">☰</button>
        <div className="breadcrumb"><span>GAAV2GHAR INVENTORY</span><b>/</b> Product & Pricing Management</div>
        <div className="topbar-actions"><LanguageSwitcher /><span className="admin-avatar">A</span><div className="admin-identity"><strong>Admin Manager</strong><small>Inventory Hub</small></div></div>
      </header>
      <div className="inventory-content">
        <div className="page-heading">
          <div><span className="eyebrow">CATALOGUE CONTROL</span><h1>Product & Pricing Management</h1><p>Manage grain varieties, per-kg pricing rates and customer availability.</p></div>
          <div className="heading-actions"><button className="button-secondary" type="button" onClick={newProduct}>＋ New Product</button><button className="button-secondary" type="button" onClick={() => void load()} disabled={loading}>↻ Refresh</button></div>
        </div>

        {message && <div className="inventory-message" role="status">{message}<button onClick={() => setMessage("")} aria-label="Dismiss message">×</button></div>}

        {!authenticated ? <section className="login-panel">
          <div className="editor-heading"><div><span className="eyebrow">SECURE ACCESS</span><h2>Admin Login</h2><p>Log in to manage catalogue and pricing.</p></div></div>
          {!authChecked && <p>Checking admin session…</p>}
          <form onSubmit={login}><label htmlFor="admin-products-password">Admin Password</label><input id="admin-products-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /><button className="button-primary" disabled={loading}>{loading ? "Please wait…" : "Login"}</button></form>
        </section> : <>
          <div className="metric-grid">
            <article className="metric-card"><div><span>Total Catalogue Products</span><strong>{products.length}</strong><small>All products in catalogue</small></div><i className="metric-icon green">▣</i></article>
            <article className="metric-card"><div><span>Active & Available</span><strong>{activeCount}</strong><small>Visible to customers</small></div><i className="metric-icon blue">◉</i></article>
            <article className="metric-card"><div><span>Out of Stock / Hidden</span><strong>{hiddenCount}</strong><small>Not visible to customers</small></div><i className="metric-icon grey">⊘</i></article>
            <article className="metric-card"><div><span>Average Price Rate</span><strong>₹{averagePrice.toFixed(2)}</strong><small>Per kg · priced products only</small></div><i className="metric-icon amber">₹</i></article>
          </div>

          <div className="inventory-layout">
            <section className="editor-panel">
              <div className="editor-heading"><div><span className="eyebrow">PRODUCT EDITOR</span><h2>{form.id ? "Edit Product" : "New Product"}</h2></div><span className={`mode-chip ${form.id ? "editing" : ""}`}>{form.id ? "MODE: EDIT" : "MODE: ADD"}</span></div>
              <form className="inventory-form" onSubmit={save}>
                <label>Product ID <small>English, unique</small><input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} required maxLength={40} disabled={products.some((p) => p.id === form.id)} placeholder="e.g. wheat, onion, moong" /></label>
                <label>Marathi Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={80} placeholder="उदा. कांदा, गहू, ज्वारी" /></label>
                <div className="form-two"><label>English Name<input value={form.english} onChange={(e) => setForm({ ...form, english: e.target.value })} required maxLength={80} placeholder="e.g. Onion, Wheat" /></label><label>Price (₹ / kg)<input type="number" min="0" max="100000" step="0.01" value={form.pricePerKg} onChange={(e) => setForm({ ...form, pricePerKg: Number(e.target.value) })} required /></label></div>
                <label>Varieties <small>Comma-separated</small><input value={varietyText} onChange={(e) => setVarietyText(e.target.value)} required placeholder="लोकवन, बन्सी, शरबती" /></label>
                <div className="form-two"><label>Emoji Icon<input value={form.emoji || ""} onChange={(e) => setForm({ ...form, emoji: e.target.value })} maxLength={12} placeholder="🌾" /></label><label>Description<input value={form.note || ""} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={200} placeholder="Short product description" /></label></div>
                <label className="availability-control"><input type="checkbox" checked={form.active !== false} onChange={(e) => setForm({ ...form, active: e.target.checked })} /><span><strong>Available to customers</strong><small>Turn off to hide this product from the storefront.</small></span></label>
                <div className="form-actions"><button className="button-primary" disabled={loading}>{loading ? "Saving…" : "✓ Save Product"}</button><button className="button-secondary" type="button" onClick={newProduct}>Cancel</button></div>
              </form>
            </section>

            <section className="catalogue-panel">
              <div className="catalogue-heading"><div><span className="eyebrow">CATALOGUE</span><h2>All Products <span>({visibleProducts.length})</span></h2></div><button className="button-secondary refresh-mobile" onClick={() => void load()} disabled={loading}>↻ Refresh</button></div>
              <div className="catalogue-controls"><input aria-label="Search products" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="⌕  Search product, ID or variety…" /><select aria-label="Filter products" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}><option value="all">All products</option><option value="active">Available</option><option value="hidden">Hidden</option><option value="unpriced">Price not set</option></select></div>
              {loading && products.length === 0 ? <p className="empty-state">Loading catalogue…</p> : visibleProducts.length === 0 ? <p className="empty-state">No products match your search.</p> :
                <div className="catalogue-table-wrap"><table className="catalogue-table"><thead><tr><th>PRODUCT INFO</th><th>ID & VARIETIES</th><th>PRICE / KG</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>
                  {visibleProducts.map((product) => <tr key={product.id}><td><div className="table-product"><span>{product.emoji || "🌾"}</span><div><strong>{product.name} <small>/ {product.english}</small></strong><small>{product.note || "Direct farm produce"}</small></div></div></td><td><code>{product.id}</code><div className="variety-list">{product.varieties.map((variety) => <span key={variety}>{variety}</span>)}</div></td><td><strong className="price-value">{product.pricePerKg > 0 ? `₹${product.pricePerKg}` : "—"}</strong><small className="per-kg">/ kg</small></td><td><span className={`product-status ${product.active === false ? "hidden" : product.pricePerKg <= 0 ? "unpriced" : ""}`}>{product.active === false ? "Hidden" : product.pricePerKg <= 0 ? "Price pending" : "Available"}</span></td><td><div className="row-actions"><button type="button" onClick={() => edit(product)} aria-label={`Edit ${product.name}`} title="Edit">✎</button><button type="button" className="delete-action" onClick={() => void removeProduct(product)} disabled={loading} aria-label={`Delete ${product.name}`} title="Delete">⌫</button></div></td></tr>)}
                </tbody></table></div>}
              <div className="catalogue-footer">Showing {visibleProducts.length} of {products.length} products <span>Prices are managed per kilogram</span></div>
            </section>
          </div>
        </>}
      </div>
    </section>

    <style jsx>{`
      .inventory-app{--brand:#1b5e20;--deep:#123e15;--soft:#e8f5e9;min-height:100vh;background:#f4f6f8;color:#202a22;font-family:Arial,'Noto Sans Devanagari',sans-serif}
      .inventory-sidebar{position:fixed;inset:0 auto 0 0;width:260px;background:var(--deep);color:#fff;padding:22px 17px;display:flex;flex-direction:column;z-index:60}
      .inventory-brand{display:flex;align-items:center;gap:10px;padding:0 6px 30px;font-size:19px}.brand-symbol{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:#fff;color:var(--brand);font-size:22px}.sidebar-close{display:none;margin-left:auto;background:transparent;border:0;color:#fff;font-size:26px}
      .sidebar-caption{font-size:10px;font-weight:800;letter-spacing:.12em;color:#ffffff80;padding:0 12px;margin:0 0 10px}
      .inventory-nav{display:grid;gap:5px}.inventory-nav a,.sidebar-bottom button{display:flex;align-items:center;gap:13px;padding:12px;border-radius:10px;color:#ffffffc4;font-size:13px;font-weight:600}.inventory-nav a span{width:19px;text-align:center;font-size:18px}.inventory-nav a:hover,.inventory-nav a.selected{background:#ffffff20;color:#fff;box-shadow:inset 3px 0 #81c784}
      .sidebar-bottom{margin-top:auto;border-top:1px solid #ffffff24;padding-top:20px}.sidebar-bottom button{width:100%;border:0;background:transparent;text-align:left;cursor:pointer}.sidebar-bottom button:disabled{opacity:.45}
      .inventory-main{margin-left:260px;min-height:100vh}.inventory-topbar{height:66px;background:#fff;border-bottom:1px solid #e5e7eb;position:sticky;top:0;z-index:30;display:flex;align-items:center;justify-content:space-between;padding:0 28px;gap:15px}.breadcrumb{font-size:12px;color:#69736a}.breadcrumb span{font-size:10px;font-weight:800;letter-spacing:.08em;color:var(--brand)}.breadcrumb b{padding:0 10px;color:#b3bbb3}.topbar-actions{display:flex;align-items:center;gap:12px}.admin-avatar{width:36px;height:36px;border-radius:50%;background:var(--brand);color:#fff;display:grid;place-items:center;font-weight:800}.admin-identity strong,.admin-identity small{display:block}.admin-identity strong{font-size:12px}.admin-identity small{font-size:10px;color:#778176}.mobile-menu{display:none}
      .inventory-content{padding:27px;max-width:1800px;margin:0 auto}.page-heading{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:22px}.eyebrow{font-size:10px;letter-spacing:.13em;font-weight:800;color:#758276}.page-heading h1{font-size:clamp(24px,3vw,32px);font-weight:800;letter-spacing:-.7px;margin:5px 0;color:#1b3827}.page-heading p{font-size:12px;color:#758076;margin:0}.heading-actions{display:flex;gap:9px;flex-wrap:wrap}
      .button-primary,.button-secondary{border-radius:9px;padding:10px 14px;font-size:12px;font-weight:800;cursor:pointer;border:1px solid transparent;min-height:40px}.button-primary{background:var(--brand);color:#fff}.button-primary:hover{background:#164b1b}.button-primary:disabled{opacity:.6;cursor:wait}.button-secondary{background:#fff;border-color:#dce4da;color:#344b38}.button-secondary:hover{background:#f1f6ef}.button-secondary:disabled{opacity:.5}
      .inventory-message{display:flex;justify-content:space-between;gap:12px;padding:12px 15px;border:1px solid #cfe2ce;border-radius:10px;background:#edf7ec;color:#205b2b;font-size:12px;margin-bottom:18px}.inventory-message button{border:0;background:none;color:inherit;font-size:18px}
      .metric-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:22px}.metric-card{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:17px;background:#fff;border:1px solid #e8ece6;border-radius:14px;box-shadow:0 4px 16px #00000006}.metric-card span,.metric-card small{display:block;color:#788278;font-size:10px}.metric-card strong{display:block;font-size:25px;line-height:1.3;margin:5px 0;color:#26392a}.metric-card small{font-size:9px}.metric-icon{width:43px;height:43px;border-radius:12px;display:grid;place-items:center;font-size:20px;font-style:normal}.metric-icon.green{background:#e7f4e8;color:#28723a}.metric-icon.blue{background:#eaf2fc;color:#3e75b7}.metric-icon.grey{background:#eff1f2;color:#66717b}.metric-icon.amber{background:#fff5df;color:#b57b16}
      .inventory-layout{display:grid;grid-template-columns:minmax(300px,.82fr) minmax(0,1.5fr);align-items:start;gap:18px}.editor-panel,.catalogue-panel,.login-panel{background:#fff;border:1px solid #e6ebe4;border-radius:15px;padding:19px;box-shadow:0 5px 18px #00000005;min-width:0}.editor-panel{position:sticky;top:84px}.editor-heading,.catalogue-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;padding-bottom:15px;border-bottom:1px solid #edf0eb;margin-bottom:15px}.editor-heading h2,.catalogue-heading h2,.login-panel h2{font-size:17px;font-weight:800;color:#263b2c;margin:4px 0 0}.catalogue-heading h2 span{color:#778176;font-size:13px}.mode-chip{border-radius:99px;padding:5px 9px;background:#e8f5e9;color:#28713a;font-size:9px;font-weight:800;white-space:nowrap}.mode-chip.editing{background:#fff3dc;color:#986514}
      .inventory-form{display:grid;gap:12px}.inventory-form label,.login-panel label{display:grid;gap:6px;color:#435147;font-size:11px;font-weight:700}.inventory-form label>small{display:inline;color:#89928a;font-weight:500}.inventory-form input,.login-panel input,.catalogue-controls input,.catalogue-controls select{width:100%;min-width:0;min-height:39px;padding:9px 10px;border:1px solid #dfe6dd;border-radius:8px;background:#fff;color:#26372b;font-size:12px;outline:none}.inventory-form input:focus,.login-panel input:focus,.catalogue-controls input:focus,.catalogue-controls select:focus{border-color:#4d8b53;box-shadow:0 0 0 3px #1b5e2018}.form-two{display:grid;grid-template-columns:1fr 1fr;gap:9px}.availability-control{display:flex!important;align-items:center;gap:9px;padding:10px;background:#f7faf6;border:1px solid #edf1eb;border-radius:9px}.availability-control>input{width:17px;height:17px;min-height:17px;accent-color:var(--brand)}.availability-control span,.availability-control strong,.availability-control small{display:block}.availability-control strong{font-size:11px}.availability-control small{font-size:9px;color:#7b857c;margin-top:2px}.form-actions{display:flex;gap:8px}.form-actions button:first-child{flex:1}
      .catalogue-controls{display:flex;gap:9px;margin-bottom:13px}.catalogue-controls input{flex:1}.catalogue-controls select{width:140px}.catalogue-table-wrap{width:100%;overflow-x:auto}.catalogue-table{width:100%;border-collapse:collapse;text-align:left;min-width:620px}.catalogue-table th{padding:11px 9px;background:#f6f8f5;color:#778177;font-size:9px;letter-spacing:.06em;font-weight:800}.catalogue-table td{padding:13px 9px;border-bottom:1px solid #edf0eb;vertical-align:middle;font-size:11px}.table-product{display:flex;align-items:center;gap:9px;min-width:150px}.table-product>span{display:grid;place-items:center;width:39px;height:39px;flex:none;border-radius:10px;background:#f2f6ef;font-size:22px}.table-product strong,.table-product small{display:block}.table-product strong{font-size:11px;color:#26382b}.table-product strong small{display:inline;color:#7c867c;font-weight:500}.table-product div>small{font-size:9px;color:#8a938a;margin-top:3px}.catalogue-table code{display:inline-block;background:#f5f6f5;border:1px solid #e8ebe7;border-radius:5px;padding:3px 5px;color:#46534a;font-size:9px}.variety-list{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px;max-width:180px}.variety-list span{background:#f2f5f2;border:1px solid #e5eae4;border-radius:5px;padding:3px 5px;color:#69756b;font-size:9px}.price-value{color:#26713a;font-size:13px;white-space:nowrap}.per-kg{color:#889188;font-size:9px}.product-status{display:inline-block;padding:5px 8px;border-radius:99px;background:#e8f5e9;color:#28713a;font-size:9px;font-weight:800;white-space:nowrap}.product-status.hidden{background:#f0f1f2;color:#68717a}.product-status.unpriced{background:#fff4df;color:#946716}.row-actions{display:flex;gap:5px}.row-actions button{width:30px;height:30px;border:1px solid #dfe5de;border-radius:7px;background:#fff;color:#516253;cursor:pointer}.row-actions .delete-action{color:#b34335;border-color:#f0d8d3}.row-actions button:disabled{opacity:.4}.catalogue-footer{display:flex;justify-content:space-between;gap:12px;border-top:1px solid #edf0eb;padding-top:12px;margin-top:9px;color:#7d887e;font-size:9px}.empty-state{padding:35px 10px;text-align:center;color:#788278;font-size:12px}
      .login-panel{max-width:440px;margin:8vh auto}.login-panel p{font-size:12px;color:#7b857c}.login-panel form{display:grid;gap:12px}.login-panel form button{width:100%}
      .sidebar-scrim{display:none}
      @media(max-width:1150px){.inventory-layout{grid-template-columns:minmax(280px,.8fr) minmax(0,1.2fr)}.metric-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.inventory-content{padding:22px}}
      @media(max-width:900px){.inventory-sidebar{transform:translateX(-100%);transition:transform .25s ease}.inventory-sidebar.is-open{transform:translateX(0)}.sidebar-close{display:block}.sidebar-scrim{display:block;position:fixed;inset:0;z-index:55;background:#0b1d10a8;border:0}.inventory-main{margin-left:0}.mobile-menu{display:block;border:0;background:#f1f5ef;border-radius:8px;padding:8px 10px;color:#214f35}.inventory-topbar{padding:0 17px}.breadcrumb{margin-right:auto}.inventory-layout{grid-template-columns:1fr}.editor-panel{position:static}.page-heading{align-items:flex-start}}
      @media(max-width:600px){.inventory-topbar{height:60px;padding:0 12px;gap:9px}.breadcrumb{font-size:0}.breadcrumb span{font-size:9px}.breadcrumb b{display:none}.topbar-actions{gap:7px}.admin-identity{display:none}.admin-avatar{width:32px;height:32px}.inventory-content{padding:17px 11px 35px}.page-heading{display:block}.page-heading h1{font-size:23px;line-height:1.3}.page-heading p{font-size:11px;line-height:1.6}.heading-actions{margin-top:13px}.heading-actions button{flex:1;padding:9px 8px;font-size:10px}.metric-grid{gap:9px;margin-bottom:14px}.metric-card{padding:12px;border-radius:12px}.metric-card span{font-size:9px}.metric-card strong{font-size:21px}.metric-card small{font-size:8px}.metric-icon{width:34px;height:34px;font-size:16px}.editor-panel,.catalogue-panel{padding:14px;border-radius:13px}.editor-heading h2,.catalogue-heading h2{font-size:15px}.form-two{grid-template-columns:1fr 1fr;gap:7px}.form-two label{font-size:10px}.form-two input{font-size:11px}.catalogue-controls{flex-direction:column}.catalogue-controls select{width:100%}.catalogue-footer{flex-direction:column;gap:5px}.refresh-mobile{display:none}}
      @media(max-width:360px){.metric-card{gap:5px;padding:10px}.metric-card strong{font-size:19px}.form-two{grid-template-columns:1fr}.heading-actions button{font-size:9px}}
    `}</style>
  </main>;
}
