"use client";

import { useCallback, useEffect, useState } from "react";
import LanguageSwitcher, { useAppLanguage } from "../components/LanguageSwitcher";

type OrderItem = {
  product?: string;
  variety?: string;
  bagSizeKg?: number;
  bags?: number;
  quantityKg?: number;
  pricePerKg?: number;
};
type Order = {
  orderId: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  customer?: { name?: string; phone?: string; address?: string; pinCode?: string };
  items?: OrderItem[];
  subtotal?: number;
  deliveryCharge?: number;
  total?: number;
  paymentMethod?: string;
};
const statuses = [
  ["pending_confirmation", "पुष्टी बाकी"],
  ["confirmed", "पुष्टी झाली"],
  ["packed", "पॅक केले"],
  ["out_for_delivery", "डिलिव्हरीसाठी निघाले"],
  ["delivered", "डिलिव्हर झाले"],
  ["cancelled", "रद्द केले"],
] as const;
const money = (value?: number) => "₹" + (Number.isFinite(value) ? Number(value).toLocaleString("en-IN") : "0");
const date = (value?: string) => value ? new Date(value).toLocaleString("en-IN") : "—";

export default function AdminPage() {
  const { t } = useAppLanguage();
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      const data = await response.json();
      if (response.status === 401) { setAuthenticated(false); return; }
      if (!response.ok) throw new Error(data.error || "ऑर्डर्स लोड करता आले नाहीत.");
      setOrders(data.orders || []);
      setAuthenticated(true);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "काहीतरी चुकले.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadOrders(); }, [loadOrders]);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login झाले नाही.");
      setPassword("");
      setAuthenticated(true);
      await loadOrders();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login झाले नाही.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId: string, status: string) {
    setMessage("");
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Status update झाले नाही.");
      setOrders((old) => old.map((order) => order.orderId === orderId ? { ...order, status } : order));
      setMessage("ऑर्डर " + orderId + " चा status अपडेट झाला.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Status update झाले नाही.");
    }
  }

  function printInvoice(order: Order) {
    const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] || char));
    const rows = (order.items || []).map((item) => {
      const qty = Number(item.quantityKg) || (Number(item.bagSizeKg) * Number(item.bags)) || 0;
      const amount = qty * (Number(item.pricePerKg) || 0);
      return `<tr><td>${escapeHtml(item.product)}<br/><small>${escapeHtml(item.variety)}</small></td><td>${escapeHtml(item.bagSizeKg)} kg × ${escapeHtml(item.bags)}</td><td>${qty} kg</td><td>₹${(Number(item.pricePerKg) || 0).toLocaleString("en-IN")}</td><td>₹${amount.toLocaleString("en-IN")}</td></tr>`;
    }).join("");
    const invoiceHtml = `<!doctype html><html><head><meta charset="utf-8"/><title>Invoice ${escapeHtml(order.orderId)}</title><style>
      body{font:14px Arial,sans-serif;color:#243328;margin:32px}header{display:flex;justify-content:space-between;border-bottom:2px solid #214f35;padding-bottom:16px}h1{color:#214f35;margin:0 0 6px}.muted{color:#657267;font-size:12px}.cols{display:flex;justify-content:space-between;gap:30px;margin:24px 0}.box{flex:1;line-height:1.7}table{width:100%;border-collapse:collapse;margin-top:22px}th,td{padding:11px 8px;border-bottom:1px solid #dfe6dc;text-align:left}th{background:#edf3e8}.totals{width:280px;margin:20px 0 0 auto}.totals div{display:flex;justify-content:space-between;padding:6px}.grand{font-size:18px;font-weight:bold;border-top:2px solid #214f35;margin-top:8px;padding-top:12px!important}.footer{margin-top:45px;border-top:1px solid #ddd;padding-top:14px;text-align:center;color:#657267;font-size:12px}@media print{body{margin:15mm}button{display:none}}
    </style></head><body><header><div><h1>Gaav2Ghar</h1><div class="muted">गावाकडचे धान्य • घरपोच सेवा</div></div><div><h2>DELIVERY INVOICE</h2><strong>${escapeHtml(order.orderId)}</strong><div class="muted">Date: ${escapeHtml(date(order.createdAt))}</div></div></header>
    <div class="cols"><div class="box"><strong>Bill To</strong><br/>${escapeHtml(order.customer?.name)}<br/>Mobile: ${escapeHtml(order.customer?.phone)}<br/>${escapeHtml(order.customer?.address)}<br/>PIN Code: ${escapeHtml(order.customer?.pinCode || "—")}</div><div class="box"><strong>Delivery Details</strong><br/>Order Status: ${escapeHtml(order.status || "pending_confirmation")}<br/>Payment: ${escapeHtml(order.paymentMethod || "COD")}<br/>Payment Mode: Cash on Delivery</div></div>
    <table><thead><tr><th>Product / Variety</th><th>Pack</th><th>Quantity</th><th>Rate / kg</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="totals"><div><span>Subtotal</span><strong>${money(order.subtotal)}</strong></div><div><span>Delivery</span><strong>${money(order.deliveryCharge)}</strong></div><div class="grand"><span>Total Due</span><strong>${money(order.total)}</strong></div></div>
    <div class="footer">Thank you for choosing Gaav2Ghar. Please verify items and amount at delivery.</div><script>window.onload=()=>window.print();</script></body></html>`;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) { setMessage("Invoice उघडण्यासाठी browser pop-up परवानगी द्या."); return; }
    printWindow.document.open();
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setOrders([]);
    setMessage("Logout झाले.");
  }

  const filtered = orders.filter((order) => {
    const statusMatch = filter === "all" || (order.status || "pending_confirmation") === filter;
    const q = search.trim().toLowerCase();
    const searchMatch = !q || [order.orderId, order.customer?.name, order.customer?.phone, order.customer?.address].some(v => String(v || "").toLowerCase().includes(q));
    const dateMatch = !dateFilter || (order.createdAt ? new Date(order.createdAt).toISOString().slice(0,10) === dateFilter : false);
    return statusMatch && searchMatch && dateMatch;
  });
  const revenue = orders.filter(o => o.status !== "cancelled").reduce((sum,o)=>sum+(Number(o.total)||0),0);
  const pendingCount = orders.filter(o => (o.status || "pending_confirmation")==="pending_confirmation").length;
  const deliveredCount = orders.filter(o => o.status==="delivered").length;
  const totalKg = orders.reduce((sum,o)=>sum+(o.items||[]).reduce((n,i)=>n+(Number(i.quantityKg)||Number(i.bagSizeKg)*Number(i.bags)||0),0),0);

  return (
    <main className="admin-shell container-fluid">
      <style jsx>{`
        .admin-shell{min-height:100vh;background:#f4f6f8;padding:0;display:flex;color:#203126}
        .sidebar{position:fixed;inset:0 auto 0 0;width:260px;background:#123e25;color:#fff;padding:22px 16px;z-index:50;display:flex;flex-direction:column;transition:transform .25s}
        .brand{display:flex;align-items:center;gap:10px;padding:0 10px 28px;font-size:21px;font-weight:800}.brand-mark{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:white;color:#1b6a39}
        .menu-label{padding:0 12px;margin:8px 0;color:#a8c1ad;font-size:10px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}
        .side-link{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:11px;color:#d8e5da;text-decoration:none;font-size:13px;font-weight:650;margin:2px 0}.side-link:hover,.side-link.active{background:#ffffff20;color:#fff;box-shadow:inset 3px 0 #9ed5a6}
        .side-spacer{flex:1}.sidebar-overlay{display:none}.main-content{margin-left:260px;width:calc(100% - 260px);min-width:0}
        .top-header{height:68px;position:sticky;top:0;z-index:20;background:#fff;border-bottom:1px solid #e5e9e5;padding:0 28px;display:flex;align-items:center;justify-content:space-between;gap:14px}
        .header-left,.header-actions{display:flex;align-items:center;gap:12px;min-width:0}.icon-button{width:40px;height:40px;border:1px solid #e4e9e3;border-radius:12px;background:#f8faf7;color:#35543d;display:grid;place-items:center;padding:0}
        .profile{display:flex;align-items:center;gap:10px;border-left:1px solid #e5e9e5;padding-left:14px}.avatar{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:#1f6a3a;color:white;font-weight:800}
        .content{padding:26px 28px 50px;max-width:1600px;margin:0 auto}.page-heading{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:22px}.page-heading h1{font-size:clamp(23px,3vw,31px);font-weight:800;color:#183b29;margin:0 0 5px}
        .muted{color:#748075;margin:0}.action-row{display:flex;gap:9px;flex-wrap:wrap}.btn-brand{background:#1b5e35;color:#fff;border:1px solid #1b5e35;border-radius:10px;padding:10px 15px;font-weight:700;text-decoration:none}.btn-soft{background:#fff;color:#31533a;border:1px solid #dce5da;border-radius:10px;padding:10px 15px;font-weight:700}
        .kpi-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:22px}.kpi{background:#fff;border:1px solid #e7ece5;border-radius:15px;padding:18px;display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0;box-shadow:0 4px 16px #142d1a08}
        .kpi-label{font-size:12px;font-weight:700;color:#69776b}.kpi-value{font-size:clamp(20px,2vw,26px);font-weight:850;color:#203b29;margin:6px 0 2px}.kpi-note{font-size:11px;color:#89938a}.kpi-icon{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;font-size:20px;background:#e9f4e9;color:#28723d;flex:none}
        .panel{background:#fff;border:1px solid #e5ebe3;border-radius:16px;padding:18px;box-shadow:0 5px 18px #142d1a08}.filter-grid{display:grid;grid-template-columns:minmax(220px,1.7fr) minmax(170px,.9fr) minmax(150px,.7fr) auto;gap:10px;align-items:center}.field{width:100%;min-height:43px;border:1px solid #dce4da;border-radius:10px;padding:9px 12px;background:#fff;color:#263a2b;min-width:0}
        .orders-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:24px 0 14px}.orders-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.order-card{background:#fff;border:1px solid #e5ebe3;border-radius:16px;padding:18px;min-width:0;display:flex;flex-direction:column;gap:14px;box-shadow:0 4px 16px #142d1a08}
        .order-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;border-bottom:1px solid #edf0eb;padding-bottom:13px}.order-id{font-size:16px;font-weight:850;color:#263d2c;overflow-wrap:anywhere}.order-meta{font-size:11px;color:#89938a;margin-top:5px}
        .status-pill{font-size:10px;font-weight:800;border-radius:99px;padding:6px 9px;background:#fff5dc;color:#946b09;white-space:nowrap}.status-pill.confirmed,.status-pill.packed{background:#e9f2ff;color:#245e9a}.status-pill.out_for_delivery{background:#e8f5fb;color:#16708b}.status-pill.delivered{background:#e7f5e9;color:#24713a}.status-pill.cancelled{background:#fff0ed;color:#ad3c2b}
        .customer-box{background:#f8faf7;border-left:3px solid #5a9664;border-radius:9px;padding:11px 12px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 12px}.customer-detail{font-size:12px;color:#59665b;overflow-wrap:anywhere}.customer-detail strong{color:#273b2b}
        .item-list{display:grid;gap:7px}.item-row{display:flex;justify-content:space-between;gap:10px;background:#f8f9f7;border:1px solid #edf0eb;border-radius:9px;padding:8px 10px;font-size:11px;color:#536155}.item-row strong{color:#2d4031}
        .order-footer{border-top:1px solid #edf0eb;padding-top:13px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:end}.order-footer label{display:block;font-size:11px;color:#748075;font-weight:700;margin-bottom:5px}.order-total{text-align:right;font-size:20px;font-weight:850;color:#1c6637;white-space:nowrap}
        .message{padding:12px 14px;border-radius:10px;background:#edf4e9;margin:14px 0;overflow-wrap:anywhere}.empty{background:#fff;border:1px dashed #d7e0d4;border-radius:14px;text-align:center;padding:40px 14px;color:#718071;grid-column:1/-1}
        @media(max-width:1100px){.kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.orders-grid{grid-template-columns:1fr}.filter-grid{grid-template-columns:1fr 1fr}}
        @media(max-width:760px){.sidebar{transform:translateX(-100%)}.sidebar.show{transform:translateX(0)}.sidebar-overlay.show{display:block;position:fixed;inset:0;background:#0d2014a0;z-index:40}.main-content{margin-left:0;width:100%}.top-header{height:60px;padding:0 14px}.content{padding:18px 12px 36px}.profile-copy{display:none}.profile{padding-left:8px}.filter-grid{grid-template-columns:1fr 1fr}.filter-grid .search-field{grid-column:1/-1}.kpi{padding:14px}.customer-box{grid-template-columns:1fr}.order-footer{grid-template-columns:1fr}.order-total{text-align:left}.page-heading .action-row{width:100%}.page-heading .action-row>*{flex:1;text-align:center}}
        @media(max-width:390px){.kpi-grid{gap:9px}.kpi{padding:11px}.kpi-icon{width:35px;height:35px;font-size:16px}.kpi-value{font-size:19px}.filter-grid{grid-template-columns:1fr}.filter-grid .search-field{grid-column:auto}.order-card{padding:14px}.order-card-top{flex-direction:column}.status-pill{align-self:flex-start}}

        .admin-shell{min-height:100vh;background:#f5f7f2;padding:28px 16px 60px;color:#203126}
        .admin-wrap{max-width:1180px;margin:0 auto}
        .admin-top{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:24px}
        .admin-top h1{font-size:clamp(25px,4vw,36px);margin:0 0 5px}
        .muted{color:#657267;margin:0}
        .panel{background:#fff;border:1px solid #e1e8dd;border-radius:18px;padding:22px;box-shadow:0 8px 28px #183e2410}
        .login-panel{max-width:440px;margin:8vh auto}
        label{display:block;font-weight:700;margin:14px 0 7px}
        input,select{width:100%;min-height:44px;border:1px solid #ccd7ca;border-radius:9px;padding:9px 12px;background:#fff;color:#203126}
        button{border:0;border-radius:9px;padding:11px 15px;background:#1f5b3b;color:#fff;font-weight:700;cursor:pointer}
        button:disabled{opacity:.6;cursor:wait}
        .secondary{background:#e8f0e6;color:#1f5b3b}
        .message{padding:12px 14px;border-radius:10px;background:#edf4e9;margin:14px 0;overflow-wrap:anywhere}
        .toolbar{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:16px}
        .toolbar select{max-width:280px}
        .order-list{display:grid;gap:14px}
        .order{border:1px solid #e2e8df;border-radius:14px;padding:18px;display:grid;grid-template-columns:minmax(0,1fr) minmax(200px,260px);gap:20px}
        .order h2{font-size:18px;margin:0 0 8px;overflow-wrap:anywhere}
        .detail{margin:5px 0;color:#4b5a4e;overflow-wrap:anywhere}
        .items{margin:10px 0;padding-left:20px}
        .total{font-size:19px;font-weight:800;color:#1f5b3b}
        .empty{text-align:center;padding:38px 12px;color:#657267}
        @media(max-width:700px){.order{grid-template-columns:1fr}.panel{padding:15px}.admin-shell{padding:16px 10px 40px}}
        .admin-shell{background:linear-gradient(180deg,#f7f8f4 0%,#eef2eb 100%)}
        .admin-top{padding:18px 20px;background:#fff;border:1px solid #e5eadf;border-radius:18px;box-shadow:0 8px 24px #183e2409}
        .admin-top h1{font-weight:800;letter-spacing:-.6px;color:#183b29}
        .order{align-items:start;transition:border-color .2s,box-shadow .2s}
        .order:hover{border-color:#b9cbb6;box-shadow:0 8px 22px #183e240d}
        .order select{min-width:0}
        .items li{margin:6px 0;line-height:1.55}
        .login-panel{box-shadow:0 18px 48px #183e2412}
        @media(max-width:700px){
          .admin-top{padding:15px;align-items:flex-start}
          .admin-top>div:last-child{width:100%}
          .admin-top>div:last-child>*{flex:1 1 auto}
          .order{padding:14px;gap:12px}
          .toolbar{align-items:stretch}
          .toolbar select{max-width:none;width:100%}
          .admin-shell{padding-bottom:32px}
        }
      `}</style>
      <div className="admin-wrap">
        {!authenticated ? (
          <section className="panel login-panel">
            <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap"><p className="muted mb-0">Gaav2Ghar • {t("सुरक्षित Admin")}</p><LanguageSwitcher /></div>
            <h1>Admin Login</h1>
            <p className="muted">{t("ऑर्डर्स पाहण्यासाठी Admin password टाका.")}</p>
            {message && <p className="message" role="status">{message}</p>}
            <form onSubmit={login}>
              <label htmlFor="admin-password">{t("Admin Password")}</label>
              <input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required maxLength={200} />
              <button style={{ width: "100%", marginTop: 16 }} disabled={loading}>{loading ? t("कृपया थांबा...") : t("Login करा")}</button>
            </form>
            <p className="muted" style={{ fontSize: 12, marginTop: 18 }}>{t("पासवर्ड विसरल्यास Vercel Environment Variables मध्ये ADMIN_PASSWORD तपासा.")}</p>
          </section>
        ) : (
          <>
            <aside className={"sidebar " + (sidebarOpen ? "show" : "")}>
              <div className="brand"><span className="brand-mark">🌾</span><span>Gaav2Ghar</span></div>
              <div className="menu-label">Main Menu</div>
              <a className="side-link" href="/admin">▦ <span>Dashboard</span></a>
              <a className="side-link active" href="/admin">▤ <span>Order Management</span></a>
              <a className="side-link" href="/admin/products">▣ <span>Products &amp; Pricing</span></a>
              <a className="side-link" href="/admin">♙ <span>Customers</span></a>
              <a className="side-link" href="/admin">↗ <span>Sales Analytics</span></a>
              <div className="side-spacer"/>
              <div className="menu-label">Account</div>
              <button className="side-link" onClick={() => void logout()} style={{background:"transparent",border:0,textAlign:"left"}}>⇥ <span>Logout</span></button>
            </aside>
            <button aria-label="Close navigation" className={"sidebar-overlay " + (sidebarOpen ? "show" : "")} onClick={() => setSidebarOpen(false)} />
            <div className="main-content">
              <header className="top-header">
                <div className="header-left"><button className="icon-button" aria-label="Toggle menu" onClick={() => setSidebarOpen((open) => !open)}>☰</button><span style={{fontWeight:700,color:"#536456"}}>Order Management</span></div>
                <div className="header-actions"><LanguageSwitcher /><button className="icon-button" aria-label="Refresh orders" title="Refresh" onClick={() => void loadOrders()} disabled={loading}>↻</button><div className="profile"><span className="avatar">A</span><span className="profile-copy"><strong style={{display:"block",fontSize:12}}>Admin Manager</strong><small style={{color:"#89938a"}}>Gaav2Ghar Hub</small></span></div></div>
              </header>
              <main className="content">
                <div className="page-heading">
                  <div><p className="muted" style={{fontSize:11,fontWeight:800,letterSpacing:".12em",textTransform:"uppercase"}}>Gaav2Ghar / Admin</p><h1>Customer Orders</h1><p className="muted" style={{fontSize:13}}>Review customer orders, update delivery status and generate invoices.</p></div>
                  <div className="action-row"><button className="btn-soft" onClick={() => void loadOrders()} disabled={loading}>↻ Refresh</button><a className="btn-brand" href="/admin/products">＋ Manage Products</a></div>
                </div>
                <section className="kpi-grid" aria-label="Order metrics">
                  <article className="kpi"><div><div className="kpi-label">Total Order Value</div><div className="kpi-value">{money(revenue)}</div><div className="kpi-note">Based on loaded orders</div></div><span className="kpi-icon">₹</span></article>
                  <article className="kpi"><div><div className="kpi-label">Pending Confirmation</div><div className="kpi-value">{pendingCount}</div><div className="kpi-note">Requires action</div></div><span className="kpi-icon" style={{background:"#fff4dc",color:"#a9780b"}}>◷</span></article>
                  <article className="kpi"><div><div className="kpi-label">Delivered Orders</div><div className="kpi-value">{deliveredCount}</div><div className="kpi-note">Completed orders</div></div><span className="kpi-icon" style={{background:"#e8f1ff",color:"#3569a8"}}>✓</span></article>
                  <article className="kpi"><div><div className="kpi-label">Produce Ordered</div><div className="kpi-value">{totalKg.toLocaleString("en-IN")} kg</div><div className="kpi-note">Grains &amp; pulses</div></div><span className="kpi-icon" style={{background:"#e7f5f4",color:"#167b79"}}>▤</span></article>
                </section>
                <section className="panel"><div className="filter-grid">
                  <input className="field search-field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Order ID, customer name or mobile..." aria-label="Search orders"/>
                  <select className="field" aria-label="Filter by status" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All Order Statuses</option>{statuses.map(([value,label])=><option key={value} value={value}>{t(label)}</option>)}</select>
                  <input className="field" type="date" aria-label="Filter by order date" value={dateFilter} onChange={(event)=>setDateFilter(event.target.value)}/>
                  <button className="btn-soft" onClick={()=>{setSearch("");setFilter("all");setDateFilter("");}}>Clear Filters</button>
                </div></section>
                {message && <p className="message" role="status">{message}</p>}
                <div className="orders-heading"><div><h2 style={{fontSize:19,fontWeight:850,margin:0,color:"#203b29"}}>Orders</h2><p className="muted" style={{fontSize:12}}>{filtered.length} of {orders.length} orders</p></div><span className="muted" style={{fontSize:12}}>Latest orders first</span></div>
                <section className="orders-grid">
                  {loading && orders.length===0 ? <p className="empty">Loading orders...</p> : filtered.length===0 ? <p className="empty">No orders match these filters.</p> : filtered.map((order)=>(
                    <article className="order-card" key={order.orderId}>
                      <div className="order-card-top"><div><div className="order-id">{order.orderId}</div><div className="order-meta">Order date: {date(order.createdAt)}</div></div><span className={"status-pill " + (order.status || "pending_confirmation")}>{statuses.find(([value])=>value===(order.status || "pending_confirmation"))?.[1] || order.status || "Pending"}</span></div>
                      <div className="customer-box"><div className="customer-detail"><strong>Customer:</strong> {order.customer?.name || "—"}</div><div className="customer-detail"><strong>Mobile:</strong> {order.customer?.phone || "—"}</div><div className="customer-detail" style={{gridColumn:"1/-1"}}><strong>Address:</strong> {order.customer?.address || "—"}</div><div className="customer-detail"><strong>PIN Code:</strong> {order.customer?.pinCode || "—"}</div></div>
                      <div><div style={{fontSize:11,fontWeight:800,color:"#4d5e50",marginBottom:8}}>Items Ordered ({(order.items||[]).length})</div><div className="item-list">{(order.items||[]).map((item,index)=><div className="item-row" key={index}><strong>{item.product || "Grain"} — {item.variety || "—"}</strong><span>{item.quantityKg || Number(item.bagSizeKg)*Number(item.bags) || 0} kg</span></div>)}</div></div>
                      <div className="order-footer"><div><button type="button" className="btn-soft" style={{width:"100%",marginBottom:10}} onClick={()=>printInvoice(order)}>▤ Print Bill</button><label htmlFor={"status-"+order.orderId}>Update Order Status</label><select className="field" id={"status-"+order.orderId} value={order.status || "pending_confirmation"} onChange={(event)=>void updateStatus(order.orderId,event.target.value)}>{statuses.map(([value,label])=><option key={value} value={value}>{t(label)}</option>)}</select></div><div className="order-total">{money(order.total)}<div className="order-meta">Payment: {order.paymentMethod || "COD"}</div></div></div>
                    </article>
                  ))}
                </section>
              </main>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
