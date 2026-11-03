import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { PriceBox } from '../components/Common';
import { inr } from '../lib/format';
import { totals } from '../lib/pricing';
import { useStore } from '../state/store';

const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda'];
const luhn = (n: string) => { let s = 0, d = false; for (let i = n.length - 1; i >= 0; i--) { let x = +n[i]; if (d) { x *= 2; if (x > 9) x -= 9; } s += x; d = !d; } return s % 10 === 0; };
const digits = (s: string) => s.replace(/\D/g, '');
const EMPTY = { card: '', cname: '', exp: '', cvv: '' };

/** Card / net-banking entry page. Nothing typed here is sent, logged or stored: it is validated locally, wiped, and the customer is pointed to QR pay. */
export default function CardPayment({ kind }: { kind: 'card' | 'netbanking' }) {
  const { state } = useLocation();
  const { cart, buyNow, byId, coupon } = useStore();
  const nav = useNavigate();
  const [f, setF] = useState(EMPTY);
  const [bank, setBank] = useState(BANKS[0]);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState(false);
  const isCard = kind === 'card';
  useEffect(() => { document.title = `${isCard ? 'Card' : 'Net Banking'} payment – StyleWagon`; }, [isCard]);

  const items = buyNow ? [buyNow] : cart;
  if (!state || !items.length || !items.some(i => byId(i.id))) return <Navigate to="/checkout" replace />;
  const t = totals(items, byId, coupon, kind === 'card' ? 'card' : 'nb');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setWarn(false);
    if (isCard) {
      const n = digits(f.card), m = /^(\d{2})\/(\d{2})$/.exec(f.exp);
      const bad = !/^\d{13,19}$/.test(n) || !luhn(n) ? 'Enter a valid card number' : !f.cname.trim() ? 'Enter the name on the card'
        : !m || +m[1] < 1 || +m[1] > 12 || new Date(2000 + +m[2], +m[1], 0, 23, 59) < new Date() ? 'Enter a valid, unexpired expiry date' : !/^\d{3,4}$/.test(f.cvv) ? 'Enter a valid CVV' : '';
      if (bad) return setErr(bad);
    }
    setErr(''); setF(EMPTY);   // wipe card details immediately – they are never used
    setWarn(true);
  };

  return (
    <div className="cart-layout">
      <div className="co-sec pay-page">
        <h1 className="page-h">{isCard ? 'Credit / Debit Card' : 'Net Banking'}</h1>
        <p className="pay-amount">Amount to pay <b>{inr(t.total)}</b></p>
        {warn && (
          <div className="pay-warn" role="alert">
            ⚠️ <b>{isCard ? 'This card is not supported.' : 'Net banking is not supported right now.'}</b>
            <div>Please try <b>QR pay</b> instead.</div>
            <button type="button" className="btn buy" onClick={() => nav('/payment', { state })}>PAY {inr(t.total)} WITH QR</button>
          </div>
        )}
        <form className="form pay-form" onSubmit={submit} noValidate>
          {isCard ? <>
            <label>Card number<input inputMode="numeric" maxLength={23} placeholder="1234 5678 9012 3456" autoComplete="off" value={f.card} onChange={e => setF({ ...f, card: digits(e.target.value).slice(0, 19).replace(/(.{4})/g, '$1 ').trim() })} /></label>
            <label>Name on card<input autoComplete="off" value={f.cname} onChange={e => setF({ ...f, cname: e.target.value })} /></label>
            <div className="f2">
              <label>Expiry (MM/YY)<input maxLength={5} placeholder="MM/YY" autoComplete="off" value={f.exp} onChange={e => { const v = digits(e.target.value).slice(0, 4); setF({ ...f, exp: v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v }); }} /></label>
              <label>CVV<input type="password" inputMode="numeric" maxLength={4} autoComplete="off" value={f.cvv} onChange={e => setF({ ...f, cvv: digits(e.target.value) })} /></label>
            </div></> : <label>Select your bank<select value={bank} onChange={e => { setBank(e.target.value); setWarn(false); }}>{BANKS.map(b => <option key={b}>{b}</option>)}</select></label>}
          {err && <div className="err" role="alert">{err}</div>}
          <div className="row-btns">
            <button className="btn buy lg">PAY {inr(t.total)}</button>
            <Link className="btn" to="/checkout">CHANGE PAYMENT METHOD</Link>
          </div>
        </form>
        <p className="muted small">🔒 Your {isCard ? 'card' : 'bank'} details are not stored or sent anywhere.</p>
      </div>
      <div><PriceBox t={t} coupon={coupon} /></div>
    </div>
  );
}
