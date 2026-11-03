import { Link } from 'react-router-dom';
import { CouponBox, Empty, PriceBox } from '../components/Common';
import { productImg } from '../lib/art';
import { inr } from '../lib/format';
import { totals } from '../lib/pricing';
import { useStore } from '../state/store';

export function Cart() {
  const { cart, byId, coupon, setQty, removeAt, addWish, toast, setBuyNow } = useStore();
  const L = cart.map((i, idx) => ({ ...i, idx, p: byId(i.id) })).filter(x => x.p);
  if (!L.length) return <Empty icon="🛒" title="Your cart is empty" text="Add items to it now." to="/" cta="Shop now" />;
  const t = totals(cart, byId, coupon);
  return (
    <div className="cart-layout">
      <div>
        <h1 className="page-h">My Cart ({t.count})</h1>
        {L.map(({ idx, p, size, color, qty }) => p && (
          <div className="cart-item" key={`${p.id}${size}${color}`}>
            <Link to={`/p/${p.id}`}><img alt="" src={productImg(p, color)} /></Link>
            <div className="ci-info">
              <div className="brand">{p.brand}</div><Link className="name" to={`/p/${p.id}`}>{p.name}</Link>
              <div className="muted small">Size: {size} · Colour: {color}</div>
              <div className="price"><b>{inr(p.price * qty)}</b> <s>{inr(p.mrp * qty)}</s> <span className="off">{p.off}% off</span></div>
              <div className="ci-actions">
                <div className="qty"><button aria-label="Decrease" disabled={qty <= 1} onClick={() => setQty(idx, -1)}>−</button><span>{qty}</span><button aria-label="Increase" disabled={qty >= 10} onClick={() => setQty(idx, 1)}>+</button></div>
                <button className="link" onClick={() => { addWish(p.id); removeAt(idx); toast('Moved to wishlist'); }}>SAVE FOR LATER</button>
                <button className="link" onClick={() => { removeAt(idx); toast('Item removed'); }}>REMOVE</button>
              </div>
            </div>
          </div>
        ))}
        <div className="place-bar"><Link className="btn buy lg" to="/checkout" onClick={() => setBuyNow(null)}>PLACE ORDER</Link></div>
      </div>
      <div><CouponBox t={t} items={cart} /><PriceBox t={t} coupon={coupon} /><p className="muted small safe">🔒 Safe and secure payments. 100% authentic products.</p></div>
    </div>
  );
}

export function Wishlist() {
  const { wish, byId } = useStore();
  const list = wish.map(byId).filter((p): p is NonNullable<typeof p> => !!p);
  if (!list.length) return <Empty icon="♥" title="Your wishlist is empty" text="Tap the heart on items you love to save them here." to="/" cta="Explore" />;
  return <><h1 className="page-h">My Wishlist ({list.length})</h1><div className="grid">{list.map(p => <WishCard key={p.id} id={p.id} />)}</div></>;
}
import { ProductCard } from '../components/Common';
function WishCard({ id }: { id: number }) { const { byId } = useStore(); const p = byId(id); return p ? <ProductCard p={p} /> : null; }
