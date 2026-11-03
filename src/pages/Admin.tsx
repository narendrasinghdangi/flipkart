import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, NavLink, Outlet } from 'react-router-dom';
import { Empty, Modal } from '../components/Common';
import { COLORS, productImg } from '../lib/art';
import { api } from '../lib/api';
import { fmtDate, inr } from '../lib/format';
import { useAuth } from '../state/auth';
import { useStore } from '../state/store';
import type { AdminStats, AdminUser, Order, Product, Role } from '../types';

/* Client-side guard is only UX – the API enforces the admin role on every /admin route. */
export function AdminLayout() {
  const { user, ready } = useAuth();
  useEffect(() => { document.title = 'Admin – StyleWagon'; }, []);
  if (!ready) return <div className="empty"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login?next=/admin" replace />;
  if (user.role !== 'admin') return <Empty icon="🚫" title="Admins only" text="Your account doesn’t have access to this area." to="/" />;
  return (
    <div className="admin">
      <nav className="admin-nav" aria-label="Admin">
        {[['/admin', 'Dashboard', true], ['/admin/orders', 'Orders', false], ['/admin/products', 'Products', false], ['/admin/import', 'Import JSON', false], ['/admin/users', 'Users', false]].map(([to, label, end]) => (
          <NavLink key={String(to)} to={String(to)} end={Boolean(end)} className={({ isActive }) => (isActive ? 'active' : '')}>{label}</NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}

function useLoad<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => api.get<T>(path).then(d => { setData(d); setErr(''); }).catch(e => setErr((e as Error).message)), [path]);
  useEffect(() => { void load(); }, [load]);
  return { data, err, reload: load };
}
const Loading = ({ err }: { err: string }) => err ? <div className="err">{err}</div> : <div className="empty"><div className="spinner" /></div>;

export function AdminDashboard() {
  const { data, err } = useLoad<AdminStats>('/admin/stats');
  if (!data) return <Loading err={err} />;
  const tiles: [string, string][] = [['Revenue', inr(data.revenue)], ['Orders', String(data.orders)], ['Products', String(data.products)], ['Users', String(data.users)]];
  return (
    <>
      <h1 className="page-h">Dashboard</h1>
      <div className="stat-grid">{tiles.map(([k, v]) => <div key={k} className="stat"><small>{k}</small><b>{v}</b></div>)}</div>
      <div className="od-card"><h3>Orders by status</h3><div className="chips">{Object.entries(data.ordersByStatus).map(([k, v]) => <span key={k} className="status">{k}: {v}</span>)}{!Object.keys(data.ordersByStatus).length && <span className="muted">No orders yet</span>}</div></div>
      <div className="od-card"><h3>Recent orders</h3><OrdersTable rows={data.recent} /></div>
    </>
  );
}

function OrdersTable({ rows, onChange }: { rows: Order[]; onChange?: (o: Order) => void }) {
  const { toast } = useStore();
  const patch = async (o: Order, body: { stage?: number; cancelled?: boolean; paymentVerified?: boolean }) => {
    try { onChange?.(await api.patch<Order>(`/admin/orders/${o.id}`, body)); toast('Order updated', 'ok'); } catch (e) { toast((e as Error).message, 'err'); }
  };
  return (
    <div className="table-wrap"><table className="tbl"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th>{onChange && <th>Update</th>}</tr></thead><tbody>
      {rows.map(o => (
        <tr key={o.id}>
          <td><b>{o.id}</b>{o.guest && <span className="muted small"> · guest</span>}</td>
          <td>{o.address.name}<div className="muted small">{o.userEmail ?? o.address.phone}</div></td><td>{fmtDate(o.placedAt)}</td><td>{inr(o.totals.total)}</td>
          <td>{o.payment.status}{!o.cancelled && onChange && o.payment.status.startsWith('Payment verification') && <> <button className="link" onClick={() => window.confirm(`Mark order ${o.id} as paid? Confirm the ${inr(o.totals.total)} has reached your account.`) && patch(o, { paymentVerified: true })}>Mark paid</button></>}</td><td><span className={`status ${o.cancelled ? 'bad' : o.stage === 4 ? 'ok' : ''}`}>{o.status}</span></td>
          {onChange && <td className="nowrap">{o.cancelled ? '—' : <>
            <select aria-label="Set status" value={o.stage} onChange={e => patch(o, { stage: Number(e.target.value) })}>{['Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'].map((n, i) => <option key={n} value={i}>{n}</option>)}</select>{' '}
            {o.stage < 4 && <button className="link" onClick={() => window.confirm(`Cancel order ${o.id}?`) && patch(o, { cancelled: true })}>Cancel</button>}</>}</td>}
        </tr>
      ))}
      {!rows.length && <tr><td colSpan={7} className="muted">No orders</td></tr>}
    </tbody></table></div>
  );
}

export function AdminOrders() {
  const [q, setQ] = useState(''), [status, setStatus] = useState(''), [page, setPage] = useState(1);
  const [res, setRes] = useState<{ items: Order[]; total: number } | null>(null);
  const [err, setErr] = useState('');
  const limit = 20;
  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (q.trim()) p.set('q', q.trim());
      if (status) p.set('status', status);
      api.get<{ items: Order[]; total: number }>(`/admin/orders?${p}`).then(r => { setRes(r); setErr(''); }).catch(e => setErr((e as Error).message));
    }, 250);
    return () => clearTimeout(t);
  }, [q, status, page]);
  return (
    <>
      <h1 className="page-h">Orders</h1>
      <div className="toolbar"><input placeholder="Search order ID, name, phone, email" aria-label="Search orders" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
        <select aria-label="Filter status" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option>{['Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map(s => <option key={s}>{s}</option>)}</select></div>
      {err && <div className="err">{err}</div>}
      {res ? <div className="od-card"><OrdersTable rows={res.items} onChange={o => setRes(r => r && { ...r, items: r.items.map(x => (x.id === o.id ? { ...x, ...o } : x)) })} />
        <div className="pager"><button className="btn sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button><span>Page {page} of {Math.max(1, Math.ceil(res.total / limit))} · {res.total} orders</span><button className="btn sm" disabled={page * limit >= res.total} onClick={() => setPage(page + 1)}>Next</button></div></div> : !err && <Loading err="" />}
    </>
  );
}

const TYPES = ['tee', 'shirt', 'dress', 'kurta', 'saree', 'pants', 'shorts', 'jacket', 'bag', 'watch', 'shades', 'scarf', 'belt'];
const CAT_IDS = ['men', 'women', 'kids', 'ethnic', 'western', 'accessories'];
const TAGS = ['trending', 'new', 'bestseller'];
const toggle = (a: string[], v: string) => (a.includes(v) ? a.filter(x => x !== v) : [...a, v]);
type Draft = { cats: string[]; sub: string; type: string; name: string; brand: string; mrp: number; price: number; rating: number; reviews: number; colors: string[]; sizeSet: string; fabric: string; tags: string[] };
const blank: Draft = { cats: ['men'], sub: '', type: 'tee', name: '', brand: '', mrp: 999, price: 499, rating: 4, reviews: 0, colors: ['Black'], sizeSet: 'A', fabric: '', tags: [] };

function ProductForm({ initial, onClose, onSaved }: { initial?: Product; onClose: () => void; onSaved: () => void }) {
  const { toast } = useStore();
  const [d, setD] = useState<Draft>(initial ? { cats: initial.cats, sub: initial.sub, type: initial.type, name: initial.name, brand: initial.brand, mrp: initial.mrp, price: initial.price, rating: initial.rating, reviews: initial.reviews, colors: initial.colors, sizeSet: initial.sizeSet, fabric: initial.fabric, tags: initial.tags } : blank);
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD(s => ({ ...s, [k]: v }));
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (d.price > d.mrp) return setErr('Selling price cannot exceed MRP');
    if (!d.cats.length || !d.colors.length) return setErr('Pick at least one category and one colour');
    setBusy(true); setErr('');
    try { initial ? await api.put(`/admin/products/${initial.id}`, d) : await api.post('/admin/products', d); toast(initial ? 'Product updated' : 'Product created', 'ok'); onSaved(); onClose(); }
    catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };
  const num = (k: 'mrp' | 'price' | 'rating' | 'reviews', step = 1) => <input type="number" min={0} max={k === 'rating' ? 5 : undefined} step={step} value={d[k]} onChange={e => set(k, Number(e.target.value))} required />;
  return (
    <Modal onClose={onClose}>
      <h3>{initial ? `Edit product #${initial.id}` : 'Add product'}</h3>
      <form className="form" onSubmit={submit}>
        <label>Name<input value={d.name} maxLength={120} onChange={e => set('name', e.target.value)} required /></label>
        <div className="f2"><label>Brand<input value={d.brand} maxLength={60} onChange={e => set('brand', e.target.value)} required /></label><label>Sub-category<input value={d.sub} maxLength={40} onChange={e => set('sub', e.target.value)} required placeholder="e.g. T-Shirts" /></label></div>
        <div className="f2"><label>Garment art<select value={d.type} onChange={e => set('type', e.target.value)}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></label>
          <label>Sizes<select value={d.sizeSet} onChange={e => set('sizeSet', e.target.value)}><option value="A">XS–XXL</option><option value="N">Waist 28–38</option><option value="K">Kids</option><option value="O">Free size</option></select></label></div>
        <div className="f2"><label>MRP (₹)<>{num('mrp')}</></label><label>Selling price (₹)<>{num('price')}</></label></div>
        <div className="f2"><label>Rating<>{num('rating', 0.1)}</></label><label>Reviews<>{num('reviews')}</></label></div>
        <label>Fabric<input value={d.fabric} maxLength={60} onChange={e => set('fabric', e.target.value)} required /></label>
        <fieldset><legend>Categories</legend>{CAT_IDS.map(c => <label key={c} className="chk inline"><input type="checkbox" checked={d.cats.includes(c)} onChange={() => set('cats', toggle(d.cats, c))} /><span>{c}</span></label>)}</fieldset>
        <fieldset><legend>Colours</legend><div className="swatches">{Object.keys(COLORS).map(c => <label key={c} className="sw" title={c}><input type="checkbox" checked={d.colors.includes(c)} onChange={() => set('colors', toggle(d.colors, c))} /><i style={{ background: COLORS[c] }} /></label>)}</div></fieldset>
        <fieldset><legend>Tags</legend>{TAGS.map(c => <label key={c} className="chk inline"><input type="checkbox" checked={d.tags.includes(c)} onChange={() => set('tags', toggle(d.tags, c))} /><span>{c}</span></label>)}</fieldset>
        {err && <div className="err" role="alert">{err}</div>}
        <div className="row-btns"><button className="btn buy" disabled={busy}>{busy ? 'SAVING…' : 'SAVE'}</button><button type="button" className="btn" onClick={onClose}>CANCEL</button></div>
      </form>
    </Modal>
  );
}

export function AdminProducts() {
  const { data, err, reload } = useLoad<Product[]>('/admin/products');
  const store = useStore();
  const [edit, setEdit] = useState<Product | 'new' | null>(null);
  const [q, setQ] = useState('');
  if (!data) return <Loading err={err} />;
  const saved = () => { void reload(); store.reload(); };
  const remove = async (p: Product) => {
    if (!window.confirm(`Delete “${p.name}”? Past orders keep their snapshot.`)) return;
    try { await api.del(`/admin/products/${p.id}`); store.toast('Product deleted'); saved(); } catch (e) { store.toast((e as Error).message, 'err'); }
  };
  const rows = data.filter(p => `${p.name} ${p.brand} ${p.sub}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <h1 className="page-h">Products ({data.length})</h1>
      <div className="toolbar"><input placeholder="Search products" aria-label="Search products" value={q} onChange={e => setQ(e.target.value)} /><button className="btn primary" onClick={() => setEdit('new')}>+ Add product</button></div>
      <div className="od-card"><div className="table-wrap"><table className="tbl"><thead><tr><th></th><th>Product</th><th>Category</th><th>Price</th><th>Tags</th><th></th></tr></thead><tbody>
        {rows.map(p => <tr key={p.id}><td><img className="thumb" alt="" src={productImg(p)} /></td><td><Link to={`/p/${p.id}`}><b>{p.name}</b></Link><div className="muted small">#{p.id} · {p.brand}</div></td><td>{p.cats.join(', ')}<div className="muted small">{p.sub}</div></td>
          <td>{inr(p.price)} <s className="muted small">{inr(p.mrp)}</s></td><td>{p.tags.join(', ') || '—'}</td><td className="nowrap"><button className="link" onClick={() => setEdit(p)}>Edit</button> · <button className="link" style={{ color: 'var(--red)' }} onClick={() => remove(p)}>Delete</button></td></tr>)}
      </tbody></table></div></div>
      {edit && <ProductForm initial={edit === 'new' ? undefined : edit} onClose={() => setEdit(null)} onSaved={saved} />}
    </>
  );
}

export function AdminUsers() {
  const { data, err, reload } = useLoad<AdminUser[]>('/admin/users');
  const { user } = useAuth();
  const { toast } = useStore();
  if (!data) return <Loading err={err} />;
  const setRole = async (u: AdminUser, role: Role) => {
    try { await api.patch(`/admin/users/${u.id}`, { role }); toast('Role updated', 'ok'); void reload(); } catch (e) { toast((e as Error).message, 'err'); }
  };
  return (
    <>
      <h1 className="page-h">Users ({data.length})</h1>
      <div className="od-card"><div className="table-wrap"><table className="tbl"><thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Orders</th><th>Role</th></tr></thead><tbody>
        {data.map(u => <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{fmtDate(u.createdAt)}</td><td>{u.orders}</td>
          <td><select aria-label={`Role for ${u.email}`} value={u.role} disabled={u.id === user?.id} title={u.id === user?.id ? 'You can’t change your own role' : undefined} onChange={e => setRole(u, e.target.value as Role)}><option value="customer">customer</option><option value="admin">admin</option></select></td></tr>)}
      </tbody></table></div></div>
    </>
  );
}

/* ---------- JSON import: scraped catalogue -> products (conversion happens in the API) ---------- */
interface ImportResult {
  dryRun: boolean; received: number; created: number; updated: number; total?: number;
  skipped: { index: number; id: string; title: string; reason: string }[];
  warnings: { index: number; id: string; title: string; warning: string }[];
  preview: { name: string; brand: string; sub: string; cats: string[]; price: number; mrp: number; off: number; colors: string[]; rating: number; reviews: number; tags: string[]; image: string }[];
}

export function AdminImport() {
  const { toast, reload } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [res, setRes] = useState<ImportResult | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<ImportResult | null>(null);

  const parse = (): unknown | null => {
    if (!text.trim()) { setErr('Choose a .json file or paste JSON first.'); return null; }
    try { return JSON.parse(text); } catch (e) { setErr(`Invalid JSON: ${(e as Error).message}`); return null; }
  };
  const run = async (dry: boolean) => {
    setErr(''); setDone(null);
    const body = parse(); if (body === null) return;
    setBusy(true);
    try {
      const r = await api.post<ImportResult>(`/admin/products/import${dry ? '?dry_run=true' : ''}`, body);
      if (dry) setRes(r); else { setDone(r); setRes(null); setText(''); setFileName(''); reload(); toast(`Imported: ${r.created} new, ${r.updated} updated`, 'ok'); }
    } catch (e) { setErr((e as Error).message); if (dry) setRes(null); } finally { setBusy(false); }
  };
  const onFile = async (f?: File) => {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) { setErr('File is larger than 8 MB.'); return; }
    setText(await f.text()); setFileName(f.name); setRes(null); setDone(null); setErr('');
  };
  const reset = () => { setText(''); setFileName(''); setRes(null); setDone(null); setErr(''); if (fileRef.current) fileRef.current.value = ''; };
  const ok = res ? res.created + res.updated : 0;

  return (
    <>
      <h1 className="page-h">Import products from JSON</h1>
      <div className="od-card">
        <p className="muted small">Upload a scraped catalogue file (<code>{'{ "products": [ … ] }'}</code>). Each item is converted to a store product automatically — category, sub-category, colours, sizes, discount, tags and images — and saved to the <b>products</b> collection. Re-uploading the same file updates existing products (matched by their Flipkart id) instead of duplicating them.</p>
        <div className="import-box">
          <input ref={fileRef} type="file" accept=".json,application/json" aria-label="Choose JSON file" onChange={e => void onFile(e.target.files?.[0])} />
          {fileName && <span className="muted small">{fileName} · {(text.length / 1024).toFixed(0)} KB</span>}
        </div>
        <label className="import-label">…or paste JSON
          <textarea className="import-text" rows={8} spellCheck={false} placeholder='{"products": [ { "id": "…", "title": "…", "category": "t_shirt", … } ]}' value={text} onChange={e => { setText(e.target.value); setRes(null); setDone(null); }} />
        </label>
        {err && <div className="err" role="alert">{err}</div>}
        <div className="row-btns">
          <button className="btn primary" disabled={busy || !text.trim()} onClick={() => void run(true)}>{busy && !res ? 'CHECKING…' : 'PREVIEW'}</button>
          <button className="btn" disabled={busy || !text} onClick={reset}>CLEAR</button>
        </div>
      </div>

      {res && (
        <div className="od-card">
          <h3>Preview – nothing saved yet</h3>
          <div className="chips"><span className="status ok">New: {res.created}</span><span className="status">Will update: {res.updated}</span><span className={`status ${res.skipped.length ? 'bad' : ''}`}>Skipped: {res.skipped.length}</span><span className="status">Warnings: {res.warnings.length}</span></div>
          {res.preview.length > 0 && <div className="table-wrap"><table className="tbl"><thead><tr><th></th><th>Product</th><th>Category</th><th>Colours</th><th>Price</th><th>Rating</th><th>Tags</th></tr></thead><tbody>
            {res.preview.map((p, i) => <tr key={i}><td>{p.image && <img className="thumb" alt="" src={p.image} referrerPolicy="no-referrer" />}</td><td><b>{p.name}</b><div className="muted small">{p.brand}</div></td><td>{p.cats.join(', ')}<div className="muted small">{p.sub}</div></td><td>{p.colors.join(', ')}</td>
              <td>{inr(p.price)} <s className="muted small">{inr(p.mrp)}</s> <span className="muted small">{p.off}% off</span></td><td>{p.rating || '—'} <span className="muted small">({p.reviews.toLocaleString('en-IN')})</span></td><td>{p.tags.join(', ') || '—'}</td></tr>)}
          </tbody></table></div>}
          {ok > res.preview.length && <p className="muted small">Showing the first {res.preview.length} of {ok}.</p>}
          {res.skipped.length > 0 && <details open><summary><b>Skipped ({res.skipped.length})</b> – these rows will not be imported</summary><ul className="import-list">{res.skipped.map(s => <li key={s.index}>#{s.index + 1} {s.id && <code>{s.id}</code>} {s.title} — <span className="err-inline">{s.reason}</span></li>)}</ul></details>}
          {res.warnings.length > 0 && <details><summary><b>Warnings ({res.warnings.length})</b> – imported with adjustments</summary><ul className="import-list">{res.warnings.map((w, i) => <li key={i}>#{w.index + 1} {w.title} — {w.warning}</li>)}</ul></details>}
          <div className="row-btns"><button className="btn buy" disabled={busy || ok === 0} onClick={() => void run(false)}>{busy ? 'IMPORTING…' : `IMPORT ${ok} PRODUCT${ok === 1 ? '' : 'S'}`}</button></div>
        </div>
      )}

      {done && (
        <div className="od-card"><h3>✅ Import complete</h3>
          <div className="chips"><span className="status ok">New: {done.created}</span><span className="status">Updated: {done.updated}</span><span className={`status ${done.skipped.length ? 'bad' : ''}`}>Skipped: {done.skipped.length}</span><span className="status">Total products: {done.total}</span></div>
          <div className="row-btns"><Link className="btn primary" to="/admin/products">VIEW PRODUCTS</Link><Link className="btn" to="/">OPEN STORE</Link></div>
        </div>
      )}
    </>
  );
}
