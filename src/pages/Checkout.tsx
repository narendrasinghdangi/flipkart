import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CouponBox, Empty, PriceBox } from '../components/Common';
import { productImg } from '../lib/art';
import { ApiError, api } from '../lib/api';
import { inr } from '../lib/format';
import { COD_AVAILABLE, COD_FEE, totals } from '../lib/pricing';
import { rememberGuest } from '../lib/guest';
import { clearCheckout, loadCheckout, saveCheckout } from '../lib/checkoutState';
import { useAuth } from '../state/auth';
import { useStore } from '../state/store';
import type { Address, Order, PayMethod } from '../types';

const STATES = ['Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];

/** Wait for the login state to settle first, so a refresh restores the right step for the right user. */
export default function Checkout() {
  const { ready } = useAuth();
  if (!ready) return <div className="empty"><div className="spinner" /></div>;
  return <CheckoutInner />;
}

function CheckoutInner() {
  const { user } = useAuth();
  const { cart, buyNow, setBuyNow, byId, coupon, setCoupon, clearCart, toast } = useStore();
  const nav = useNavigate();
  const items = buyNow ? [buyNow] : cart;
  const [saved] = useState(loadCheckout);   // progress from before a refresh
  const [step, setStep] = useState(() => ((user ? saved.addressId : saved.address) && saved.step) || 1);
  const [addrs, setAddrs] = useState<Address[]>([]);
  const [addrId, setAddrId] = useState(user ? saved.addressId ?? '' : '');
  const [guestAddr, setGuestAddr] = useState<Omit<Address, 'id'> | null>(user ? null : saved.address ?? null);
  const [email, setEmail] = useState(user ? '' : saved.email ?? '');
  const [adding, setAdding] = useState(false);
  const [addrErr, setAddrErr] = useState('');
  const [method, setMethod] = useState<PayMethod>(saved.method ?? 'upi');
  const [payErr, setPayErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ upi: '' });

  useEffect(() => {
    if (!user) { setAdding(true); return; }
    api.get<Address[]>('/addresses').then(a => {
      setAddrs(a); setAdding(!a.length);
      const keep = a.some(x => x.id === saved.addressId);   // restored address still exists?
      setAddrId(keep ? saved.addressId as string : a[0]?.id ?? '');
      if (!keep) setStep(1);
    }).catch(e => toast(e.message, 'err'));
  }, [user, toast, saved.addressId]);

  useEffect(() => {   // remember where we are, so a refresh stays on the same step
    saveCheckout({ step, method, ...(user ? { addressId: addrId } : { address: guestAddr ?? undefined, email }) });
  }, [step, method, user, addrId, guestAddr, email]);

  if (!items.length || !items.some(i => byId(i.id))) return <Empty title="Nothing to checkout" to="/" cta="Continue shopping" />;

  const t = totals(items, byId, coupon, method);
  const addr: Omit<Address, 'id'> | undefined = user ? addrs.find(a => a.id === addrId) : guestAddr ?? undefined;

  const saveAddress = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const bad = d.name.trim().length < 2 ? 'Enter your full name' : !/^[6-9]\d{9}$/.test(d.phone) ? 'Enter a valid 10-digit mobile number' : !/^[1-9]\d{5}$/.test(d.pin) ? 'Enter a valid 6-digit pincode' : !d.city.trim() ? 'Enter your city' : d.line.trim().length < 6 ? 'Enter your full address' : '';
    if (bad) return setAddrErr(bad);
    const clean = { name: d.name.trim(), phone: d.phone, pin: d.pin, city: d.city.trim(), line: d.line.trim(), state: d.state };
    if (!user) {
      if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) return setAddrErr('Enter a valid email or leave it blank');
      setGuestAddr(clean); setAdding(false); setAddrErr(''); setStep(2); return;
    }
    try {
      const a = await api.post<Address>('/addresses', clean);
      setAddrs(x => [a, ...x]); setAddrId(a.id); setAdding(false); setAddrErr(''); setStep(2);
    } catch (err) { setAddrErr((err as Error).message); }
  };

  const pay = async () => {
    if (method === 'cod' && !COD_AVAILABLE) return setPayErr('Cash on Delivery is not available for this product.');
    const handoff = user ? { addressId: addrId } : { address: guestAddr, email: email.trim() };
    if (method === 'qr') { nav('/payment', { state: handoff }); return; }
    if (method === 'card') { nav('/payment/card', { state: handoff }); return; }
    if (method === 'nb') { nav('/payment/netbanking', { state: handoff }); return; }
    if (method === 'upi') {   // UPI: validate the ID, then pay by scanning the QR on the payment page
      if (!/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(f.upi.trim())) return setPayErr('Enter a valid UPI ID (e.g. name@bank)');
      setPayErr(''); nav('/payment', { state: { ...handoff, upi: f.upi.trim() } }); return;
    }
    setPayErr(''); setBusy(true);
    const payment = { method };
    try {
      const o = await api.post<Order>('/orders', { items: items.map(i => ({ productId: i.id, size: i.size, color: i.color, qty: i.qty })), ...(user ? { addressId: addrId } : { address: guestAddr, ...(email.trim() ? { email: email.trim() } : {}) }), coupon: t.couponValid ? coupon : undefined, payment });
      if (o.guest) rememberGuest({ id: o.id, phone: o.address.phone });
      if (buyNow) setBuyNow(null); else clearCart();
      setCoupon(null);
      clearCheckout();
      nav(`/order/${o.id}?new=1`, { replace: true });
    } catch (err) {
      const e = err as ApiError;
      setPayErr('❌ ' + e.message); toast(e.code === 'payment_failed' ? 'Payment failed' : e.message, 'err');
    } finally { setBusy(false); }
  };

  const head = (n: number, label: string, extra?: React.ReactNode) => <div className={`co-head ${step === n ? 'on' : step > n ? 'done' : ''}`}><span className="num">{step > n ? '✓' : n}</span><b>{label}</b>{extra}</div>;
  const opts: [PayMethod, string, string][] = [['upi', 'UPI', 'Pay via any UPI app'], ['qr', 'Scan & Pay (QR)', 'Scan with GPay, PhonePe, Paytm, BHIM'], ['card', 'Credit / Debit Card', 'Visa, Mastercard, RuPay'], ['nb', 'Net Banking', 'All major banks'], ['cod', 'Cash on Delivery', COD_AVAILABLE ? `₹${COD_FEE} handling fee` : 'Not available for this product']];

  return (
    <div className="cart-layout">
      <div className="co">
        <div className="co-sec">
          {head(1, 'DELIVERY ADDRESS', step > 1 && addr && <button className="link" onClick={() => { setStep(1); if (!user) setAdding(true); }}>CHANGE</button>)}
          {step === 1 && (
            <div className="co-body">
              {!user && <p className="guest-note">Checking out as a guest. <Link to="/login?next=/checkout">Log in</Link> to use saved addresses and see all your orders in one place.</p>}
              {addrs.map(a => <label key={a.id} className="addr"><input type="radio" name="addr" checked={a.id === addrId} onChange={() => setAddrId(a.id)} /><span><b>{a.name}</b> <small>{a.phone}</small><br />{a.line}, {a.city}, {a.state} – {a.pin}</span></label>)}
              {adding ? (
                <form className="form" noValidate onSubmit={saveAddress}>
                  <h4>Add a new address</h4>
                  <div className="f2"><label>Full name<input name="name" autoComplete="name" required /></label><label>Mobile number<input name="phone" inputMode="numeric" maxLength={10} autoComplete="tel-national" placeholder="10-digit number" required /></label></div>
                  <div className="f2"><label>Pincode<input name="pin" inputMode="numeric" maxLength={6} autoComplete="postal-code" required /></label><label>City<input name="city" autoComplete="address-level2" required /></label></div>
                  <label>Address (house no., building, street, area)<textarea name="line" rows={2} autoComplete="street-address" required /></label>
                  <label>State<select name="state">{STATES.map(s => <option key={s}>{s}</option>)}</select></label>
                  {!user && <label>Email (optional, for order updates)<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>}
                  {addrErr && <div className="err">{addrErr}</div>}
                  <div className="row-btns"><button className="btn buy" type="submit">SAVE & DELIVER HERE</button>{addrs.length > 0 && <button className="btn" type="button" onClick={() => setAdding(false)}>CANCEL</button>}</div>
                  <p className="muted small">Your address is used only to deliver your order.</p>
                </form>
              ) : <><button className="link add-addr" onClick={() => setAdding(true)}>+ Add a new address</button><div className="row-btns"><button className="btn buy" disabled={!addrId} onClick={() => setStep(2)}>DELIVER HERE</button></div></>}
            </div>
          )}
          {step > 1 && addr && <div className="co-body sm"><b>{addr.name}</b> {addr.phone}<br />{addr.line}, {addr.city}, {addr.state} – {addr.pin}</div>}
        </div>
        <div className="co-sec">{head(2, 'ORDER SUMMARY')}
          {step === 2 && <div className="co-body">{items.map(i => { const p = byId(i.id); return p && <div className="mini-item" key={`${i.id}${i.size}${i.color}`}><img alt="" src={productImg(p, i.color)} /><div><b>{p.name}</b><div className="muted small">{p.brand} · Size {i.size} · {i.color} · Qty {i.qty}</div><div><b>{inr(p.price * i.qty)}</b> <s className="muted">{inr(p.mrp * i.qty)}</s></div></div></div>; })}
            <button className="btn buy" style={{ marginTop: 12 }} onClick={() => setStep(3)}>CONTINUE</button></div>}</div>
        <div className="co-sec">{head(3, 'PAYMENT')}
          {step === 3 && (
            <div className="co-body">
              {opts.map(([k, n, d]) => (
                <div key={k} className={`pay-opt ${method === k ? 'sel' : ''}`}>
                  <label className="pay-h"><input type="radio" name="pm" checked={method === k} onChange={() => { setMethod(k); setPayErr(''); }} /><span><b>{n}</b><small>{d}</small></span></label>
                  {method === k && (
                    <div className="pay-f">
                      {k === 'upi' && <><label>UPI ID<input value={f.upi} onChange={e => setF({ ...f, upi: e.target.value })} placeholder="name@bank" autoComplete="off" /></label><p className="muted small">Enter your UPI ID and click <b>PAY</b> – a QR code opens on the next page to complete the payment.</p></>}
                      {k === 'card' && <p className="muted">Click <b>PAY</b> to enter your card details on the next page.</p>}
                      {k === 'nb' && <p className="muted">Click <b>PAY</b> to choose your bank on the next page.</p>}
                      {k === 'qr' && <p className="muted">Click <b>PAY</b> to open the payment page with a QR code. Scan it with any UPI app (GPay, PhonePe, Paytm, BHIM) and pay {inr(t.total)}.</p>}
                      {k === 'cod' && (COD_AVAILABLE
                        ? <p className="muted">Pay in cash or by UPI when your order arrives. A COD fee of {inr(COD_FEE)} applies.</p>
                        : <div className="cod-na" role="alert">🚫 <b>Cash on Delivery is not available for {items.length === 1 ? 'this product' : 'the products in your cart'}.</b><br /><span className="muted small">Please choose UPI, QR, card or net banking to place your order.</span></div>)}
                      {payErr && <div className="err" role="alert">{payErr}</div>}
                      <button className="btn buy lg" disabled={busy || (k === 'cod' && !COD_AVAILABLE)} onClick={pay}>{busy ? 'PROCESSING…' : k === 'cod' ? 'PLACE ORDER' : 'PAY ' + inr(t.total)}</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div>{!buyNow && <CouponBox t={t} items={items} />}<PriceBox t={t} coupon={coupon} /><p className="muted small safe">🔒 Payments are processed over an encrypted connection. Card numbers and CVV are never sent to or stored by this site.</p></div>
      {busy && <div className="overlay" role="alert"><div className="modal center"><div className="spinner" /><h3>{method === 'cod' ? 'Placing your order…' : 'Processing payment…'}</h3><p className="muted">Please do not refresh or press back.</p></div></div>}
    </div>
  );
}

