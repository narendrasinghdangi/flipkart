import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { PriceBox } from '../components/Common';
import { ApiError, api } from '../lib/api';
import { inr } from '../lib/format';
import { rememberGuest } from '../lib/guest';
import { clearCheckout, loadHandoff, type Handoff } from '../lib/checkoutState';
import { totals } from '../lib/pricing';
import { useStore } from '../state/store';
import type { Order } from '../types';

// The checkout hands over the address only (items and coupon live in the store); it is also remembered for the tab, so a refresh stays here.

export default function Payment() {
  const loc = useLocation();
  const state: Handoff | null = (loc.state as Handoff | null) ?? loadHandoff();
  const { cart, buyNow, setBuyNow, byId, coupon, setCoupon, clearCart, toast } = useStore();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const items = buyNow ? [buyNow] : cart;
  useEffect(() => { document.title = 'Pay with QR – StyleWagon'; }, []);

  const hasAddr = !!(state?.addressId || state?.address);
  if (!hasAddr || !items.length || !items.some(i => byId(i.id))) return <Navigate to="/checkout" replace />;

  const t = totals(items, byId, coupon, 'qr');
  const paid = async () => {
    setErr(''); setBusy(true);
    try {
      const o = await api.post<Order>('/orders', {
        items: items.map(i => ({ productId: i.id, size: i.size, color: i.color, qty: i.qty })),
        ...(state.addressId ? { addressId: state.addressId } : { address: state.address, ...(state.email ? { email: state.email } : {}) }),
        coupon: t.couponValid ? coupon : undefined, payment: { method: 'qr', ...(state.upi ? { upi: state.upi } : {}) },
      });
      if (o.guest) rememberGuest({ id: o.id, phone: o.address.phone });
      if (buyNow) setBuyNow(null); else clearCart();
      setCoupon(null);
      clearCheckout();
      nav(`/order/${o.id}?new=1`, { replace: true });   // order confirmation page
    } catch (e) {
      setErr('❌ ' + (e as ApiError).message); toast((e as ApiError).message, 'err');
    } finally { setBusy(false); }
  };

  return (
    <div className="cart-layout">
      <div className="co-sec pay-page">
        <h1 className="page-h">Scan &amp; Pay</h1>
        <p className="pay-amount">Amount to pay <b>{inr(t.total)}</b></p>
        {state.upi && <p className="muted small">Paying from UPI ID <b>{state.upi}</b></p>}
        <img className="pay-qr" src="/payment-qr.jpeg" alt="UPI QR code – scan with any UPI app to pay" />
        <ol className="pay-steps">
          <li>Open any UPI app (GPay, PhonePe, Paytm, BHIM) and scan this QR code.</li>
          <li>Enter the amount <b>{inr(t.total)}</b> and complete the payment with your UPI PIN.</li>
          <li>Come back here and tap <b>I HAVE PAID</b>.</li>
        </ol>
        {err && <div className="err" role="alert">{err}</div>}
        <div className="row-btns">
          <button className="btn buy lg" disabled={busy} onClick={() => void paid()}>{busy ? 'CONFIRMING…' : `I HAVE PAID ${inr(t.total)}`}</button>
          <Link className="btn" to="/checkout">CHANGE PAYMENT METHOD</Link>
        </div>
        <p className="muted small">Only tap “I have paid” after your payment succeeds. Your order is processed once we verify the payment.</p>
      </div>
      <div><PriceBox t={t} coupon={coupon} /></div>
    </div>
  );
}
