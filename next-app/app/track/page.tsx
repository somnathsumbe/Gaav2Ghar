"use client";

import { useState } from "react";

type TrackedOrder = {
  orderId: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  total?: number;
  items?: Array<{ product?: string; variety?: string; quantityKg?: number; bagSizeKg?: number; bags?: number }>;
};
const statusLabels: Record<string, string> = {
  pending_confirmation: "ऑर्डरची पुष्टी बाकी",
  confirmed: "ऑर्डर निश्चित झाली",
  packed: "ऑर्डर पॅक केली",
  out_for_delivery: "ऑर्डर डिलिव्हरीसाठी निघाली",
  delivered: "ऑर्डर डिलिव्हर झाली",
  cancelled: "ऑर्डर रद्द झाली",
};
const steps = ["pending_confirmation", "confirmed", "packed", "out_for_delivery", "delivered"];

export default function TrackPage() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function track(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setOrder(null);
    try {
      const params = new URLSearchParams({ orderId: orderId.trim().toUpperCase(), phone });
      const response = await fetch("/api/orders/track?" + params.toString(), { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Tracking माहिती मिळाली नाही.");
      setOrder(data.order);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tracking माहिती मिळाली नाही.");
    } finally {
      setLoading(false);
    }
  }

  const currentStep = order?.status ? steps.indexOf(order.status) : -1;

  return (
    <main style={{ minHeight: "100vh", background: "#faf8f1", padding: "28px 16px 60px", color: "#202820" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <a href="/" style={{ color: "#1f5b3b", fontWeight: 700 }}>← Gaav2Ghar Home</a>
        <section style={{ marginTop: 24, background: "#fff", border: "1px solid #e5e7dc", borderRadius: 18, padding: 24 }}>
          <p style={{ color: "#647164", marginBottom: 4 }}>Gaav2Ghar • Order Tracking</p>
          <h1 style={{ marginTop: 0 }}>तुमची ऑर्डर कुठपर्यंत आली?</h1>
          <p>ऑर्डरची पुष्टी झाल्यानंतर मिळालेला order ID आणि ऑर्डर देताना वापरलेला मोबाईल नंबर टाका.</p>
          <form onSubmit={track}>
            <label htmlFor="track-order" style={{ display: "block", fontWeight: 700, marginTop: 14 }}>Order ID</label>
            <input id="track-order" value={orderId} onChange={(e) => setOrderId(e.target.value.toUpperCase())} placeholder="उदा. G2G-..." required maxLength={90} style={{ width: "100%", padding: 12, border: "1px solid #ccd7ca", borderRadius: 9 }} />
            <label htmlFor="track-phone" style={{ display: "block", fontWeight: 700, marginTop: 14 }}>नोंदणीकृत मोबाईल नंबर</label>
            <input id="track-phone" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10 अंकी नंबर" required style={{ width: "100%", padding: 12, border: "1px solid #ccd7ca", borderRadius: 9 }} />
            <button disabled={loading} style={{ marginTop: 16, width: "100%", border: 0, borderRadius: 9, padding: 13, background: "#1f5b3b", color: "#fff", fontWeight: 700 }}>{loading ? "तपासत आहे..." : "ऑर्डर तपासा"}</button>
          </form>
          {message && <p role="status" style={{ background: "#fff0ed", padding: 12, borderRadius: 8 }}>{message}</p>}
        </section>
        {order && (
          <section style={{ marginTop: 18, background: "#fff", border: "1px solid #e5e7dc", borderRadius: 18, padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>{order.orderId}</h2>
            <p><strong>सध्याची स्थिती:</strong> {statusLabels[order.status || ""] || order.status || "स्थिती उपलब्ध नाही"}</p>
            <p><strong>ऑर्डर तारीख:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : "—"}</p>
            {order.status === "cancelled" ? <p>ही ऑर्डर रद्द करण्यात आली आहे. अधिक माहितीसाठी आमच्याशी संपर्क साधा.</p> : (
              <div style={{ display: "grid", gap: 10, margin: "20px 0" }}>
                {steps.map((step, index) => {
                  const done = currentStep >= index;
                  return <div key={step} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 10, background: done ? "#eaf2e8" : "#f6f7f3", color: done ? "#1f5b3b" : "#7b847b" }}><span style={{ fontWeight: 800 }}>{done ? "✓" : index + 1}</span><strong>{statusLabels[step]}</strong></div>;
                })}
              </div>
            )}
            <h3>ऑर्डरमधील वस्तू</h3>
            {(order.items || []).map((item, index) => <p key={index}>{item.product || "धान्य"} — {item.variety || ""} · {item.quantityKg || (Number(item.bagSizeKg) * Number(item.bags)) || 0} किलो</p>)}
            <p style={{ fontSize: 20, fontWeight: 800, color: "#1f5b3b" }}>एकूण: ₹{Number(order.total || 0).toLocaleString("en-IN")}</p>
          </section>
        )}
      </div>
    </main>
  );
}
