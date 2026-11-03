import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CATS, productImg } from '../lib/art';
import { inr } from '../lib/format';
import { useAuth } from '../state/auth';
import { useStore } from '../state/store';

const Badge = ({ n, cls }: { n: number; cls: string }) => (n ? <em className={`${cls} badge`}>{n}</em> : null);

function Header() {
  const { products, cart, wish } = useStore();
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const loc = useLocation();
  useEffect(() => { setOpen(false); }, [loc.pathname, loc.search]);
  useEffect(() => { const h = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); }; document.addEventListener('click', h); return () => document.removeEventListener('click', h); }, []);
  const v = q.trim().toLowerCase();
  const hits = useMemo(() => (v.length < 2 ? [] : products.filter(p => `${p.name} ${p.brand} ${p.sub}`.toLowerCase().includes(v)).slice(0, 6)), [v, products]);
  const cats = v.length < 2 ? [] : CATS.filter(c => c.name.toLowerCase().includes(v));
  const count = cart.reduce((a, i) => a + i.qty, 0);
  return (
    <header className="hdr">
      <div className="hdr-in">
        <Link className="logo" to="/" aria-label="StyleWagon home"><b>Style<i>Wagon</i></b><small>Explore <em>Plus ✦</em></small></Link>
        <div className="search" ref={box}>
          <form role="search" onSubmit={e => { e.preventDefault(); if (q.trim()) { nav('/search?q=' + encodeURIComponent(q.trim())); setOpen(false); } }}>
            <input type="search" autoComplete="off" placeholder="Search for kurtas, jeans, dresses, brands…" aria-label="Search" value={q}
              onChange={e => { setQ(e.target.value); setOpen(true); }} onKeyDown={e => e.key === 'Escape' && setOpen(false)} />
            <button aria-label="Search">🔍</button>
          </form>
          {open && v.length >= 2 && (
            <div className="suggest">
              {cats.map(c => <Link key={c.id} to={`/c/${c.id}`}>{c.icon} {c.name} <small>in categories</small></Link>)}
              {hits.map(p => <Link key={p.id} to={`/p/${p.id}`}><img alt="" src={productImg(p)} /><span>{p.name}<small>{p.brand} · {inr(p.price)}</small></span></Link>)}
              {!hits.length && !cats.length && <div className="none">No suggestions</div>}
            </div>
          )}
        </div>
        <nav className="hdr-links" aria-label="Account">
          {user ? <><Link to="/orders">👤 <span>{user.name.split(' ')[0]}</span></Link><button className="link" style={{ color: '#fff' }} onClick={logout}>Logout</button></> : <Link to="/login">👤 <span>Login</span></Link>}
          {user?.role === 'admin' && <Link to="/admin">🛠 <span>Admin</span></Link>}
          <Link to="/orders">📦 <span>Orders</span></Link>
          <Link to="/wishlist">♥ <span>Wishlist</span><Badge n={wish.length} cls="wish-badge" /></Link>
          <Link to="/cart">🛒 <span>Cart</span><Badge n={count} cls="cart-badge" /></Link>
        </nav>
      </div>
      <nav className="catnav" aria-label="Categories">
        {CATS.map(c => <NavLink key={c.id} to={`/c/${c.id}`} className={({ isActive }) => (isActive ? 'active' : '')}><span>{c.icon}</span>{c.name}</NavLink>)}
        <Link to="/c/all?off=50" className="sale">🔥 Sale</Link>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="ftr">
      <div className="ftr-in">
        <div><h4>Shop</h4><div className="links">{CATS.map(c => <Link key={c.id} to={`/c/${c.id}`}>{c.name}</Link>)}</div></div>
        <div><h4>Help</h4><div className="links"><Link to="/orders">My Orders</Link><Link to="/track">Track Order</Link><Link to="/cart">Cart</Link><Link to="/wishlist">Wishlist</Link></div></div>
        <div><h4>Policies</h4><div className="links"><span>15-day returns</span><span>₹20 delivery · within 36 hours</span><span>Secure payments</span></div></div>
        <div><h4>About</h4><p className="muted">StyleWagon is a demo fashion store. Payments are simulated and no real transactions occur.</p></div>
      </div>
      <div className="copy">© 2026 StyleWagon · Demo storefront</div>
    </footer>
  );
}

function BottomNav() {
  const { cart, wish } = useStore();
  const count = cart.reduce((a, i) => a + i.qty, 0);
  const item = (to: string, icon: string, label: string, badge?: ReactElement) => (
    <NavLink to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}><span>{icon}</span>{label}{badge}</NavLink>
  );
  return (
    <nav className="bottom-nav" aria-label="Quick navigation">
      {item('/', '🏠', 'Home')}{item('/c/all', '🛍️', 'Shop')}
      {item('/wishlist', '♥', 'Wishlist', <Badge n={wish.length} cls="wish-badge" />)}
      {item('/cart', '🛒', 'Cart', <Badge n={count} cls="cart-badge" />)}
      {item('/orders', '📦', 'Orders')}
    </nav>
  );
}

export function Layout() {
  const { toasts, loading, error, reload } = useStore();
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <>
      <a className="skip" href="#view">Skip to content</a>
      <Header />
      <main id="view" tabIndex={-1}>
        {error ? <div className="empty"><div className="big">⚠️</div><h2>Couldn’t load the catalogue</h2><p>{error}</p><button className="btn primary" onClick={reload}>Retry</button></div>
          : loading ? <div className="empty"><div className="spinner" /><p>Loading…</p></div> : <Outlet />}
      </main>
      <Footer />
      <BottomNav />
      <div id="toasts" aria-live="polite">{toasts.map(t => <div key={t.id} className={`toast ${t.kind}`}>{t.msg}</div>)}</div>
    </>
  );
}
