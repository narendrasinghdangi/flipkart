export interface Product {
  id: number; cats: string[]; sub: string; type: string; name: string; brand: string;
  mrp: number; price: number; off: number; rating: number; reviews: number;
  colors: string[]; sizeSet: 'A' | 'N' | 'K' | 'O'; sizes: string[]; fabric: string;
  tags: string[]; kid: boolean; created: number;
  images?: string[]; thumbnails?: string[];
}
export interface CartItem { id: number; size: string; color: string; qty: number }
export interface Address { id: string; name: string; phone: string; pin: string; city: string; line: string; state: string }
export interface Totals {
  count: number; mrp: number; price: number; discount: number; couponOff: number;
  couponValid: boolean; delivery: number; cod: number; total: number;
}
export type PayMethod = 'upi' | 'qr' | 'card' | 'nb' | 'cod';
export interface Order {
  id: string; placedAt: number; skip: number; cancelled: boolean; stage: number; status: string;
  items: { productId: number; name: string; brand: string; price: number; mrp: number; qty: number; size: string; color: string; type: string; kid: boolean }[];
  address: Omit<Address, 'id'>; totals: Totals; coupon: string | null;
  payment: { method: PayMethod; status: string; txnId: string; ref: string };
  guest?: boolean; userEmail?: string | null;
}
export interface AdminUser extends User { createdAt: number; orders: number }
export interface AdminStats { users: number; products: number; orders: number; revenue: number; ordersByStatus: Record<string, number>; recent: Order[] }
export type Role = 'customer' | 'admin';
export interface User { id: string; name: string; email: string; role: Role }
