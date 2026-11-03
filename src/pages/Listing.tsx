import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/Common';
import { CATS, COLORS, soldOut } from '../lib/art';
import { inr } from '../lib/format';
import { useStore } from '../state/store';
import type { Product } from '../types';

const BANDS: [number, number][] = [[0, 499], [500, 999], [1000, 1999], [2000, 3999], [4000, 1e9]];
const bandLabel = ([a, b]: [number, number]) => (b > 1e8 ? `${inr(a)} & above` : a === 0 ? `Under ${inr(b + 1)}` : `${inr(a)} – ${inr(b)}`);
const SORTS: Record<string, [string, (a: Product, b: Product) => number]> = {
  rel: ['Relevance', (a, b) => b.reviews * b.rating - a.reviews * a.rating], new: ['Newest First', (a, b) => b.created - a.created],
  pl: ['Price: Low to High', (a, b) => a.price - b.price], ph: ['Price: High to Low', (a, b) => b.price - a.price],
  disc: ['Discount', (a, b) => b.off - a.off], rate: ['Rating', (a, b) => b.rating - a.rating],
};
interface F { sub: string[]; brand: string[]; color: string[]; size: string[]; bands: number[]; rating: number; off: number; max: number; sort: string; shown: number }
const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

export default function Listing() {
  const { cat = 'all' } = useParams();
  const [sp] = useSearchParams();
  const { products } = useStore();
  const q = (sp.get('q') ?? '').toLowerCase().trim(), tag = sp.get('tag') ?? '';
  const [f, setF] = useState<F>(() => ({
    sub: sp.get('sub')?.split(',') ?? [], brand: sp.get('brand') ? [sp.get('brand') as string] : [], color: [], size: [], bands: [],
    rating: 0, off: Number(sp.get('off')) || 0, max: Number(sp.get('max')) || 0, sort: sp.get('sort') && SORTS[sp.get('sort') as string] ? (sp.get('sort') as string) : 'rel', shown: 12,
  }));
  const [open, setOpen] = useState(false);
  const set = (p: Partial<F>) => setF(s => ({ ...s, shown: 12, ...p }));
  useEffect(() => { document.body.classList.toggle('menu-open', open); return () => document.body.classList.remove('menu-open'); }, [open]);

  const base = useMemo(() => products.filter(p => cat === 'all' || p.cats.includes(cat)), [products, cat]);
  const uniq = (fn: (p: Product) => string[]) => [...new Set(base.flatMap(fn))];
  const subs = uniq(p => [p.sub]).sort(), brands = uniq(p => [p.brand]).sort(), colors = uniq(p => p.colors).sort(), sizes = uniq(p => p.sizes);
  const list = useMemo(() => base.filter(p => {
    if (q && !`${p.name} ${p.brand} ${p.sub} ${p.cats.join(' ')} ${p.fabric} ${p.colors.join(' ')}`.toLowerCase().includes(q)) return false;
    if (f.sub.length && !f.sub.includes(p.sub)) return false;
    if (f.brand.length && !f.brand.includes(p.brand)) return false;
    if (f.color.length && !p.colors.some(c => f.color.includes(c))) return false;
    if (f.size.length && !p.sizes.some(z => f.size.includes(z) && !soldOut(p, z))) return false;
    if (f.bands.length && !f.bands.some(i => p.price >= BANDS[i][0] && p.price <= BANDS[i][1])) return false;
    if (f.max && p.price > f.max) return false;
    if (f.rating && p.rating < f.rating) return false;
    if (f.off && p.off < f.off) return false;
    if (tag && !p.tags.includes(tag)) return false;
    return true;
  }).sort(SORTS[f.sort][1]), [base, f, q, tag]);

  const title = q ? `Results for “${sp.get('q')}”` : cat === 'all' ? (tag === 'trending' ? 'Trending Styles' : tag === 'bestseller' ? 'Bestsellers' : f.sort === 'new' ? 'New Arrivals' : 'All Clothing') : CATS.find(c => c.id === cat)?.name ?? 'Products';
  useEffect(() => { document.title = `${title} – StyleWagon`; }, [title]);
  const active = f.sub.length + f.brand.length + f.color.length + f.size.length + f.bands.length + (f.rating ? 1 : 0) + (f.off ? 1 : 0) + (f.max ? 1 : 0);
  const clear = () => setF(s => ({ ...s, sub: [], brand: [], color: [], size: [], bands: [], max: 0, rating: 0, off: 0, shown: 12 }));

  const Chk = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => <label className="chk"><input type="checkbox" checked={checked} onChange={onChange} /><span>{label}</span></label>;
  return (
    <>
      <div className="crumbs"><Link to="/">Home</Link> › <span>{title}</span></div>
      <div className="list-layout">
        <aside className={`filters ${open ? 'open' : ''}`}>
          <div className="f-head"><h3>Filters</h3><button className="link" onClick={clear}>CLEAR ALL</button><button className="close" aria-label="Close" onClick={() => setOpen(false)}>✕</button></div>
          <details open><summary>CATEGORY</summary>{subs.map(x => <Chk key={x} label={x} checked={f.sub.includes(x)} onChange={() => set({ sub: toggle(f.sub, x) })} />)}</details>
          <details open><summary>PRICE</summary>{BANDS.map((b, i) => <Chk key={i} label={bandLabel(b)} checked={f.bands.includes(i)} onChange={() => set({ bands: toggle(f.bands, i) })} />)}</details>
          <details open><summary>BRAND</summary>{brands.map(x => <Chk key={x} label={x} checked={f.brand.includes(x)} onChange={() => set({ brand: toggle(f.brand, x) })} />)}</details>
          <details><summary>SIZE</summary><div className="size-chips">{sizes.map(x => <label key={x} className="chip"><input type="checkbox" checked={f.size.includes(x)} onChange={() => set({ size: toggle(f.size, x) })} /><span>{x}</span></label>)}</div></details>
          <details><summary>COLOUR</summary><div className="swatches">{colors.map(x => <label key={x} className="sw" title={x}><input type="checkbox" checked={f.color.includes(x)} onChange={() => set({ color: toggle(f.color, x) })} /><i style={{ background: COLORS[x] }} /></label>)}</div></details>
          <details><summary>CUSTOMER RATING</summary>{[4, 3].map(r => <label key={r} className="chk"><input type="radio" name="rating" checked={f.rating === r} onChange={() => set({ rating: r })} /><span>{r}★ & above</span></label>)}</details>
          <details><summary>DISCOUNT</summary>{[30, 50, 60].map(r => <label key={r} className="chk"><input type="radio" name="off" checked={f.off === r} onChange={() => set({ off: r })} /><span>{r}% or more</span></label>)}</details>
          <div className="f-foot"><button className="btn primary" onClick={() => setOpen(false)}>SHOW {list.length} ITEMS</button></div>
        </aside>
        <div className="list-main">
          <div className="list-head">
            <div><h1>{title}</h1><span className="muted">{list.length} products</span></div>
            <div className="list-tools"><button className="btn" onClick={() => setOpen(true)}>⚙ Filters{active ? ` (${active})` : ''}</button>
              <label className="sort"><span>Sort by</span><select value={f.sort} onChange={e => set({ sort: e.target.value })}>{Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v[0]}</option>)}</select></label></div>
          </div>
          {list.length ? (
            <>
              <div className="grid">{list.slice(0, f.shown).map(p => <ProductCard key={p.id} p={p} />)}</div>
              {list.length > f.shown && <div className="center"><button className="btn primary" onClick={() => setF(s => ({ ...s, shown: s.shown + 12 }))}>LOAD MORE</button></div>}
            </>
          ) : <div className="empty"><div className="big">🧵</div><h2>No matching products</h2><p>Try removing a few filters.</p><button className="btn primary" onClick={clear}>Clear filters</button></div>}
        </div>
        {open && <div className="scrim" style={{ display: 'block', position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 80 }} onClick={() => setOpen(false)} />}
      </div>
    </>
  );
}
