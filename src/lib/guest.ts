/* Guest orders: order id + delivery phone are kept on this device only (never in the URL). */
const KEY = 'sw_guest_orders';
export interface GuestRef { id: string; phone: string }
export const guestOrders = (): GuestRef[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as GuestRef[]; } catch { return []; } };
const save = (l: GuestRef[]) => { try { localStorage.setItem(KEY, JSON.stringify(l.slice(0, 30))); } catch { /* ignore */ } };
export const rememberGuest = (r: GuestRef) => save([r, ...guestOrders().filter(x => x.id !== r.id)]);
export const forgetGuest = (id: string) => save(guestOrders().filter(x => x.id !== id));
export const guestPhone = (id: string) => guestOrders().find(x => x.id === id)?.phone;
