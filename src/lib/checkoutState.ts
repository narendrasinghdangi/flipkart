/* Remembers checkout progress across a page refresh. sessionStorage = this browser tab only, gone when the tab closes.
   Holds the step, payment method and the chosen address (saved-address id for logged-in users; the typed address for guests).
   Never holds card, CVV or UPI details. Cleared as soon as an order is placed. */
import type { Address, PayMethod } from '../types';

const KEY = 'sw_checkout_v1';
export interface SavedCheckout { step?: number; method?: PayMethod; addressId?: string; address?: Omit<Address, 'id'>; email?: string }
export interface Handoff { addressId?: string; address?: Omit<Address, 'id'> | null; email?: string; upi?: string }  // upi: payer's UPI ID, router state only (never saved)

export function loadCheckout(): SavedCheckout {
  try { const v = JSON.parse(sessionStorage.getItem(KEY) ?? '{}'); return v && typeof v === 'object' ? v : {}; } catch { return {}; }
}
export function saveCheckout(s: SavedCheckout) { try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable */ } }
export function clearCheckout() { try { sessionStorage.removeItem(KEY); } catch { /* ignore */ } }

/** Address hand-over for the /payment pages when the router state is missing (e.g. page opened in a new tab). */
export function loadHandoff(): Handoff | null {
  const s = loadCheckout();
  return s.addressId ? { addressId: s.addressId } : s.address ? { address: s.address, email: s.email ?? '' } : null;
}
