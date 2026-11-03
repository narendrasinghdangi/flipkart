import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productImg } from '../lib/art';
import { inr } from '../lib/format';
import { useStore } from '../state/store';

/** "Added to cart" card: product photo, size/colour, cart total and Go to cart / Continue shopping. Auto-hides after 7s (pauses on hover). */
export function CartPopup() {
  const { cartPopup, closeCartPopup, cart, byId } = useStore();
  useEffect(() => {
    if (!cartPopup) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCartPopup(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [cartPopup, closeCartPopup]);
  if (!cartPopup) return null;

  const { item, key } = cartPopup;
  const p = byId(item.id);
  if (!p) return null;
  const count = cart.reduce((a, x) => a + x.qty, 0);
  const subtotal = cart.reduce((a, x) => a + (byId(x.id)?.price ?? 0) * x.qty, 0);

  return (
    <div className="cart-pop" role="status" aria-live="polite" key={key}>
      <div className="cp-head"><span className="cp-tick" aria-hidden>✓</span><b>Added to cart</b>
        <button className="cp-x" aria-label="Close" onClick={closeCartPopup}>✕</button></div>
      <div className="cp-body">
        <img src={productImg(p, item.color)} alt="" />
        <div className="cp-info">
          <b className="cp-name">{p.name}</b>
          <span className="muted small">{p.brand} · Size {item.size} · {item.color}</span>
          <span className="cp-price">{inr(p.price)} <s className="muted small">{inr(p.mrp)}</s></span>
        </div>
      </div>
      <div className="cp-sum">Your cart: <b>{count} item{count === 1 ? '' : 's'}</b> · Subtotal <b>{inr(subtotal)}</b></div>
      <div className="cp-btns">
        <Link className="btn buy" to="/cart" onClick={closeCartPopup}>🛒 GO TO CART</Link>
        <button className="btn" onClick={closeCartPopup}>CONTINUE SHOPPING</button>
      </div>
      <div className="cp-bar"><i onAnimationEnd={closeCartPopup} /></div>
    </div>
  );
}
