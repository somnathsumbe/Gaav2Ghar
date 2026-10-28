"use client";

import { useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  english: string;
  varieties: string[];
  pricePerKg: number;
  note: string;
  emoji: string;
};

const products: Product[] = [
  { id: "wheat", name: "गहू", english: "Wheat", varieties: ["लोकवन", "शरबती", "बन्सी"], pricePerKg: 42, note: "दैनंदिन पोळ्यांसाठी", emoji: "🌾" },
  { id: "rice", name: "तांदूळ", english: "Rice", varieties: ["इंद्रायणी", "कोलम", "आंबेमोहोर"], pricePerKg: 58, note: "घरच्या जेवणाची चव", emoji: "🍚" },
  { id: "jowar", name: "ज्वारी", english: "Jowar", varieties: ["पांढरी ज्वारी", "मालदांडी"], pricePerKg: 48, note: "पारंपरिक आणि पौष्टिक", emoji: "🌱" },
  { id: "toor-dal", name: "तूर डाळ", english: "Toor Dal", varieties: ["निवडक तूर डाळ"], pricePerKg: 125, note: "निवडक दर्जा", emoji: "🫘" },
];

const bagSizes = [5, 25, 50, 100];

type BasketItem = { key: string; product: Product; variety: string; bagSize: number; bags: number };

export default function Home() {
  const [selected, setSelected] = useState<Record<string, string>>({ wheat: "लोकवन", rice: "इंद्रायणी", jowar: "पांढरी ज्वारी", "toor-dal": "निवडक तूर डाळ" });
  const [sizes, setSizes] = useState<Record<string, number>>({ wheat: 5, rice: 5, jowar: 5, "toor-dal": 5 });
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
    setNotice(product.name + " बास्केटमध्ये जोडले!");
  }

  function changeBags(key: string, delta: number) {
    setBasket((old) => old.map((item) => item.key === key ? { ...item, bags: item.bags + delta } : item).filter((item) => item.bags > 0));
  }

  async function placeOrder() {
    if (!customer.name.trim() || !/^[6-9]\d{9}$/.test(customer.phone) || !customer.address.trim() || basket.length === 0) {
      setNotice("कृपया नाव, योग्य 10 अंकी मोबाईल नंबर, पत्ता आणि बास्केट तपासा.");
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
      setNotice("धन्यवाद! ऑर्डर नोंदवली. ऑर्डर क्रमांक: " + data.orderId + ". फोनवरून पुष्टी केली जाईल.");
      setBasket([]);
      setCheckoutOpen(false);
      setCustomer({ name: "", phone: "", address: "" });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main id="home" className="app-shell">
      <div className="topbar"><div className="container topbar-inner"><span>🌿 शेतकऱ्यांकडून तुमच्या घरापर्यंत</span><span>📞 ऑर्डरनंतर फोनवर पुष्टी</span></div></div>
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="#" aria-label="Gaav2Ghar home"><img className="brand-logo" src="/gaav2ghar-logo.png" alt="Gaav2Ghar logo" /></a>
          <a className="basket-link" href="#basket">🧺 बास्केट <b>{basket.reduce((n, item) => n + item.bags, 0)}</b></a>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy"><span className="eyebrow">मातीचा सुगंध • विश्वासाची चव</span><h1>गावाकडचे धान्य,<br /><em>आता तुमच्या घरी.</em></h1><p>निवडक धान्य, पारंपरिक वाण आणि सोपी घरपोच ऑर्डर. तुमच्या कुटुंबासाठी योग्य धान्य निवडा.</p><a className="primary-button" href="#products">धान्य निवडा <span>↓</span></a><div className="trust-row"><span>✓ सोपी ऑर्डर</span><span>✓ स्पष्ट किंमत</span><span>✓ फोनवर पुष्टी</span></div></div>
          <div className="hero-art"><div className="sun"></div><div className="hero-emoji">🌾</div><div className="grain-badge"><strong>थेट गावातून</strong><span>घरापर्यंत काळजीपूर्वक</span></div></div>
        </div>
      </section>

      <section className="benefits"><div className="container benefit-grid"><div><span>🌱</span><p><strong>निवडक धान्य</strong><small>विविध पारंपरिक वाण</small></p></div><div><span>⚖️</span><p><strong>तुमच्या गरजेनुसार</strong><small>5 ते 100 किलो बॅग</small></p></div><div><span>🏡</span><p><strong>घरपोच सेवा</strong><small>पत्त्यानुसार पुष्टी</small></p></div></div></section>

      <section className="section container" id="products"><div className="section-heading"><div><span className="eyebrow">आमची निवड</span><h2>घरासाठी चांगले धान्य</h2><p>वाण आणि बॅगचे वजन निवडा, मग बास्केटमध्ये जोडा.</p></div><span className="product-count">{products.length} उत्पादने</span></div>
        <div className="product-grid">{products.map((product) => <article className="product-card" key={product.id}><div className={"product-visual visual-" + product.id}><span className="product-emoji">{product.emoji}</span><span className="quality-tag">निवडक धान्य</span></div><div className="product-content"><div className="product-title"><div><h3>{product.name}</h3><span>{product.english}</span></div><div className="price"><strong>₹{product.pricePerKg}</strong><small>/ किलो</small></div></div><p className="product-note">{product.note}</p><label htmlFor={"variety-" + product.id}>वाण निवडा</label><select id={"variety-" + product.id} value={selected[product.id]} onChange={(e) => setSelected({ ...selected, [product.id]: e.target.value })}>{product.varieties.map((variety) => <option key={variety}>{variety}</option>)}</select><label htmlFor={"size-" + product.id}>बॅगचे वजन</label><select id={"size-" + product.id} value={sizes[product.id]} onChange={(e) => setSizes({ ...sizes, [product.id]: Number(e.target.value) })}>{bagSizes.map((size) => <option key={size} value={size}>{size} किलो</option>)}</select><div className="card-footer"><span>₹{product.pricePerKg * sizes[product.id]} <small>/ बॅग</small></span><button className="add-button" onClick={() => addToBasket(product)}>＋ जोडा</button></div></div></article>)}</div>
      </section>

      <section className="basket-section" id="basket"><div className="container basket-layout"><div><span className="eyebrow">तुमची खरेदी</span><h2>तुमची बास्केट</h2><p className="muted">बॅगची संख्या + / − करून बदलू शकता.</p>{basket.length === 0 ? <div className="empty-basket"><span>🧺</span><strong>तुमची बास्केट रिकामी आहे</strong><p>आवडते धान्य निवडून बास्केटमध्ये जोडा.</p><a href="#products">धान्य पाहा →</a></div> : <div className="basket-items">{basket.map((item) => <div className="basket-item" key={item.key}><div className="mini-grain">{item.product.emoji}</div><div className="basket-item-info"><strong>{item.product.name} — {item.variety}</strong><small>{item.bagSize} किलो बॅग · ₹{item.product.pricePerKg}/किलो</small><b>₹{item.bagSize * item.bags * item.product.pricePerKg}</b></div><div className="stepper"><button aria-label="कमी करा" onClick={() => changeBags(item.key, -1)}>−</button><span>{item.bags}</span><button aria-label="वाढवा" onClick={() => changeBags(item.key, 1)}>＋</button></div></div>)}</div>}</div>
        <aside className="summary-card"><h3>ऑर्डरचा तपशील</h3><div className="summary-line"><span>एकूण वजन</span><strong>{totalKg} किलो</strong></div><div className="summary-line"><span>धान्याची किंमत</span><strong>₹{subtotal.toLocaleString("en-IN")}</strong></div><div className="summary-line"><span>डिलिव्हरी</span><strong>{delivery === 0 ? "₹0" : "₹" + delivery}</strong></div><div className="summary-line total-line"><span>एकूण रक्कम</span><strong>₹{total.toLocaleString("en-IN")}</strong></div><p className="summary-note">₹1,500 किंवा अधिक खरेदीवर अंदाजित मोफत डिलिव्हरी. अंतिम शुल्क फोनवर कळवले जाईल.</p><button className="primary-button full-button" disabled={!basket.length} onClick={() => setCheckoutOpen(!checkoutOpen)}>{checkoutOpen ? "फॉर्म बंद करा" : "ऑर्डर पुढे न्या"} →</button>
          {checkoutOpen && <div className="checkout-form"><label htmlFor="customer-name">तुमचे नाव</label><input id="customer-name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="पूर्ण नाव" /><label htmlFor="customer-phone">मोबाईल नंबर</label><input id="customer-phone" inputMode="numeric" maxLength={10} value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="10 अंकी नंबर" /><label htmlFor="customer-address">पूर्ण पत्ता</label><textarea id="customer-address" rows={3} value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} placeholder="घर क्रमांक, परिसर, शहर, पिनकोड" /><p className="cod-note">पेमेंट: घरपोच मिळाल्यावर (COD). ऑर्डरनंतर फोनवर पुष्टी केली जाईल.</p><button className="primary-button full-button" disabled={sending} onClick={placeOrder}>{sending ? "ऑर्डर नोंदवत आहे..." : "ऑर्डर निश्चित करा"}</button></div>}
        </aside></div></section>
      <footer className="footer"><div className="container footer-inner"><a className="brand footer-brand" href="#" aria-label="Gaav2Ghar home"><img className="brand-logo footer-logo" src="/gaav2ghar-logo.png" alt="Gaav2Ghar logo" /></a><p>शेतकरी आणि तुमच्या स्वयंपाकघरातील विश्वासाचा दुवा.</p><small>© {new Date().getFullYear()} Gaav2Ghar. सर्व हक्क राखीव.</small></div></footer>
      <nav className="mobile-bottom-nav" aria-label="मुख्य नेव्हिगेशन">
        <a className="mobile-nav-item active" href="#home"><span>⌂</span><small>होम</small></a>
        <a className="mobile-nav-item" href="#products"><span>🌾</span><small>धान्य</small></a>
        <a className="mobile-nav-item" href="#basket"><span>🧺</span><small>बास्केट{basket.length ? " (" + basket.reduce((n, item) => n + item.bags, 0) + ")" : ""}</small></a>
      </nav>
      {basket.length > 0 && <div className="mobile-cart-dock">
        <div className="mobile-cart-copy"><strong>₹{total.toLocaleString("en-IN")}</strong><small>{totalKg} किलो · {basket.reduce((n, item) => n + item.bags, 0)} बॅग</small></div>
        <a className="mobile-cart-button" href="#basket">बास्केट पाहा <span>→</span></a>
      </div>}
      {notice && <div className="toast" role="status"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="बंद करा">×</button></div>}
    </main>
  );
}
