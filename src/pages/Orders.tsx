import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Empty, PriceBox } from '../components/Common';
import { art, productImg } from '../lib/art';
import { api } from '../lib/api';
import { forgetGuest, guestOrders, guestPhone, rememberGuest } from '../lib/guest';
import { fmtDate, fmtTime, inr } from '../lib/format';
import { DELIVERY_HOURS } from '../lib/pricing';
import { useAuth } from '../state/auth';
import { useStore } from '../state/store';
import { OrderRow } from '../components/OrderRow';
import type { Order } from '../types';

const STAGES: [string, number][] = [['Order Placed', 0], ['Packed', 6 * 60], ['Shipped', 18 * 60], ['Out for Delivery', 30 * 60], ['Delivered', DELIVERY_HOURS * 60]]; // minutes after placing, mirrors the server
export const Status = ({ o }: { o: Order }) => <span className={`status ${o.cancelled ? 'bad' : o.stage === 4 ? 'ok' : ''}`}>{o.status}</span>;

export function Tracker({ o }: { o: Order }) {
  if (o.cancelled) return <div className="cancelled">❌ This order was cancelled. {o.payment.status.startsWith('Refund') && 'Your refund will be processed to the original payment method in 5–7 business days.'}</div>;
  return (
    <div className="tracker">{STAGES.map(([n, m], i) => (
      <div key={n} className={`step ${i <= o.stage ? 'done' : ''} ${i === o.stage ? 'cur' : ''}`}>
        <span className="dot">{i < o.stage || o.stage === 4 ? '✓' : ''}</span><b>{n}</b><small>{i <= o.stage ? fmtTime(o.placedAt + Math.max(0, m - o.skip) * 6e4) : 'Pending'}</small>
      </div>))}</div>
  );
}

function TrackForm() {
  const nav = useNavigate();
  const [err, setErr] = useState('');
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget), id = String(d.get('id') ?? '').trim().toUpperCase(), phone = String(d.get('phone') ?? '').trim();
    if (!id) return setErr('Enter your order ID');
    if (!/^[6-9]\d{9}$/.test(phone)) return setErr('Enter the 10-digit mobile number used on the order');
    setErr(''); rememberGuest({ id, phone }); nav(`/order/${encodeURIComponent(id)}`);
  };
  return (
    <form className="track-form wrap" onSubmit={submit}>
      <input name="id" placeholder="Order ID (e.g. SW1234567890)" aria-label="Order ID" />
      <input name="phone" inputMode="numeric" maxLength={10} placeholder="Mobile number on the order" aria-label="Mobile number" onChange={e => { e.target.value = e.target.value.replace(/\D/g, ''); }} />
      <button className="btn primary">TRACK</button>
      {err && <div className="err" style={{ flexBasis: '100%' }}>{err}</div>}
    </form>
  );
}

export function Orders() {
  const { user, ready } = useAuth();
  const [list, setList] = useState<Order[] | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    document.title = 'My Orders – StyleWagon';
    if (!ready) return;
    const refs = guestOrders();
    const mine = user ? api.get<Order[]>('/orders') : Promise.resolve<Order[]>([]);
    const guests = Promise.all(refs.map(r => api.get<Order>(`/orders/guest/${encodeURIComponent(r.id)}?phone=${r.phone}`).catch(() => { forgetGuest(r.id); return null; })));
    Promise.all([mine, guests]).then(([m, g]) => setList([...m, ...g.filter((o): o is Order => !!o)].sort((a, b) => b.placedAt - a.placedAt))).catch(e => setErr(e.message));
  }, [user, ready]);
  if (!ready || (!list && !err)) return <div className="empty"><div className="spinner" /></div>;
  if (err) return <Empty icon="⚠️" title="Couldn’t load orders" text={err} />;
  return (
    <>
      <h1 className="page-h">My Orders</h1>
      {!user && <p className="guest-note">You’re not logged in. Orders placed on this device are shown below. <Link to="/login?next=/orders">Log in</Link> to see all your orders.</p>}
      <TrackForm />
      {list && list.length ? list.map(o => <OrderRow key={o.id} o={o} />) : <Empty icon="📦" title="No orders yet" text="When you place an order, it will show up here." to="/" cta="Start shopping" />}
    </>
  );
}

export function OrderDetail() {
  const { id = '' } = useParams();
  const [sp] = useSearchParams();
  const { user, ready } = useAuth();
  const { toast, byId } = useStore();
  const [o, setO] = useState<Order | null>(null);
  const [err, setErr] = useState('');
  const load = useCallback(async () => {
    const enc = encodeURIComponent(id);
    try {
      if (user) { try { setO(await api.get<Order>(`/orders/${enc}`)); return; } catch (e) { if ((e as { status?: number }).status !== 404) throw e; } }
      const phone = guestPhone(id);
      if (!phone) { setErr('We couldn’t find this order. Enter your order ID and mobile number to track it.'); return; }
      setO(await api.get<Order>(`/orders/guest/${enc}?phone=${phone}`));
    } catch (e) { setErr((e as Error).message); }
  }, [id, user]);
  useEffect(() => { if (!ready) return; void load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [ready, load]);
  if (err) return <><Empty title="Order not found" text={err} /><TrackForm /></>;
  if (!o) return <div className="empty"><div className="spinner" /></div>;

  const act = async (what: 'advance' | 'cancel') => {
    if (what === 'cancel' && !window.confirm('Cancel this order?')) return;
    try {
      const path = o.guest ? `/orders/guest/${encodeURIComponent(o.id)}/${what}` : `/orders/${encodeURIComponent(o.id)}/${what}`;
      setO(await api.post<Order>(path, o.guest ? { phone: guestPhone(o.id) ?? o.address.phone } : {}));
      toast(what === 'cancel' ? 'Order cancelled' : 'Status updated');
    } catch (e) { toast((e as Error).message, 'err'); }
  };
  const eta = o.placedAt + DELIVERY_HOURS * 36e5;
  return (
    <>
      {sp.get('new') ? <div className="success"><div className="tick">✓</div><h1>Order placed successfully!</h1><p>Thank you, {o.address.name}. {o.payment.method === 'cod' ? `Please keep ${inr(o.totals.total)} ready at delivery.` : o.payment.status.startsWith('Payment verification') ? `We have noted your QR payment of ${inr(o.totals.total)}. Your order will be processed once the payment is verified.` : `Payment of ${inr(o.totals.total)} received.`}</p>
        {o.guest && <p className="guest-note">Save your order ID <b>{o.id}</b>. To track it later you’ll need it with the mobile number you entered.</p>}</div>
        : <div className="crumbs"><Link to="/orders">My Orders</Link> › <span>{o.id}</span></div>}
      <div className="order-det">
        <div className="od-card">
          <div className="od-head"><div><h2>Order {o.id}</h2><span className="muted small">Placed on {fmtDate(o.placedAt)}</span></div><Status o={o} /></div>
          <Tracker o={o} />
          {!o.cancelled && o.stage < 4 && <>
            <p className="muted small">Expected delivery within <b>{DELIVERY_HOURS} hours</b> – by <b>{fmtDate(eta, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</b>.</p>
            <div className="row-btns"><button className="btn" onClick={() => act('advance')}>⏩ Demo: advance status</button>{o.stage < 2 && <button className="btn danger" onClick={() => act('cancel')}>CANCEL ORDER</button>}</div></>}
          {!o.cancelled && o.stage === 4 && <p className="green"><b>Delivered.</b> Returns are open for 15 days.</p>}
        </div>
        <div className="od-card"><h3>Items</h3>{o.items.map((i, k) => <div className="mini-item" key={k}><img alt="" src={(p => p ? productImg(p, i.color) : art(i.type, i.color, 0, i.kid))(byId(i.productId))} /><div><Link to={`/p/${i.productId}`}><b>{i.name}</b></Link><div className="muted small">{i.brand} · Size {i.size} · {i.color} · Qty {i.qty}</div><b>{inr(i.price * i.qty)}</b></div></div>)}</div>
        <div className="od-grid">
          <div className="od-card"><h3>Delivery address</h3><p><b>{o.address.name}</b><br />{o.address.line}<br />{o.address.city}, {o.address.state} – {o.address.pin}<br />Phone: {o.address.phone}</p></div>
          <div className="od-card"><h3>Payment</h3><p>{o.payment.ref}<br /><span className="muted small">{o.payment.status}{o.payment.txnId ? ` · ${o.payment.txnId}` : ''}</span></p><PriceBox t={o.totals} coupon={o.coupon} /></div>
        </div>
        <div className="row-btns"><button className="btn" onClick={() => window.print()}>🖨 Print invoice</button><Link className="btn primary" to="/">Continue shopping</Link></div>
      </div>
    </>
  );
}

export const Track = () => <><h1 className="page-h">Track your order</h1><TrackForm /><p className="muted small">Use the order ID and the mobile number you gave at checkout. No account needed.</p></>;
