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

// Product catalogue is loaded only from MongoDB; never render a hard-coded fallback list.

const bagSizes = [5, 25, 50, 100];

// Select a category-specific image so every variety of the same grain shares its correct photo.
function productImage(product: Product) {
  // Image is selected only from the main category ID; changing a variety never changes the photo.
  const key = (product.id + " " + product.name + " " + product.english).toLowerCase();
  if (/onion|kanda|कांद/.test(key)) return "/kanda.avif";
  if (/bajra|bajari|bajri|बाजरी/.test(key)) return "/bajari.avif";
  if (/jowar|jawar|ज्वारी/.test(key)) return "/jawar.avif";
  if (/wheat|gahu|गहू/.test(key)) return "/gahu.avif";
  if (/moong|mung|मूग|मुग/.test(key)) return "/moong.png.avif";
  if (/tur|तूर/.test(key)) return "/tur.png.avif";
  if (/rice|tandul|तांदूळ/.test(key)) return "/gahu.avif";
  if (/chickpea|harbhara|हरभरा/.test(key)) return "/harbhara.avif";
  return "/logo.avif";
}

type BasketItem = { key: string; product: Product; variety: string; bagSize: number; bags: number };

export default function Home() {
  const { language, t } = useAppLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [activeBanner, setActiveBanner] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActiveBanner((current) => (current + 1) % 5), 5500);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    let active = true;
    setProductsLoading(true);
    fetch("/api/products", { cache: "no-store", headers: { "Cache-Control": "no-cache" } }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "उत्पादने लोड झाली नाहीत.");
      if (active && Array.isArray(data.products)) {
        // MongoDB is the single source of truth; discard malformed/duplicate IDs.
        const uniqueProducts = Array.from(new Map((data.products as Product[])
          .filter((product) => product && typeof product.id === "string" && product.id.trim())
          .map((product) => [product.id, product])).values());
        setProducts(uniqueProducts);
        setProductsError("");
        setSelected((current) => Object.fromEntries(uniqueProducts.map((product) => [
          product.id,
          current[product.id] && product.varieties.includes(current[product.id])
            ? current[product.id]
            : (product.varieties[0] || ""),
        ])));
        setSizes((current) => Object.fromEntries(uniqueProducts.map((product) => [
          product.id,
          current[product.id] || 5,
        ])));
      }
    }).catch((error) => {
      if (active) { setProducts([]); setProductsError(error instanceof Error ? error.message : "उत्पादने लोड झाली नाहीत."); }
    }).finally(() => { if (active) setProductsLoading(false); });
    return () => { active = false; };
  }, []);
  const [selected, setSelected] = useState<Record<string, string>>({ onion: "गावठी कांदा", wheat: "लोकवन गहू", jowar: "मालदांडी ज्वारी", bajri: "पायनियर बाजरी*", moong: "हिरवा अख्खा मूग", tur: "पांढरी तूर" });
  const [sizes, setSizes] = useState<Record<string, number>>({ onion: 5, wheat: 5, jowar: 5, bajri: 5, moong: 5, tur: 5 });
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [notice, setNotice] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "", pinCode: "" });
  const [sending, setSending] = useState(false);
  const [confirmation, setConfirmation] = useState<{ orderId: string; name: string; phone: string; showPhone: boolean } | null>(null);
  useEffect(() => {
    if (!confirmation?.showPhone) return;
    const timer = window.setTimeout(() => setConfirmation((current) => current ? { ...current, showPhone: false } : null), 5000);
    return () => window.clearTimeout(timer);
  }, [confirmation?.orderId, confirmation?.showPhone]);
  const bannerSlides = [
    { kicker: "शेतकऱ्यांचा विश्वास", title: "गावाकडचे गहू, घरच्या पोळ्यांसाठी", description: "निवडक गहू आणि पारंपरिक वाण तुमच्या घरापर्यंत.", image: "/gahu.avif", emoji: "🌾", alt: "गव्हाचे दाणे" },
    { kicker: "पारंपरिक पौष्टिकता", title: "ज्वारी — रोजच्या जेवणाची चांगली निवड", description: "तुमच्या गरजेनुसार पॅक निवडा आणि सहज ऑर्डर करा.", image: "/jawar.avif", emoji: "🌱", alt: "ज्वारीचे दाणे" },
    { kicker: "गावचा अस्सल स्वाद", title: "बाजरी आणि पारंपरिक धान्य", description: "गावाकडच्या चवीची आठवण प्रत्येक जेवणात.", image: "/bajari.avif", emoji: "🌿", alt: "बाजरीचे दाणे" },
    { kicker: "रोजच्या स्वयंपाकासाठी", title: "कांदेही मिळवा सोप्या पद्धतीने", description: "घरच्या गरजेची निवड करा आणि ऑर्डरची माहिती सहज मिळवा.", image: "/kanda.avif", emoji: "🧅", alt: "ताजे कांदे" },
    { kicker: "सोपी घरपोच खरेदी", title: "तुमचे धान्य, तुमच्या पसंतीचा पॅक", description: "5, 25, 50 किंवा 100 किलोचे पॅक निवडा.", image: "/gahu.avif", emoji: "🧺", alt: "घरासाठी धान्याचे पॅक" },
  ];

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
    if (!customer.name.trim() || !/^[6-9]\d{9}$/.test(customer.phone) || !customer.address.trim() || !/^[1-9][0-9]{5}$/.test(customer.pinCode) || basket.length === 0) {
      setNotice(t("कृपया नाव, योग्य 10 अंकी मोबाईल नंबर, पूर्ण पत्ता, 6 अंकी पिनकोड आणि बास्केट तपासा."));
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
      setConfirmation({ orderId: data.orderId, name: customer.name.trim(), phone: customer.phone, showPhone: true });
      setNotice("");
      setBasket([]);
      setCheckoutOpen(false);
      setCustomer({ name: "", phone: "", address: "", pinCode: "" });
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
          <a className="brand" href="#" aria-label="Gaav2Ghar home"><img className="brand-logo" src="/logo.avif" alt="Gaav2Ghar logo" /></a>
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

      <section className="banner-carousel container" aria-label={t("Gaav2Ghar विशेष बॅनर")}>
        <div className="banner-slide" key={activeBanner}>
          <div className="banner-copy"><span className="banner-kicker">{t(bannerSlides[activeBanner].kicker)}</span><h2>{t(bannerSlides[activeBanner].title)}</h2><p>{t(bannerSlides[activeBanner].description)}</p><a className="banner-cta" href="#products">{t("धान्य निवडा")} <span aria-hidden="true">→</span></a></div>
          <div className={"banner-visual banner-visual-" + (activeBanner + 1)}><img src={bannerSlides[activeBanner].image} alt={t(bannerSlides[activeBanner].alt)} onError={(event) => { event.currentTarget.style.display = "none"; }} /><span aria-hidden="true">{bannerSlides[activeBanner].emoji}</span><div className="banner-stamp">🌿 {t("गावाकडून घरापर्यंत")}</div></div>
        </div>
        <div className="banner-controls"><button type="button" className="banner-arrow" aria-label={t("मागील बॅनर")} onClick={() => setActiveBanner((activeBanner + bannerSlides.length - 1) % bannerSlides.length)}>←</button><div className="banner-dots" role="group" aria-label={t("बॅनर निवडा")}>{bannerSlides.map((slide, index) => <button type="button" key={slide.title} className={index === activeBanner ? "banner-dot active" : "banner-dot"} aria-label={t("बॅनर क्रमांक") + " " + (index + 1)} aria-current={index === activeBanner ? "true" : undefined} onClick={() => setActiveBanner(index)} />)}</div><span className="banner-count">{String(activeBanner + 1).padStart(2, "0")} / 05</span><button type="button" className="banner-arrow" aria-label={t("पुढील बॅनर")} onClick={() => setActiveBanner((activeBanner + 1) % bannerSlides.length)}>→</button></div>
      </section>

      <section className="benefits"><div className="container benefit-grid"><div><span>🌱</span><p><strong>{t("निवडक धान्य")}</strong><small>{t("विविध पारंपरिक वाण")}</small></p></div><div><span>⚖️</span><p><strong>{t("तुमच्या गरजेनुसार")}</strong><small>5–100 {t("किलो")} pack</small></p></div><div><span>🏡</span><p><strong>{t("घरपोच सेवा")}</strong><small>{t("पत्त्यानुसार पुष्टी")}</small></p></div></div></section>

      <section className="section container" id="products"><div className="section-heading"><div><span className="eyebrow">{t("आमची निवड")}</span><h2>{t("घरासाठी चांगले धान्य")}</h2><p>{t("वाण आणि बॅगचे वजन निवडा, मग बास्केटमध्ये जोडा.")}</p></div><span className="product-count">{products.length} {t("उत्पादने")}</span></div>
        {productsLoading ? <p role="status" className="muted">उत्पादने लोड होत आहेत...</p> : productsError ? <p role="alert" className="muted">{productsError} कृपया Refresh करा.</p> : products.length === 0 ? <p className="muted">सध्या कोणतीही उत्पादने उपलब्ध नाहीत.</p> : <div className="product-grid">{products.map((product) => <article className="product-card" key={product.id}><div className={"product-visual visual-" + product.id}><img className="product-photo" src={productImage(product)} alt={product.english + " grain"} loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; const fallback = event.currentTarget.parentElement?.querySelector(".product-emoji-fallback") as HTMLElement | null; if (fallback) fallback.style.display = "block"; }} /><span className="product-emoji product-emoji-fallback">{product.emoji}</span><span className="quality-tag">{t("निवडक धान्य")}</span></div><div className="product-content"><div className="product-title"><div><h3>{language === "en" ? product.english : language === "hi" ? t(product.name) : product.name}</h3><span>{product.english}</span></div><div className="price">{product.pricePerKg > 0 ? <><strong>₹{product.pricePerKg}</strong><small>/ किलो</small></> : <small>{t("किंमत निश्चित करायची")}</small>}</div></div><p className="product-note">{t(product.note)}</p><label htmlFor={"variety-" + product.id}>{t("वाण निवडा")}</label><select id={"variety-" + product.id} value={selected[product.id]} onChange={(e) => setSelected({ ...selected, [product.id]: e.target.value })}>{product.varieties.map((variety) => <option key={variety} value={variety}>{t(variety)}</option>)}</select><label htmlFor={"size-" + product.id}>{t("बॅगचे वजन")}</label><select id={"size-" + product.id} value={sizes[product.id]} onChange={(e) => setSizes({ ...sizes, [product.id]: Number(e.target.value) })}>{bagSizes.map((size) => <option key={size} value={size}>{size} {t("किलो")}</option>)}</select><div className="card-footer"><span>{product.pricePerKg > 0 ? <>₹{product.pricePerKg * (sizes[product.id] || 5)} <small>/ बॅग</small></> : <small>{t("किंमत लवकरच")}</small>}</span><button className="add-button" disabled={product.pricePerKg <= 0} onClick={() => addToBasket(product)}>{product.pricePerKg > 0 ? "＋ जोडा"  : t("किंमत बाकी")}</button></div></div></article>)}</div>}
      </section>

      <section className="basket-section" id="basket"><div className="container basket-layout"><div><span className="eyebrow">{t("तुमची खरेदी")}</span><h2>{t("तुमची बास्केट")}</h2><p className="muted">{t("बॅगची संख्या + / − करून बदलू शकता.")}</p>{basket.length === 0 ? <div className="empty-basket"><span>🧺</span><strong>{t("तुमची बास्केट रिकामी आहे")}</strong><p>{t("आवडते धान्य निवडून बास्केटमध्ये जोडा.")}</p><a href="#products">{t("धान्य पाहा")} →</a></div> : <div className="basket-items">{basket.map((item) => <div className="basket-item" key={item.key}><div className="mini-grain">{item.product.emoji}</div><div className="basket-item-info"><strong>{language === "en" ? item.product.english : language === "hi" ? t(item.product.name) : item.product.name} — {item.variety}</strong><small>{item.bagSize} किलो बॅग · ₹{item.product.pricePerKg}/किलो</small><b>₹{item.bagSize * item.bags * item.product.pricePerKg}</b></div><div className="stepper"><button aria-label={t("कमी करा")} onClick={() => changeBags(item.key, -1)}>−</button><span>{item.bags}</span><button aria-label={t("वाढवा")} onClick={() => changeBags(item.key, 1)}>＋</button></div></div>)}</div>}</div>
        <aside className="summary-card"><h3>{t("ऑर्डरचा तपशील")}</h3><div className="summary-line"><span>{t("एकूण वजन")}</span><strong>{totalKg} किलो</strong></div><div className="summary-line"><span>{t("धान्याची किंमत")}</span><strong>₹{subtotal.toLocaleString("en-IN")}</strong></div><div className="summary-line"><span>{t("डिलिव्हरी")}</span><strong>{delivery === 0 ? "₹0" : "₹" + delivery}</strong></div><div className="summary-line total-line"><span>{t("एकूण रक्कम")}</span><strong>₹{total.toLocaleString("en-IN")}</strong></div><p className="summary-note">{t("₹1,500 किंवा अधिक खरेदीवर अंदाजित मोफत डिलिव्हरी. अंतिम शुल्क फोनवर कळवले जाईल.")}</p><button className="primary-button full-button" disabled={!basket.length} onClick={() => setCheckoutOpen(!checkoutOpen)}>{checkoutOpen ? t("फॉर्म बंद करा") : t("ऑर्डर पुढे न्या")} →</button>
          {checkoutOpen && <div className="checkout-form"><label htmlFor="customer-name">{t("तुमचे नाव")}</label><input id="customer-name" name="name" autoComplete="name" required maxLength={100} value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder={t("पूर्ण नाव")} /><label htmlFor="customer-phone">{t("मोबाईल नंबर")}</label><input id="customer-phone" name="tel" type="tel" inputMode="numeric" autoComplete="tel" pattern="[6-9][0-9]{9}" title="योग्य 10 अंकी मोबाईल नंबर टाका" required maxLength={10} value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder={t("10 अंकी नंबर")} /><label htmlFor="customer-address">{t("पूर्ण पत्ता")}</label><textarea id="customer-address" name="address" autoComplete="street-address" required minLength={8} maxLength={500} rows={3} value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} placeholder={t("घर क्रमांक, परिसर, शहर")} /><label htmlFor="customer-pincode">{t("पिनकोड")}</label><input id="customer-pincode" name="postalCode" type="text" inputMode="numeric" autoComplete="postal-code" pattern="[1-9][0-9]{5}" title="6 अंकी योग्य पिनकोड टाका" required maxLength={6} value={customer.pinCode} onChange={(e) => setCustomer({ ...customer, pinCode: e.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="उदा. 411001" /><p className="cod-note">{t("पेमेंट: घरपोच मिळाल्यावर (COD). ऑर्डरनंतर फोनवर पुष्टी केली जाईल.")}</p><button type="button" className="primary-button full-button" disabled={sending} onClick={() => { const name = document.getElementById("customer-name") as HTMLInputElement | null; const phone = document.getElementById("customer-phone") as HTMLInputElement | null; const address = document.getElementById("customer-address") as HTMLTextAreaElement | null; const pinCode = document.getElementById("customer-pincode") as HTMLInputElement | null; if (!name?.reportValidity() || !phone?.reportValidity() || !address?.reportValidity() || !pinCode?.reportValidity()) return; placeOrder(); }}>{sending ? t("ऑर्डर नोंदवत आहे...") : t("ऑर्डर निश्चित करा")}</button></div>}
        </aside></div></section>
      <>{confirmation && <div className="order-confirmation-overlay" role="presentation"><section className="order-confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="order-confirm-title"><span className="confirmation-icon">✓</span><p className="confirmation-eyebrow">ऑर्डर यशस्वीरीत्या नोंदवली</p><h2 id="order-confirm-title">धन्यवाद, {confirmation.name}!</h2><p><strong>ग्राहक:</strong> {confirmation.name}</p>{confirmation.showPhone && <p><strong>मोबाईल नंबर:</strong> {confirmation.phone}</p>}<p><strong>ऑर्डर आयडी:</strong> {confirmation.orderId}</p><a href="/track">ऑर्डर ट्रॅक करा →</a><small>ही सूचना 5 सेकंदांनी बंद होईल.</small></section></div>}</>
      <footer className="footer" id="contact">
        <div className="container footer-grid">
          <section className="footer-about">
            <a className="footer-wordmark" href="#home" aria-label="Gaav2Ghar home">🌾 Gaav2Ghar</a>
            <p>{t("गावाकडची गुणवत्ता, तुमच्या घरापर्यंत.")}</p>
            <span className="footer-trust">🌱 {t("विश्वास • गुणवत्ता • घरपोच सेवा")}</span>
          </section>
          <section className="footer-column">
            <h3>{t("जलद दुवे")}</h3>
            <a href="#products">{t("धान्य आणि किंमती")}</a>
            <a href="#basket">{t("ऑर्डर कशी करावी")}</a>
            <a href="/track">{t("ऑर्डर ट्रॅक करा")}</a>
          </section>
          <section className="footer-column footer-contact" id="contact-help">
            <h3>{t("संपर्क")}</h3>
            <a className="footer-contact-link" href="tel:+919028787219"><span aria-hidden="true">☎</span><span>9028787219</span></a>
            <a className="footer-contact-link" href="mailto:somasumbe@gmail.com"><span aria-hidden="true">✉</span><span>somasumbe@gmail.com</span></a>
          </section>
        </div>
        <div className="container footer-bottom">
          <small>© {new Date().getFullYear()} Gaav2Ghar · {t("सर्व हक्क राखीव.")}</small>
          <a href="#home">{t("वर जा")} ↑</a>
        </div>
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
