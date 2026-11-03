export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
export const fmtDate = (t: number | Date, o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) => new Date(t).toLocaleDateString('en-IN', o);
export const fmtTime = (t: number) => new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
