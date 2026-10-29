"use client";

import { useEffect, useMemo, useState } from "react";
import LanguageSwitcher, { useAppLanguage } from "./components/LanguageSwitcher";

type Product = {
  id: string;
  name: string;
  english: string;
  varieties: string[];
  pricePerKg: number;
  note: string;
  emoji: string;
};

const defaultProducts: Product[] = [
  { id: "wheat", name: "गहू", english: "Wheat", varieties: ["लोकवन", "शरबती", "बन्सी"], pricePerKg: 42, note: "दैनंदिन पोळ्यांसाठी", emoji: "🌾" },
  { id: "jowar", name: "ज्वारी", english: "Jowar", varieties: ["पांढरी ज्वारी", "मालदांडी"], pricePerKg: 48, note: "पारंपरिक आणि पौष्टिक", emoji: "🌱" },
];

const bagSizes = [5, 25, 50, 100];

// Use real repository assets for available grain photos. Rice and moong photos can be added later.
function productImage(product: Product) {
  const key = (product.id + " " + product.name + " " + product.english).toLowerCase();
  if (/onion|kanda|कांद/.test(key)) return "/onion.png";
  if (/bajra|bajari|bajri|बाजरी/.test(key)) return "/bajra.png";
  if (/jowar|jawar|ज्वारी/.test(key)) return "/jowar.png";
  if (/wheat|gahu|गहू/.test(key)) return "/wheat.png";
  if (/moong|mung|मुग/.test(key)) return "/moong.png";
  if (/rice|tandul|तांदूळ/.test(key)) return "/rice.png";
  if (/chickpea|harbhara|हरभरा/.test(key)) return "/harbhara.png";
  return "/gaav2ghar-logo.png";
}

type BasketItem = { key: string; product: Product; variety: string; bagSize: number; bags: number };

export default function Home() {
  const { language, t } = useAppLanguage();
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  useEffect(() => {
    let active = true;
    fetch("/api/products", { cache: "no-store" }).then(async (response) => {
      const data = await response.json();
      if (response.ok && active && Array.isArray(data.products) && data.products.length) setProducts(data.products);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  const [selected, setSelected] = useState<Record<string, string>>({ wheat: "लोकवन", jowar: "पांढरी ज्वारी" });
  const [sizes, setSizes] = useState<Record<string, number>>({ wheat: 5, jowar: 5 });
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [notice, setNotice] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [sending, setSending] = useState(false);

  const totalKg = useMemo(() => basket.reduce((sum, item) => sum + item.bagSize * item.bags, 0), [basket]);
  const subtotal = useMemo(() => basket.reduce((sum, item) => sum + item.bagSize * item.bags * item.product.pricePerKg, 0), [basket]);
  const delivery = subtotal >= 1500 || subtotal === 0 ? 0 : 60;
  const total = subtotal + delivery;

  function addToBasket(product: Product) {
    const variety = selected[product.id] || product.varieties[0];
    const bagSize = sizes[product.id] || 5;
    const key = product.id + "|" + variety + "|" + bagSize;
    setBasket((old) => {
      const found = old.find((item) => item.key === key);
      if (found) return old.map((item) => item.key === key ? { ...item, bags: item.bags + 1 } : item);
      return [...old, { key, product, variety, bagSize, bags: 1 }];
    });
    setNotice((language === "en" ? product.english : language === "hi" ? t(product.name) : product.name) + " " + t("बास्केटमध्ये जोडले!"));
  }

  function changeBags(key: string, delta: number) {
    setBasket((old) => old.map((item) => item.key === key ? { ...item, bags: item.bags + delta } : item).filter((item) => item.bags > 0));
  }

  async function placeOrder() {
    if (!customer.name.trim() || !/^[6-9]\d{9}$/.test(customer.phone) || !customer.address.trim() || basket.length === 0) {
      setNotice(t("कृपया नाव, योग्य 10 अंकी मोबाईल नंबर, पत्ता आणि बास्केट तपासा."));
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          items: basket.map((item) => ({ productId: item.product.id, product: item.product.name, variety: item.variety, bagSizeKg: item.bagSize, bags: item.bags, quantityKg: item.bagSize * item.bags, pricePerKg: item.product.pricePerKg })),
          subtotal, deliveryCharge: delivery, total, paymentMethod: "COD"
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ऑर्डर नोंदवता आली नाही.");
      setNotice(t("धन्यवाद! ऑर्डर नोंदवली. ऑर्डर क्रमांक: ") + data.orderId + t(". फोनवरून पुष्टी केली जाईल."));
      setBasket([]);
      setCheckoutOpen(false);
      setCustomer({ name: "", phone: "", address: "" });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा."));
    } finally {
      setSending(false);
    }
  }

  return (
    <main id="home" className="app-shell">
      <div className="topbar"><div className="container topbar-inner"><span>🌿 {t("शेतकऱ्यांकडून तुमच्या घरापर्यंत")}</span><span>📞 {t("ऑर्डरनंतर फोनवर पुष्टी")}</span></div></div>
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="#" aria-label="Gaav2Ghar home"><img className="brand-logo" src="/logo.png" alt="Gaav2Ghar logo" /></a>
          <nav className="header-actions" aria-label={t("मुख्य नेव्हिगेशन")}>
            <LanguageSwitcher />
            <a className="basket-link header-icon-only" href="#basket" aria-label={t("बास्केट उघडा")} title={t("बास्केट उघडा")}>
              <svg className="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 10 2 10h14l2-10H3Z"/><path d="m8 10 4-7 4 7M8 13l1 4m7-4-1 4M12 13v4"/></svg>
              <b className="cart-count">{basket.reduce((n, item) => n + item.bags, 0)}</b>
            </a>
            <a className="basket-link header-icon-only" href="/track" aria-label={t("तुमची ऑर्डर ट्रॅक करा")} title={t("तुमची ऑर्डर ट्रॅक करा")}>
              <svg className="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z"/><path d="m3.5 7.7 8.5 4.4 8.5-4.4M12 12v9"/></svg>
            </a>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy"><span className="eyebrow">{t("मातीचा सुगंध • विश्वासाची चव")}</span><h1>{t("गावाकडचे धान्य,")}<br /><em>{t("आता तुमच्या घरी.")}</em></h1><p>{t("निवडक धान्य, पारंपरिक वाण आणि सोपी घरपोच ऑर्डर. तुमच्या कुटुंबासाठी योग्य धान्य निवडा.")}</p><a className="primary-button" href="#products">{t("धान्य निवडा")} <span>↓</span></a><div className="trust-row"><span>✓ {t("सोपी ऑर्डर")}</span><span>✓ {t("स्पष्ट किंमत")}</span><span>✓ {t("फोनवर पुष्टी")}</span></div></div>
          <div className="hero-art"><div className="sun"></div><div className="hero-emoji">🌾</div><div className="grain-badge"><strong>{t("थेट गावातून")}</strong><span>{t("घरापर्यंत काळजीपूर्वक")}</span></div></div>
        </div>
      </section>

      <section className="benefits"><div className="container benefit-grid"><div><span>🌱</span><p><strong>{t("निवडक धान्य")}</strong><small>{t("विविध पारंपरिक वाण")}</small></p></div><div><span>⚖️</span><p><strong>{t("तुमच्या गरजेनुसार")}</strong><small>5–100 {t("किलो")} pack</small></p></div><div><span>🏡</span><p><strong>{t("घरपोच सेवा")}</strong><small>{t("पत्त्यानुसार पुष्टी")}</small></p></div></div></section>

      <section className="section container" id="products"><div className="section-heading"><div><span className="eyebrow">{t("आमची निवड")}</span><h2>{t("घरासाठी चांगले धान्य")}</h2><p>{t("वाण आणि बॅगचे वजन निवडा, मग बास्केटमध्ये जोडा.")}</p></div><span className="product-count">{products.length} {t("उत्पादने")}</span></div>
        <div className="product-grid">{products.map((product) => <article className="product-card" key={product.id}><div className={"product-visual visual-" + product.id}><img className="product-photo" src={productImage(product)} alt={product.english + " grain"} loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; const fallback = event.currentTarget.parentElement?.querySelector(".product-emoji-fallback") as HTMLElement | null; if (fallback) fallback.style.display = "block"; }} /><span className="product-emoji product-emoji-fallback">{product.emoji}</span><span className="quality-tag">{t("निवडक धान्य")}</span></div><div className="product-content"><div className="product-title"><div><h3>{language === "en" ? product.english : language === "hi" ? t(product.name) : product.name}</h3><span>{product.english}</span></div><div className="price">{product.pricePerKg > 0 ? <><strong>₹{product.pricePerKg}</strong><small>/ किलो</small></> : <small>{t("किंमत निश्चित करायची")}</small>}</div></div><p className="product-note">{t(product.note)}</p><label htmlFor={"variety-" + product.id}>{t("वाण निवडा")}</label><select id={"variety-" + product.id} value={selected[product.id]} onChange={(e) => setSelected({ ...selected, [product.id]: e.target.value })}>{product.varieties.map((variety) => <option key={variety}>{variety}</option>)}</select><label htmlFor={"size-" + product.id}>{t("बॅगचे वजन")}</label><select id={"size-" + product.id} value={sizes[product.id]} onChange={(e) => setSizes({ ...sizes, [product.id]: Number(e.target.value) })}>{bagSizes.map((size) => <option key={size} value={size}>{size} {t("किलो")}</option>)}</select><div className="card-footer"><span>{product.pricePerKg > 0 ? <>₹{product.pricePerKg * (sizes[product.id] || 5)} <small>/ बॅग</small></> : <small>{t("किंमत लवकरच")}</small>}</span><button className="add-button" disabled={product.pricePerKg <= 0} onClick={() => addToBasket(product)}>{product.pricePerKg > 0 ? "＋ जोडा"  : t("किंमत बाकी")}</button></div></div></article>)}</div>
      </section>

      <section className="basket-section" id="basket"><div className="container basket-layout"><div><span className="eyebrow">{t("तुमची खरेदी")}</span><h2>{t("तुमची बास्केट")}</h2><p className="muted">{t("बॅगची संख्या + / − करून बदलू शकता.")}</p>{basket.length === 0 ? <div className="empty-basket"><span>🧺</span><strong>{t("तुमची बास्केट रिकामी आहे")}</strong><p>{t("आवडते धान्य निवडून बास्केटमध्ये जोडा.")}</p><a href="#products">{t("धान्य पाहा")} →</a></div> : <div className="basket-items">{basket.map((item) => <div className="basket-item" key={item.key}><div className="mini-grain">{item.product.emoji}</div><div className="basket-item-info"><strong>{language === "en" ? item.product.english : language === "hi" ? t(item.product.name) : item.product.name} — {item.variety}</strong><small>{item.bagSize} किलो बॅग · ₹{item.product.pricePerKg}/किलो</small><b>₹{item.bagSize * item.bags * item.product.pricePerKg}</b></div><div className="stepper"><button aria-label={t("कमी करा")} onClick={() => changeBags(item.key, -1)}>−</button><span>{item.bags}</span><button aria-label={t("वाढवा")} onClick={() => changeBags(item.key, 1)}>＋</button></div></div>)}</div>}</div>
        <aside className="summary-card"><h3>{t("ऑर्डरचा तपशील")}</h3><div className="summary-line"><span>{t("एकूण वजन")}</span><strong>{totalKg} किलो</strong></div><div className="summary-line"><span>{t("धान्याची किंमत")}</span><strong>₹{subtotal.toLocaleString("en-IN")}</strong></div><div className="summary-line"><span>{t("डिलिव्हरी")}</span><strong>{delivery === 0 ? "₹0" : "₹" + delivery}</strong></div><div className="summary-line total-line"><span>{t("एकूण रक्कम")}</span><strong>₹{total.toLocaleString("en-IN")}</strong></div><p className="summary-note">{t("₹1,500 किंवा अधिक खरेदीवर अंदाजित मोफत डिलिव्हरी. अंतिम शुल्क फोनवर कळवले जाईल.")}</p><button className="primary-button full-button" disabled={!basket.length} onClick={() => setCheckoutOpen(!checkoutOpen)}>{checkoutOpen ? t("फॉर्म बंद करा") : t("ऑर्डर पुढे न्या")} →</button>
          {checkoutOpen && <div className="checkout-form"><label htmlFor="customer-name">{t("तुमचे नाव")}</label><input id="customer-name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder={t("पूर्ण नाव")} /><label htmlFor="customer-phone">{t("मोबाईल नंबर")}</label><input id="customer-phone" inputMode="numeric" maxLength={10} value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder={t("10 अंकी नंबर")} /><label htmlFor="customer-address">{t("पूर्ण पत्ता")}</label><textarea id="customer-address" rows={3} value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} placeholder={t("घर क्रमांक, परिसर, शहर, पिनकोड")} /><p className="cod-note">{t("पेमेंट: घरपोच मिळाल्यावर (COD). ऑर्डरनंतर फोनवर पुष्टी केली जाईल.")}</p><button className="primary-button full-button" disabled={sending} onClick={placeOrder}>{sending ? t("ऑर्डर नोंदवत आहे...") : t("ऑर्डर निश्चित करा")}</button></div>}
        </aside></div></section>
      <footer className="footer" id="contact">
        <div className="container footer-grid">
          <section className="footer-about">
            <a className="footer-wordmark" href="#home" aria-label="Gaav2Ghar home">🌾 Gaav2Ghar</a>
            <p>{t("शेतकरी आणि तुमच्या स्वयंपाकघरातील विश्वासाचा दुवा.")}</p>
            <span className="footer-trust">🌱 {t("गावाकडून घरापर्यंत विश्वासाने")}</span>
          </section>
          <section className="footer-column">
            <h3>{t("ग्राहकांसाठी")}</h3>
            <a href="#products">{t("धान्य आणि किंमती")}</a>
            <a href="#basket">{t("ऑर्डर कशी करावी")}</a>
            <a href="/track">{t("ऑर्डर ट्रॅक करा")}</a>
            <a href="#contact-help">{t("मदत आणि संपर्क")}</a>
          </section>
          <section className="footer-column">
            <h3>{t("ऑर्डर मदत")}</h3>
            <p>{t("ऑर्डर दिल्यानंतर आमची टीम फोनवर पुष्टी करेल.")}</p>
            <p>{t("डिलिव्हरी शुल्क आणि उपलब्धता पत्त्यानुसार कळवली जाईल.")}</p>
            <a href="#basket">{t("ऑर्डरविषयी प्रश्न? बास्केटकडे जा")} →</a>
          </section>
          <section className="footer-column footer-contact" id="contact-help">
            <h3>{t("आमच्याशी संपर्क करा")}</h3>
            <p className="footer-contact-item"><span aria-hidden="true">📞</span><span><strong>{t("हेल्पलाइन")}</strong><small>{process.env.NEXT_PUBLIC_SUPPORT_PHONE || t("नंबर लवकरच अपडेट होईल")}</small></span></p>
            {process.env.NEXT_PUBLIC_SUPPORT_PHONE ? <a className="footer-contact-action" href={`tel:${process.env.NEXT_PUBLIC_SUPPORT_PHONE.replace(/[^+\\d]/g, "")}`}>{t("आता कॉल करा")} ↗</a> : null}
            <p className="footer-contact-item"><span aria-hidden="true">✉️</span><span><strong>{t("ईमेल सपोर्ट")}</strong><small>{process.env.NEXT_PUBLIC_SUPPORT_EMAIL || t("ईमेल लवकरच अपडेट होईल")}</small></span></p>
            {process.env.NEXT_PUBLIC_SUPPORT_EMAIL ? <a className="footer-contact-action" href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`}>{t("ईमेल पाठवा")} ↗</a> : null}
            <a className="footer-help-link" href="/track">📦 {t("ऑर्डर ट्रॅकिंग / ऑर्डरची मदत")}</a>
          </section>
        </div>
        <div className="container footer-bottom"><small>© {new Date().getFullYear()} Gaav2Ghar. {t("सर्व हक्क राखीव.")}</small><div><a href="#home">{t("होम")}</a><a href="#products">{t("धान्य")}</a><a href="/track">{t("ऑर्डर ट्रॅकिंग")}</a></div></div>
      </footer>
      <nav className="mobile-bottom-nav" aria-label="मुख्य नेव्हिगेशन">
        <a className="mobile-nav-item active" href="#home"><span>⌂</span><small>{t("होम")}</small></a>
        <a className="mobile-nav-item" href="#products"><span>🌾</span><small>{t("धान्य")}</small></a>
        <a className="mobile-nav-item" href="#basket"><span>🧺</span><small>{t("बास्केट")}{basket.length ? " (" + basket.reduce((n, item) => n + item.bags, 0) + ")" : ""}</small></a>
      </nav>
      {basket.length > 0 && <div className="mobile-cart-dock">
        <div className="mobile-cart-copy"><strong>₹{total.toLocaleString("en-IN")}</strong><small>{totalKg} किलो · {basket.reduce((n, item) => n + item.bags, 0)} बॅग</small></div>
        <a className="mobile-cart-button" href="#basket">{t("बास्केट पाहा")} <span>→</span></a>
      </div>}
      {notice && <div className="toast" role="status"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="बंद करा">×</button></div>}
    </main>
  );
}
