import type { ReactElement } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Empty } from './components/Common';
import { Cart, Wishlist } from './pages/Cart';
import Checkout from './pages/Checkout';
import CardPayment from './pages/CardPayment';
import Payment from './pages/Payment';
import Home from './pages/Home';
import Listing from './pages/Listing';
import Login from './pages/Login';
import { OrderDetail, Orders, Track } from './pages/Orders';
import ProductPage from './pages/Product';
import { AdminDashboard, AdminLayout, AdminOrders, AdminImport, AdminProducts, AdminUsers } from './pages/Admin';

// Remount per-URL so filter/selection state resets when the route changes.
const Keyed = ({ children }: { children: (k: string) => ReactElement }) => { const l = useLocation(); return children(l.pathname + l.search); };

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="c/:cat" element={<Keyed>{k => <Listing key={k} />}</Keyed>} />
        <Route path="search" element={<Keyed>{k => <Listing key={k} />}</Keyed>} />
        <Route path="p/:id" element={<Keyed>{k => <ProductPage key={k} />}</Keyed>} />
        <Route path="cart" element={<Cart />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="payment" element={<Payment />} />
        <Route path="payment/card" element={<CardPayment kind="card" />} />
        <Route path="payment/netbanking" element={<CardPayment kind="netbanking" />} />
        <Route path="orders" element={<Orders />} />
        <Route path="order/:id" element={<OrderDetail />} />
        <Route path="track" element={<Track />} />
        <Route path="login" element={<Login />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} /><Route path="orders" element={<AdminOrders />} />
          <Route path="products" element={<AdminProducts />} /><Route path="import" element={<AdminImport />} /><Route path="users" element={<AdminUsers />} />
        </Route>
        <Route path="home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Empty title="Page not found" to="/" />} />
      </Route>
    </Routes>
  );
}
