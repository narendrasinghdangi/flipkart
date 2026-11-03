import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { HScroll, Modal, Empty, Stars } from '../components/Common';
import { CATS, COLORS, imgCount, productImg, productImgFull, reviewsFor, soldOut } from '../lib/art';
import { fmtDate, inr } from '../lib/format';
import { DELIVERY_FEE, DELIVERY_HOURS } from '../lib/pricing';
import { useStore } from '../state/store';
import type { Product } from '../types';

const catName = (id: string) => CATS.find(c => c.id === id)?.name ?? id;
const PIN = /^[1-9]\d{5}$/;

export default function ProductPage() {
  const { id } = useParams();
  const { byId, products, wish, toggleWish, addToCart, setBuyNow, toast, showCartPopup } = useStore();
  const nav = useNavigate();
  const p = byId(Number(id));
  const [color, setColor] = useState(p?.colors[0] ?? '');
  const [size, setSize] = useState(p && p.sizes.length === 1 ? p.sizes[0] : '');
  const [img, setImg] = useState(0);
  const [sizeErr, setSizeErr] = useState(false);
  const [ask, setAsk] = useState<'cart' | 'buy' | null>(null);   // size prompt, remembers which button was pressed
  const [guide, setGuide] = useState(false);
  const [pin, setPin] = useState(() => { try { return localStorage.getItem('sw_pin') ?? ''; } catch { return ''; } });
  const [pinOk, setPinOk] = useState<boolean | null>(() => (PIN.test(pin) ? true : null));
  useEffect(() => { if (p) document.title = `${p.name} – ${p.brand} | StyleWagon`; }, [p]);
  if (!p) return <Empty title="Product not found" to="/" />;

  const w = wish.includes(p.id);
  const similar = products.filter(x => x.id !== p.id && x.cats.some(c => p.cats.includes(c)) && (x.sub === p.sub || x.type === p.type)).slice(0, 10);
  const revs = reviewsFor(p);
  const dist = ([5, 4, 3, 2, 1] as const).map(s => [s, Math.round(p.reviews * { 5: 0.5, 4: 0.28, 3: 0.12, 2: 0.06, 1: 0.04 }[s])] as const);
  const checkPin = () => { const ok = PIN.test(pin.trim()); setPinOk(ok); if (ok) try { localStorage.setItem('sw_pin', pin.trim()); } catch { /* ignore */ } };
  const addCart = (sz = size) => { if (!sz) { setSizeErr(true); setAsk('cart'); return; } const it = { id: p.id, size: sz, color, qty: 1 }; addToCart(it); showCartPopup(it); };
  const buy = (sz = size) => { if (!sz) { setSizeErr(true); setAsk('buy'); return; } setBuyNow({ id: p.id, size: sz, color, qty: 1 }); nav('/checkout'); };
  const pick = (z: string) => { const a = ask; setSize(z); setSizeErr(false); setAsk(null); if (a === 'buy') buy(z); else addCart(z); };
  const noSize = ['watch', 'bag', 'belt', 'shades', 'scarf'].includes(p.type);

  return (
    <>
      {ask && <SizePrompt p={p} color={color} action={ask} onPick={pick} onClose={() => setAsk(null)} />}
      <div className="crumbs"><Link to="/">Home</Link> › <Link to={`/c/${p.cats[0]}`}>{catName(p.cats[0])}</Link> › <Link to={`/c/${p.cats[0]}?sub=${encodeURIComponent(p.sub)}`}>{p.sub}</Link> › <span>{p.name}</span></div>
      <div className="pdp">
        <div className="gallery">
          <div className="thumbs">{Array.from({ length: imgCount(p) }, (_, i) => i).map(i => <button key={i} className={img === i ? 'sel' : ''} aria-label={`View ${i + 1}`} onClick={() => setImg(i)}><img alt="" src={productImg(p, color, i)} /></button>)}</div>
          <div className="main-img"><img alt={p.name} src={productImgFull(p, color, img)} /></div>
        </div>
        <div className="pdp-info">
          <div className="brand big">{p.brand}</div><h1>{p.name}</h1>
          <div className="meta"><Stars r={p.rating} /> <span className="muted">{p.reviews.toLocaleString('en-IN')} ratings</span> <span className="assured">✔ Assured</span></div>
          <div className="price big"><b>{inr(p.price)}</b> <s>{inr(p.mrp)}</s> <span className="off">{p.off}% off</span></div><div className="muted small">Inclusive of all taxes</div>
          <div className="offers-box"><h4>Available offers</h4>
            <p><b>Coupon</b> Use <code>STYLE10</code> – 10% off up to ₹300 on orders above ₹999</p>
            <p><b>Coupon</b> Use <code>FIRST200</code> – ₹200 off above ₹1,499</p>
            <p><b>Payment</b> UPI &amp; QR pay</p></div>
          <div className="opt"><h4>Colour: <span>{color}</span></h4>
            <div className="swatches lg">{p.colors.map(c => <button key={c} className={`sw ${c === color ? 'sel' : ''}`} title={c} aria-label={c} onClick={() => setColor(c)}><i style={{ background: COLORS[c] }} /></button>)}</div></div>
          <div className="opt"><h4>Size {p.sizes.length > 1 && <button className="link" onClick={() => setGuide(true)}>Size guide</button>}</h4>
            <div className="sizes">{p.sizes.map(z => { const so = soldOut(p, z); return <button key={z} disabled={so} title={so ? 'Out of stock' : undefined} className={`size ${size === z ? 'sel' : ''} ${so ? 'so' : ''}`} onClick={() => { setSize(z); setSizeErr(false); }}>{z}</button>; })}</div>
            {sizeErr && <div className="err">Please select a size</div>}</div>
          <div className="actions">
            <button className="btn cart" onClick={() => addCart()}>🛒 ADD TO CART</button><button className="btn buy" onClick={() => buy()}>⚡ BUY NOW</button>
            <button className={`btn wishbtn ${w ? 'on' : ''}`} aria-pressed={w} onClick={() => { toggleWish(p.id); toast(w ? 'Removed from wishlist' : 'Added to wishlist ♥'); }}>♥ <span>{w ? 'WISHLISTED' : 'WISHLIST'}</span></button>
          </div>
          <div className="opt delivery"><h4>Delivery</h4>
            <div className="pin"><input inputMode="numeric" maxLength={6} placeholder="Enter pincode" aria-label="Pincode" value={pin} onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setPinOk(null); }} /><button className="link" onClick={checkPin}>CHECK</button></div>
            <div className="small muted">{pinOk === true ? <>✅ Delivery available to <b>{pin}</b> · Cash on Delivery not available</> : pinOk === false ? <span className="red">Enter a valid 6-digit pincode</span> : 'Enter your pincode to check delivery availability'}</div>
            <div className="muted small">Delivery in <b>{DELIVERY_HOURS} hours</b> – by <b>{fmtDate(Date.now() + DELIVERY_HOURS * 36e5, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</b> · Delivery charge <b>{inr(DELIVERY_FEE)}</b> · 15-day easy returns</div></div>
          <div className="opt"><h4>Product details</h4><table className="spec"><tbody>
            <tr><td>Fabric</td><td>{p.fabric}</td></tr><tr><td>Type</td><td>{p.sub}</td></tr><tr><td>Category</td><td>{p.cats.map(catName).join(', ')}</td></tr>
            <tr><td>Care</td><td>{noSize || p.type === 'watch' ? 'Wipe with a soft dry cloth' : 'Machine wash cold, do not bleach'}</td></tr><tr><td>Return policy</td><td>15 days, free pickup</td></tr></tbody></table></div>
        </div>
      </div>
      <section className="section reviews"><div className="sec-head"><h2>Ratings & Reviews</h2></div>
        <div className="rev-top"><div className="rev-score"><b>{p.rating.toFixed(1)} ★</b><small>{p.reviews.toLocaleString('en-IN')} ratings</small></div>
          <div className="bars">{dist.map(([s, n]) => <div key={s}><span>{s}★</span><i><u style={{ width: `${Math.round((n / p.reviews) * 100)}%` }} /></i><span>{n.toLocaleString('en-IN')}</span></div>)}</div></div>
        {revs.map((r, i) => <div key={i} className="review"><Stars r={r.stars} /> <b>{r.title}</b><p>{r.text}</p><small className="muted">{r.who} · Certified Buyer · {r.days} days ago</small></div>)}
        <p className="muted small">Sample reviews for demo purposes.</p></section>
      {similar.length > 0 && <HScroll title="Similar Products" list={similar} />}
      <div className="sticky-buy"><button className="btn cart" onClick={() => addCart()}>ADD TO CART</button><button className="btn buy" onClick={() => buy()}>BUY NOW</button></div>
      {guide && <Modal onClose={() => setGuide(false)}><SizeGuide sizeSet={p.sizeSet} /></Modal>}
    </>
  );
}

function SizeGuide({ sizeSet }: { sizeSet: string }) {
  const rows = sizeSet === 'N' ? [['28', '71', '36'], ['30', '76', '38'], ['32', '81', '40'], ['34', '86', '42'], ['36', '91', '44'], ['38', '97', '46']]
    : sizeSet === 'K' ? [['2-3Y', '53–56', '92–98'], ['4-5Y', '57–60', '104–110'], ['6-7Y', '62–65', '116–122'], ['8-9Y', '66–70', '128–134'], ['10-11Y', '72–76', '140–146']]
      : [['XS', '81', '66'], ['S', '86', '71'], ['M', '91', '76'], ['L', '97', '81'], ['XL', '102', '86'], ['XXL', '107', '91']];
  const h = sizeSet === 'N' ? ['Size', 'Waist (cm)', 'Hip (in)'] : sizeSet === 'K' ? ['Size', 'Chest (cm)', 'Height (cm)'] : ['Size', 'Chest/Bust (cm)', 'Waist (cm)'];
  return <><h3>Size guide</h3><table className="spec sg"><thead><tr>{h.map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map(r => <tr key={r[0]}>{r.map((x, i) => <td key={i}>{x}</td>)}</tr>)}</tbody></table><p className="muted small">Body measurements. If between sizes, choose the larger one.</p></>;
}

/** "Select a size" popup: shows the product and its sizes; tapping one selects it and finishes the action. */
function SizePrompt({ p, color, action, onPick, onClose }: { p: Product; color: string; action: 'cart' | 'buy'; onPick: (z: string) => void; onClose: () => void }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);
  return (
    <div className="sp-wrap" onClick={onClose}>
      <div className="sp-card" role="dialog" aria-modal="true" aria-label="Select a size" onClick={e => e.stopPropagation()}>
        <div className="sp-head"><span aria-hidden>📏</span><b>Select a size</b><button className="cp-x" aria-label="Close" onClick={onClose}>✕</button></div>
        <div className="cp-body"><img src={productImg(p, color)} alt="" />
          <div className="cp-info"><b className="cp-name">{p.name}</b><span className="muted small">{p.brand} · {color}</span><span className="cp-price">{inr(p.price)} <s className="muted small">{inr(p.mrp)}</s></span></div></div>
        <p className="sp-hint">Pick your size to {action === 'buy' ? 'buy now' : 'add this to your cart'}:</p>
        <div className="sizes sp-sizes">{p.sizes.map(z => { const so = soldOut(p, z); return <button key={z} disabled={so} title={so ? 'Out of stock' : undefined} className={`size ${so ? 'so' : ''}`} onClick={() => onPick(z)}>{z}</button>; })}</div>
        <button className="btn sp-cancel" onClick={onClose}>CANCEL</button>
      </div>
    </div>
  );
}
