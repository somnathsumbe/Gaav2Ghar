"use client";

import { useState } from "react";
import Link from "next/link";
import LanguageSwitcher, { useAppLanguage } from "../components/LanguageSwitcher";

type TrackedOrder = {
  orderId: string;
  status?: string;
  createdAt?: string;
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
  const { t } = useAppLanguage();
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function track(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!phone.trim() && !orderId.trim()) { setMessage("नोंदणीकृत मोबाईल नंबर किंवा ऑर्डर ID टाका."); return; }
    if (phone.trim() && !/^[6-9]\d{9}$/.test(phone.trim())) { setMessage("योग्य 10 अंकी मोबाईल नंबर टाका."); return; }
    setLoading(true);
    setMessage("");
    setOrders([]);
    try {
      const params = new URLSearchParams();
      if (phone.trim()) params.set("phone", phone.trim());
      if (orderId.trim()) params.set("orderId", orderId.trim().toUpperCase());
      const response = await fetch("/api/orders/track?" + params.toString(), { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Tracking माहिती मिळाली नाही.");
      setOrders(data.orders || (data.order ? [data.order] : []));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tracking माहिती मिळाली नाही.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#faf8f1", padding: "28px 16px 60px", color: "#202820" }}>
      <div className="container" style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3"><Link href="/" style={{ color: "#1f5b3b", fontWeight: 700 }}>← Gaav2Ghar Home</Link><LanguageSwitcher /></div>
        <section style={{ marginTop: 24, background: "#fff", border: "1px solid #e5e7dc", borderRadius: 18, padding: 24 }}>
          <p style={{ color: "#647164", marginBottom: 4 }}>Gaav2Ghar • {t("Order Tracking")}</p>
          <h1 style={{ marginTop: 0 }}>{t("तुमची ऑर्डर कुठपर्यंत आली?")}</h1>
          <p>{t("नोंदणीकृत मोबाईल नंबर टाकल्यास सुरू असलेल्या सर्व ऑर्डर दिसतील. ऑर्डर ID टाकल्यास त्या ऑर्डरची स्थिती दिसेल.")}</p>
          <form onSubmit={track}>
            <label htmlFor="track-phone" style={{ display: "block", fontWeight: 700, marginTop: 14 }}>{t("नोंदणीकृत मोबाईल नंबर")}</label>
            <input id="track-phone" inputMode="numeric" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder={t("10 अंकी मोबाईल नंबर टाका")} maxLength={10} style={{ width: "100%", padding: 12, border: "1px solid #ccd7ca", borderRadius: 9 }} />
            <label htmlFor="track-order" style={{ display: "block", fontWeight: 700, marginTop: 14 }}>{t("ऑर्डर ID")}</label>
            <input id="track-order" value={orderId} onChange={(e) => setOrderId(e.target.value.toUpperCase())} placeholder={t("ऑर्डर ID टाका")} maxLength={90} style={{ width: "100%", padding: 12, border: "1px solid #ccd7ca", borderRadius: 9 }} />
            <button disabled={loading} style={{ marginTop: 16, width: "100%", border: 0, borderRadius: 9, padding: 13, background: "#1f5b3b", color: "#fff", fontWeight: 700 }}>{loading ? t("तपासत आहे...") : t("ऑर्डर तपासा")}</button>
          </form>
          {message && <p role="status" style={{ background: "#fff0ed", padding: 12, borderRadius: 8, marginTop: 14 }}>{message}</p>}
        </section>
        {orders.length > 0 && <p style={{ marginTop: 18, fontWeight: 700, color: "#1f5b3b" }}>{t("सुरू असलेल्या ऑर्डर्स")}: {orders.length}</p>}
        {orders.map((order) => {
          const currentStep = order.status ? steps.indexOf(order.status) : -1;
          return <section key={order.orderId} style={{ marginTop: 18, background: "#fff", border: "1px solid #e5e7dc", borderRadius: 18, padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>{order.orderId}</h2>
            <p><strong>{t("सध्याची स्थिती:")}</strong> {t(statusLabels[order.status || ""] || order.status || "स्थिती उपलब्ध नाही")}</p>
            <p><strong>{t("ऑर्डर तारीख:")}</strong> {order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : "—"}</p>
            {order.status === "cancelled" ? <p>{t("ही ऑर्डर रद्द करण्यात आली आहे. अधिक माहितीसाठी आमच्याशी संपर्क साधा.")}</p> : <div style={{ display: "grid", gap: 10, margin: "20px 0" }}>
              {steps.map((step, index) => {
                const done = currentStep >= index;
                return <div key={step} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 10, background: done ? "#eaf2e8" : "#f6f7f3", color: done ? "#1f5b3b" : "#7b847b" }}><span style={{ fontWeight: 800 }}>{done ? "✓" : index + 1}</span><strong>{t(statusLabels[step])}</strong></div>;
              })}
            </div>}
          </section>;
        })}
      </div>
    </main>
  );
}
