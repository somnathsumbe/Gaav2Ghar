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

  const filtered = orders.filter((order) => filter === "all" || (order.status || "pending_confirmation") === filter);

  return (
    <main className="admin-shell container-fluid">
      <style jsx>{`
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
            <header className="admin-top">
              <div><p className="muted">Gaav2Ghar • {t("Order Management")}</p><h1>{t("ऑर्डर व्यवस्थापन")}</h1><p className="muted">{t("शेवटच्या 200 ऑर्डर्स")} • {orders.length} {t("ऑर्डर्स")}</p></div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><LanguageSwitcher /><a href="/admin/products" className="secondary" style={{ display: "inline-flex", alignItems: "center", borderRadius: 9, padding: "11px 15px", fontWeight: 700 }}>{t("उत्पादने व किंमत")}</a><button className="btn btn-outline-success" onClick={() => void loadOrders()} disabled={loading}>↻ Refresh</button><button className="btn btn-danger" onClick={() => void logout()}>Logout</button></div>
            </header>
            {message && <p className="message" role="status">{message}</p>}
            <section className="panel card shadow-sm border-0">
              <div className="toolbar"><h2 style={{ margin: 0 }}>{t("Customer Orders")}</h2><select aria-label="Status filter" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">{t("सर्व ऑर्डर्स")}</option>{statuses.map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}</select></div>
              {loading && orders.length === 0 ? <p className="empty">{t("ऑर्डर्स लोड होत आहेत...")}</p> : filtered.length === 0 ? <p className="empty">{t("या filter मध्ये ऑर्डर्स नाहीत.")}</p> : (
                <div className="order-list">
                  {filtered.map((order) => (
                    <article className="order" key={order.orderId}>
                      <div>
                        <h2>{order.orderId}</h2>
                        <p className="detail"><strong>{t("ग्राहक:")}</strong> {order.customer?.name || "—"}</p>
                        <p className="detail"><strong>मोबाईल:</strong> {order.customer?.phone || "—"}</p>
                        <p className="detail"><strong>{t("पत्ता:")}</strong> {order.customer?.address || "—"}</p>
                        <p className="detail"><strong>PIN Code:</strong> {order.customer?.pinCode || "—"}</p>
                        <p className="detail"><strong>{t("ऑर्डर वेळ:")}</strong> {date(order.createdAt)}</p>
                        <ul className="items">{(order.items || []).map((item, index) => <li key={index}>{item.product || "धान्य"} — {item.variety || "—"}; {item.bagSizeKg || 0} किलो × {item.bags || 0} बॅग = {item.quantityKg || (Number(item.bagSizeKg) * Number(item.bags)) || 0} किलो</li>)}</ul>
                        <p className="detail">Payment: {order.paymentMethod || "COD"} • Delivery: {money(order.deliveryCharge)}</p>
                        <p className="total">एकूण: {money(order.total)}</p>
                      </div>
                      <div>
                        <button type="button" className="secondary" style={{ width: "100%", marginBottom: 12 }} onClick={() => printInvoice(order)}>🧾 Generate / Print Bill</button>
                        <label htmlFor={"status-" + order.orderId}>Order Status / {t("सध्याची स्थिती:")}</label>
                        <select id={"status-" + order.orderId} value={order.status || "pending_confirmation"} onChange={(event) => void updateStatus(order.orderId, event.target.value)}>{statuses.map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}</select>
                        <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>Status बदलल्यावर database मध्ये save होईल.</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
