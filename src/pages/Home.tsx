import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HScroll, ProductCard } from '../components/Common';
import { CATS, productImg } from '../lib/art';
import type { Product } from '../types';
import { inr } from '../lib/format';
import { useStore } from '../state/store';

const BANNERS = [
  { bg: 'linear-gradient(120deg,#2874f0,#6a5af9)', k: 'END OF SEASON SALE', t: 'Min. 50–70% Off', s: 'Top kurtas & ethnic sets for men', to: '/c/all?off=50', pool: 'sale' },
  { bg: 'linear-gradient(120deg,#c2185b,#ff7043)', k: 'FESTIVE EDIT', t: 'Kurta Sets for Every Occasion', s: 'Kurta Pyjama · Dhoti · Salwar · Jacket sets', to: '/c/ethnic?sub=Kurta Sets', pool: 'sets' },
  { bg: 'linear-gradient(120deg,#00897b,#26c6da)', k: 'NEW ARRIVALS', t: 'Fresh Kurta Drops', s: 'Just landed – straight, printed & embroidered', to: '/c/all?sort=new', pool: 'new' },
  { bg: 'linear-gradient(120deg,#f9a825,#ff7043)', k: 'VALUE PICKS', t: 'Kurtas Under ₹499', s: 'Style that does not stretch your budget', to: '/c/all?max=499', pool: 'cheap' },
] as const;
type Pool = (typeof BANNERS)[number]['pool'];
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
  const { products } = useStore();
  const [i, setI] = useState(0);
  useEffect(() => { document.title = 'StyleWagon – Online Fashion Store'; const id = setInterval(() => setI(x => (x + 1) % BANNERS.length), 5000); return () => clearInterval(id); }, []);
  const go = (n: number) => setI((n + BANNERS.length) % BANNERS.length);
  const by = (tag: string) => products.filter(p => p.tags.includes(tag));
  const pl = pools(products);
  const deal = [...products].sort((a, b) => b.off - a.off).slice(0, 8);
  return (
    <>
      <div className="carousel">
        <div className="slides" style={{ transform: `translateX(-${i * 100}%)` }}>
          {BANNERS.map(b => (
            <Link key={b.t} className="slide" to={b.to} style={{ background: b.bg }}>
              <div className="slide-txt"><small>{b.k}</small><h1>{b.t}</h1><p>{b.s}</p><span className="btn light">SHOP NOW</span></div>
              {pl[b.pool].length > 0 && <div className="slide-art"><img alt="" src={productImg(pl[b.pool][0])} /><img alt="" className="b" src={productImg(pl[b.pool][1] ?? pl[b.pool][0])} /></div>}
            </Link>
          ))}
        </div>
        <button className="car-btn l" aria-label="Previous" onClick={() => go(i - 1)}>‹</button>
        <button className="car-btn r" aria-label="Next" onClick={() => go(i + 1)}>›</button>
        <div className="dots">{BANNERS.map((b, k) => <button key={b.t} className={k === i ? 'on' : ''} aria-label={`Slide ${k + 1}`} onClick={() => go(k)} />)}</div>
      </div>

      <section className="cat-circles">{CATS.map(c => <Link key={c.id} to={`/c/${c.id}`}><span className="circle" style={{ ['--c' as string]: c.color }}>{c.icon}</span><span>{c.name}</span></Link>)}</section>

      <section className="strip">{[['🚚', 'Free delivery', 'on orders above ₹499'], ['↩️', '15-day returns', 'easy & hassle free'], ['🔒', 'Secure payments', 'UPI · QR · Cards'], ['✨', '100% genuine', 'quality checked']].map(x => <div key={x[1]}><span>{x[0]}</span><div><b>{x[1]}</b><small>{x[2]}</small></div></div>)}</section>

      <section className="section deal">
        <div className="sec-head"><h2>⚡ Deals of the Day <Countdown /></h2><Link className="btn sm primary" to="/c/all?sort=disc">VIEW ALL</Link></div>
        <div className="hscroll">{deal.map(p => <ProductCard key={p.id} p={p} compact />)}</div>
      </section>

      <section className="section"><div className="sec-head"><h2>Featured Collections</h2></div>
        <div className="collections">{COLLECTIONS.map(c => { const top = pl[c.pool][0]; return <Link key={c.name} className="collection" to={c.to} style={{ background: c.bg }}><div><h3>{c.name}</h3><span>Explore →</span></div>{top && <img alt="" src={productImg(top)} />}</Link>; })}</div></section>

      <HScroll title="🔥 Trending Styles" list={by('trending')} link="/c/all?tag=trending" />

      <section className="section"><div className="sec-head"><h2>Shop by Budget</h2></div>
        <div className="budget">{([[499, '#2874f0'], [999, '#e91e63'], [1499, '#00897b'], [1999, '#fb641b']] as const).map(([m, c]) => <Link key={m} to={`/c/all?max=${m}`} style={{ background: c }}><small>UNDER</small><b>{inr(m)}</b></Link>)}</div></section>

      <section className="section offers"><div className="sec-head"><h2>Special Offers</h2></div>
        <div className="offer-grid">
          <div><b>STYLE10</b><p>10% off up to ₹300 on orders above ₹999</p></div><div><b>FIRST200</b><p>Flat ₹200 off on orders above ₹1,499</p></div>
          <div><b>FREESHIP</b><p>Free delivery on any order</p></div><div><b>Pay by UPI</b><p>Quick, secure checkout with any UPI app</p></div>
        </div><p className="muted small">Coupons apply in the cart. Offer terms are for demo purposes.</p></section>

      <HScroll title="🆕 New Arrivals" list={by('new')} link="/c/all?sort=new" />
      <section className="section"><div className="sec-head"><h2>Top Brands</h2></div>
        <div className="brands">{[...new Set(products.map(p => p.brand))].sort().slice(0, 12).map(b => <Link key={b} to={`/search?brand=${encodeURIComponent(b)}`}>{b}</Link>)}</div></section>
      <HScroll title="⭐ Bestsellers" list={by('bestseller')} link="/c/all?tag=bestseller" />
    </>
  );
}
