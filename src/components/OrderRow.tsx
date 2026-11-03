import { Link } from 'react-router-dom';
import { art, productImg } from '../lib/art';
import { useStore } from '../state/store';
import { fmtDate, inr } from '../lib/format';
import type { Order } from '../types';

export function OrderRow({ o }: { o: Order }) {
  const { byId } = useStore();
  return (
    <Link className="order-row" to={`/order/${o.id}`}>
      <div className="o-imgs">{o.items.slice(0, 3).map((i, k) => <img key={k} alt="" src={(p => p ? productImg(p, i.color) : art(i.type, i.color, 0, i.kid))(byId(i.productId))} />)}</div>
      <div className="o-info"><b>{o.items[0].name}{o.items.length > 1 ? ` +${o.items.length - 1} more` : ''}</b><div className="muted small">Order {o.id} · {fmtDate(o.placedAt)}</div></div>
      <div className="o-tot"><b>{inr(o.totals.total)}</b></div>
      <div><span className={`status ${o.cancelled ? 'bad' : o.stage === 4 ? 'ok' : ''}`}>{o.status}</span></div>
    </Link>
  );
}
