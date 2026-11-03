import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HScroll, ProductCard } from '../components/Common';
import { productImg } from '../lib/art';
import type { Product } from '../types';
import { inr } from '../lib/format';
import { COUPONS } from '../lib/pricing';
import { useStore } from '../state/store';

const BANNERS = [
  { bg: 'linear-gradient(115deg,#5b0f2a,#c2410c 55%,#f59e0b)', k: '🪔 DIWALI DHAMAKA SALE', t: '{MAX}', s: 'Kurtas, T-Shirts, Jeans & more · Extra coupon savings inside', to: '/c/all?sort=disc', pool: 'sale', fest: true },
  { bg: 'linear-gradient(120deg,#2874f0,#6a5af9)', k: 'END OF SEASON SALE', t: 'Min. 50–70% Off', s: 'Top kurtas & ethnic sets for men', to: '/c/all?off=50', pool: 'sale' },
  { bg: 'linear-gradient(120deg,#c2185b,#ff7043)', k: 'FESTIVE EDIT', t: 'Kurta Sets for Every Occasion', s: 'Kurta Pyjama · Dhoti · Salwar · Jacket sets', to: '/c/ethnic?sub=Kurta Sets', pool: 'sets' },
  { bg: 'linear-gradient(120deg,#00897b,#26c6da)', k: 'NEW ARRIVALS', t: 'Fresh Kurta Drops', s: 'Just landed – straight, printed & embroidered', to: '/c/all?sort=new', pool: 'new' },
  { bg: 'linear-gradient(120deg,#f9a825,#ff7043)', k: 'VALUE PICKS', t: 'Kurtas Under ₹499', s: 'Style that does not stretch your budget', to: '/c/all?max=499', pool: 'cheap' },
] as const;
type Pool = (typeof BANNERS)[number]['pool'];
const BAND_STYLES: Record<number, string> = { 50: 'linear-gradient(135deg,#2874f0,#5b8def)', 60: 'linear-gradient(135deg,#00897b,#26a69a)', 70: 'linear-gradient(135deg,#c2185b,#ec407a)', 80: 'linear-gradient(135deg,#b91c1c,#f97316)' };
const CODE_STYLES = ['linear-gradient(135deg,#7b1fa2,#ab47bc)', 'linear-gradient(135deg,#00695c,#26a69a)', 'linear-gradient(135deg,#ef6c00,#ffb300)'];
const COLLECTIONS: { name: string; to: string; bg: string; pool: Pool | 'rated' | 'kurtas' }[] = [
  { name: 'Kurta Sets', to: '/c/ethnic?sub=Kurta Sets', bg: '#ffe3ec', pool: 'sets' }, { name: 'Classic Kurtas', to: '/c/ethnic?sub=Kurtas', bg: '#e3f0ff', pool: 'kurtas' },
  { name: 'Under ₹500', to: '/c/all?max=499', bg: '#f2ead9', pool: 'cheap' }, { name: 'Big Discounts', to: '/c/all?sort=disc', bg: '#ffe9e0', pool: 'sale' },
  { name: 'Top Rated', to: '/c/all?sort=rate', bg: '#e6f6e8', pool: 'rated' }, { name: 'New In', to: '/c/all?sort=new', bg: '#e8ecf7', pool: 'new' },
];
/** Real-photo product lists used to fill banners/collections (only products that have photos). */
function pools(products: Product[]): Record<Pool | 'rated' | 'kurtas', Product[]> {
  const real = products.filter(p => p.images?.length || p.thumbnails?.length);
  const by = (f: (a: Product, b: Product) => number, l: Product[] = real) => [...l].sort(f);
  return {
    sale: by((a, b) => b.off - a.off), new: by((a, b) => b.created - a.created), cheap: by((a, b) => a.price - b.price),
    rated: by((a, b) => b.rating - a.rating || b.reviews - a.reviews), sets: real.filter(p => p.sub === 'Kurta Sets'), kurtas: real.filter(p => p.sub === 'Kurtas'),
  };
}

function Countdown() {
  const [s, setS] = useState(0);
  useEffect(() => {
    const tick = () => { const n = new Date(), e = new Date(n); e.setHours(24, 0, 0, 0); setS(Math.floor((+e - +n) / 1000)); };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);
  const p = (x: number) => String(x).padStart(2, '0');
  return <span className="countdown">{p(Math.floor(s / 3600))}:{p(Math.floor((s % 3600) / 60))}:{p(s % 60)} left</span>;
}

export default function Home() {
  const { products, toast } = useStore();
  const [i, setI] = useState(0);
  useEffect(() => { document.title = 'StyleWagon – Online Fashion Store'; const id = setInterval(() => setI(x => (x + 1) % BANNERS.length), 5000); return () => clearInterval(id); }, []);
  const go = (n: number) => setI((n + BANNERS.length) % BANNERS.length);
  const by = (tag: string) => products.filter(p => p.tags.includes(tag));
  const pl = pools(products);
  const maxOff = products.reduce((m, p) => Math.max(m, p.off), 0);       // real best discount in the catalogue
  const headline = maxOff >= 10 ? `Up to ${maxOff}% Off` : 'Festive Savings';
  const bands = [50, 60, 70, 80].map(n => ({ n, count: products.filter(p => p.off >= n).length })).filter(b => b.count > 0);
  const under = (m: number) => products.filter(p => p.price <= m).length;
  const copy = async (code: string) => { try { await navigator.clipboard.writeText(code); toast(`${code} copied – apply it in your cart`, 'ok'); } catch { toast(`Use code ${code} in your cart`); } };
  const ticker = [`🪔 Diwali Sale: ${headline.toLowerCase()}`, ...Object.entries(COUPONS).map(([c, v]) => `🎁 ${v.label} – code ${c}`), '📲 Pay easily by UPI / QR', '🚚 Flat ₹20 delivery · delivered within 36 hours'];
  const deal = [...products].sort((a, b) => b.off - a.off).slice(0, 8);
  return (
    <>
      <div className="carousel">
        <div className="slides" style={{ transform: `translateX(-${i * 100}%)` }}>
          {BANNERS.map(b => (
            <Link key={b.k} className={`slide ${'fest' in b ? 'fest' : ''}`} to={b.to} style={{ background: b.bg }}>
              <div className="slide-txt"><small>{b.k}</small><h1>{b.t === '{MAX}' ? headline : b.t}</h1><p>{b.s}</p><span className="btn light">SHOP NOW</span></div>
              {pl[b.pool].length > 0 && <div className="slide-art"><img alt="" src={productImg(pl[b.pool][0])} /><img alt="" className="b" src={productImg(pl[b.pool][1] ?? pl[b.pool][0])} /></div>}
            </Link>
          ))}
        </div>
        <button className="car-btn l" aria-label="Previous" onClick={() => go(i - 1)}>‹</button>
        <button className="car-btn r" aria-label="Next" onClick={() => go(i + 1)}>›</button>
        <div className="dots">{BANNERS.map((b, k) => <button key={b.k} className={k === i ? 'on' : ''} aria-label={`Slide ${k + 1}`} onClick={() => go(k)} />)}</div>
      </div>

      <div className="ticker" aria-label="Current offers"><div className="ticker-track">{[0, 1].map(r => <span key={r} aria-hidden={r === 1}>{ticker.map(x => <b key={x + r}>{x}</b>)}</span>)}</div></div>

      <section className="strip">{[['🚚', 'Fast delivery', '₹20 flat · within 36 hours'], ['↩️', '15-day returns', 'easy & hassle free'], ['🔒', 'Secure payments', 'UPI · QR · Cards'], ['✨', '100% genuine', 'quality checked']].map(x => <div key={x[1]}><span>{x[0]}</span><div><b>{x[1]}</b><small>{x[2]}</small></div></div>)}</section>

      <section className="section deal">
        <div className="sec-head"><h2>⚡ Deals of the Day <Countdown /></h2><Link className="btn sm primary" to="/c/all?sort=disc">VIEW ALL</Link></div>
        <div className="hscroll">{deal.map(p => <ProductCard key={p.id} p={p} compact />)}</div>
      </section>

      <HScroll title="⭐ Bestsellers" list={by('bestseller')} link="/c/all?tag=bestseller" />

      {bands.length > 0 && <section className="section"><div className="sec-head"><h2>💥 Mega Savings</h2><Link className="btn sm primary" to="/c/all?sort=disc">VIEW ALL</Link></div>
        <div className="bands">{bands.map(b => <Link key={b.n} to={`/c/all?off=${b.n}`} style={{ background: BAND_STYLES[b.n] }}><b>{b.n}%</b><span>OFF &amp; ABOVE</span><small>{b.count} styles</small></Link>)}</div></section>}

      <section className="section"><div className="sec-head"><h2>Featured Collections</h2></div>
        <div className="collections">{COLLECTIONS.map(c => { const top = pl[c.pool][0]; return <Link key={c.name} className="collection" to={c.to} style={{ background: c.bg }}><div><h3>{c.name}</h3><span>Explore →</span></div>{top && <img alt="" src={productImg(top)} />}</Link>; })}</div></section>

      <HScroll title="🔥 Trending Styles" list={by('trending')} link="/c/all?tag=trending" />

      <section className="section"><div className="sec-head"><h2>Shop by Budget</h2></div>
        <div className="budget">{([[499, '#2874f0'], [999, '#e91e63'], [1499, '#00897b'], [1999, '#fb641b']] as const).map(([m, c]) => <Link key={m} to={`/c/all?max=${m}`} style={{ background: c }}><small>UNDER</small><b>{inr(m)}</b></Link>)}</div></section>

      <section className="section festive"><div className="sec-head"><h2>🪔 Diwali Offers</h2><Countdown /></div>
        <div className="fest-grid">
          <Link className="fest-card" to="/c/all?sort=disc" style={{ background: 'linear-gradient(135deg,#7b1e3a,#e65100)' }}><small>BIGGEST DISCOUNTS</small><b>{maxOff >= 10 ? `UP TO ${maxOff}% OFF` : 'FESTIVE DEALS'}</b><span>Shop now →</span></Link>
          {Object.entries(COUPONS).map(([code, c], k) => <button key={code} className="fest-card code" onClick={() => void copy(code)} style={{ background: CODE_STYLES[k % CODE_STYLES.length] }}><small>COUPON · TAP TO COPY</small><b>{code}</b><span>{c.label}</span></button>)}
          <Link className="fest-card" to="/c/all?max=499" style={{ background: 'linear-gradient(135deg,#1565c0,#42a5f5)' }}><small>BUDGET PICKS</small><b>UNDER {inr(499)}</b><span>{under(499)} styles →</span></Link>
          <Link className="fest-card" to="/c/all?max=999" style={{ background: 'linear-gradient(135deg,#ad1457,#f06292)' }}><small>FESTIVE FINDS</small><b>UNDER {inr(999)}</b><span>{under(999)} styles →</span></Link>
        </div><p className="muted small">Coupons apply in the cart. Terms &amp; conditions apply.</p></section>

      <HScroll title="🆕 New Arrivals" list={by('new')} link="/c/all?sort=new" />
      <section className="section"><div className="sec-head"><h2>Top Brands</h2></div>
        <div className="brands">{[...new Set(products.map(p => p.brand))].sort().slice(0, 12).map(b => <Link key={b} to={`/search?brand=${encodeURIComponent(b)}`}>{b}</Link>)}</div></section>
    </>
  );
}
