import type { CartItem, PayMethod, Product, Totals } from '../types';

/* Mirrors the server rules (server recomputes everything on order placement). */
export interface Coupon { label: string; min: number; calc: (t: number) => number; freeShip?: boolean }
export const COUPONS: Record<string, Coupon> = {
  STYLE10: { label: '10% off up to ₹300 on orders above ₹999', min: 999, calc: t => Math.min(300, Math.round(t * 0.1)) },
  FIRST200: { label: '₹200 off on orders above ₹1,499', min: 1499, calc: () => 200 },
  FREESHIP: { label: 'Free delivery on any order', min: 0, calc: () => 0, freeShip: true },
};
export const COD_FEE = 29;
export const COD_AVAILABLE = false; // mirrors the server: Cash on Delivery is not offered right now

export function totals(items: CartItem[], byId: (id: number) => Product | undefined, code?: string | null, method?: PayMethod): Totals {
  const L = items.map(i => ({ i, p: byId(i.id) })).filter((x): x is { i: CartItem; p: Product } => !!x.p);
  const mrp = L.reduce((a, x) => a + x.p.mrp * x.i.qty, 0);
  const price = L.reduce((a, x) => a + x.p.price * x.i.qty, 0);
  const c = code && COUPONS[code] && price >= COUPONS[code].min ? COUPONS[code] : null;
  const couponOff = c ? c.calc(price) : 0;
  const delivery = !price || price - couponOff >= 499 || c?.freeShip ? 0 : 49;
  const cod = method === 'cod' && price ? COD_FEE : 0;
  return { count: L.reduce((a, x) => a + x.i.qty, 0), mrp, price, discount: mrp - price, couponOff, couponValid: !!c, delivery, cod, total: price - couponOff + delivery + cod };
}
