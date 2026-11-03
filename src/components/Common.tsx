import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { inr } from '../lib/format';
import { productImg } from '../lib/art';
import { COUPONS, totals } from '../lib/pricing';
import { useStore } from '../state/store';
import type { CartItem, Product, Totals } from '../types';

export const Stars = ({ r }: { r: number }) => <span className={`rate-badge ${r < 3 ? 'low' : r < 4 ? 'mid' : ''}`}>{r.toFixed(1)} ★</span>;

export function ProductCard({ p, compact }: { p: Product; compact?: boolean }) {
  const { wish, toggleWish, toast } = useStore();
  const w = wish.includes(p.id);
  return (
    <article className={`card ${compact ? 'compact' : ''}`}>
      <button className={`heart ${w ? 'on' : ''}`} aria-label="Wishlist" aria-pressed={w}
        onClick={() => { toggleWish(p.id); toast(w ? 'Removed from wishlist' : 'Added to wishlist ♥'); }}>♥</button>
      <Link className="card-img" to={`/p/${p.id}`}><img loading="lazy" alt={p.name} src={productImg(p)} /></Link>
      <Link className="card-info" to={`/p/${p.id}`}>
        <div className="brand">{p.brand}</div>
        <div className="name">{p.name}</div>
        <div className="price"><b>{inr(p.price)}</b> <s>{inr(p.mrp)}</s> <span className="off">{p.off}% off</span></div>
        <div className="meta"><Stars r={p.rating} /> <span className="muted">({p.reviews.toLocaleString('en-IN')})</span></div>
        {p.colors.length > 1 && <div className="muted small">{p.colors.length} colours</div>}
      </Link>
    </article>
  );
}

export const HScroll = ({ title, list, link }: { title: ReactNode; list: Product[]; link?: string }) => (
  <section className="section">
    <div className="sec-head"><h2>{title}</h2>{link && <Link className="btn sm" to={link}>VIEW ALL</Link>}</div>
    <div className="hscroll">{list.map(p => <ProductCard key={p.id} p={p} compact />)}</div>
  </section>
);

export function PriceBox({ t, coupon }: { t: Totals; coupon?: string | null }) {
  return (
    <div className="price-box">
      <h3>PRICE DETAILS</h3>
      <div className="row"><span>Price ({t.count} item{t.count > 1 ? 's' : ''})</span><span>{inr(t.mrp)}</span></div>
      <div className="row"><span>Discount</span><span className="green">− {inr(t.discount)}</span></div>
      {t.couponOff > 0 && <div className="row"><span>Coupon ({coupon})</span><span className="green">− {inr(t.couponOff)}</span></div>}
      <div className="row"><span>Delivery Charges</span><span>{t.delivery ? inr(t.delivery) : <span className="green">FREE</span>}</span></div>
      {t.cod > 0 && <div className="row"><span>COD Fee</span><span>{inr(t.cod)}</span></div>}
      <div className="row total"><span>Total Amount</span><span>{inr(t.total)}</span></div>
      <p className="green save">You will save {inr(t.discount + t.couponOff)} on this order</p>
    </div>
  );
}

export function CouponBox({ t, items }: { t: Totals; items: CartItem[] }) {
  const { coupon, setCoupon, toast, byId } = useStore();
  const apply = (raw: string) => {
    const code = raw.trim().toUpperCase();
    if (!COUPONS[code]) return toast('Invalid coupon code', 'err');
    if (!totals(items, byId, code).couponValid) return toast(`Not applicable: ${COUPONS[code].label}`, 'err');
    setCoupon(code); toast(`${code} applied`, 'ok');
  };
  return (
    <div className="coupon-box">
      <h3>COUPONS</h3>
      {coupon && COUPONS[coupon] ? (
        <div className="applied">{t.couponValid ? '✅' : '⚠️'} <b>{coupon}</b> {t.couponValid ? 'applied' : '– ' + COUPONS[coupon].label}
          <button className="link" onClick={() => setCoupon(null)}>REMOVE</button></div>
      ) : (
        <form className="coupon-in" onSubmit={e => { e.preventDefault(); apply(String(new FormData(e.currentTarget).get('c') ?? '')); }}>
          <input name="c" placeholder="Enter coupon code" autoCapitalize="characters" aria-label="Coupon code" /><button className="btn sm primary">APPLY</button>
        </form>
      )}
      <div className="coupon-list">{Object.entries(COUPONS).map(([k, v]) => <button key={k} className="tag-btn" onClick={() => apply(k)}><b>{k}</b> {v.label}</button>)}</div>
    </div>
  );
}

export function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true"><button className="close" aria-label="Close" onClick={onClose}>✕</button>{children}</div>
    </div>
  );
}

export const Empty = ({ icon, title, text, to, cta }: { icon?: string; title: string; text?: string; to?: string; cta?: string }) => (
  <div className="empty">{icon && <div className="big">{icon}</div>}<h2>{title}</h2>{text && <p>{text}</p>}{to && <Link className="btn primary" to={to}>{cta ?? 'Go home'}</Link>}</div>
);
