import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import type { CartItem, Product } from '../types';

function useLocal<T>(key: string, init: T) {
  const [v, setV] = useState<T>(() => { try { const s = localStorage.getItem('sw_' + key); return s ? (JSON.parse(s) as T) : init; } catch { return init; } });
  useEffect(() => { try { localStorage.setItem('sw_' + key, JSON.stringify(v)); } catch { /* ignore */ } }, [key, v]);
  return [v, setV] as const;
}

export interface Toast { id: number; msg: string; kind: '' | 'ok' | 'err' }
interface Store {
  products: Product[]; loading: boolean; error: string; reload: () => void; byId: (id: number) => Product | undefined;
  cart: CartItem[]; addToCart: (it: CartItem) => void; setQty: (idx: number, d: number) => void; removeAt: (idx: number) => CartItem | undefined; clearCart: () => void;
  wish: number[]; toggleWish: (id: number) => void; addWish: (id: number) => void;
  coupon: string | null; setCoupon: (c: string | null) => void;
  buyNow: CartItem | null; setBuyNow: (i: CartItem | null) => void;
  toasts: Toast[]; toast: (msg: string, kind?: Toast['kind']) => void;
}
const Ctx = createContext<Store | null>(null);
export const useStore = () => { const c = useContext(Ctx); if (!c) throw new Error('StoreProvider missing'); return c; };

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  const [cart, setCart] = useLocal<CartItem[]>('cart', []);
  const [wish, setWish] = useLocal<number[]>('wish', []);
  const [coupon, setCoupon] = useLocal<string | null>('coupon', null);
  const [buyNow, setBuyNow] = useState<CartItem | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let live = true; setLoading(true); setError('');
    api.get<Product[]>('/products').then(p => live && setProducts(p)).catch(e => live && setError(e.message)).finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [tick]);
  const map = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
  const byId = useCallback((id: number) => map.get(id), [map]);

  const toast = useCallback((msg: string, kind: Toast['kind'] = '') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2800);
  }, []);

  const value: Store = {
    products, loading, error, reload: () => setTick(t => t + 1), byId,
    cart, clearCart: () => setCart([]),
    addToCart: it => setCart(c => {
      const ex = c.find(x => x.id === it.id && x.size === it.size && x.color === it.color);
      return ex ? c.map(x => (x === ex ? { ...x, qty: Math.min(10, x.qty + it.qty) } : x)) : [...c, it];
    }),
    setQty: (idx, d) => setCart(c => c.map((x, i) => (i === idx ? { ...x, qty: Math.max(1, Math.min(10, x.qty + d)) } : x))),
    removeAt: idx => { const it = cart[idx]; setCart(c => c.filter((_, i) => i !== idx)); return it; },
    wish, addWish: id => setWish(w => (w.includes(id) ? w : [...w, id])),
    toggleWish: id => setWish(w => (w.includes(id) ? w.filter(x => x !== id) : [...w, id])),
    coupon, setCoupon, buyNow, setBuyNow, toasts, toast,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
