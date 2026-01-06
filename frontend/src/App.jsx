import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/common/Layout.jsx';
import PrivateRoute from './components/common/PrivateRoute.jsx';
import AdminLayout from './components/admin/layout/AdminLayout.jsx';
import SellerLayout from './components/seller/SellerLayout.jsx';
import Home from './pages/Home.jsx';
import ProductList from './pages/ProductList.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderSuccess from './pages/OrderSuccess.jsx';
import Profile from './pages/Profile.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminSellerList from './pages/admin/sellers/SellerList.jsx';
import AdminSellerDetail from './pages/admin/sellers/SellerDetail.jsx';
import AdminProductList from './pages/admin/products/ProductList.jsx';
import AdminOrderList from './pages/admin/orders/OrderList.jsx';
import AdminOrderDetail from './pages/admin/orders/OrderDetail.jsx';
import AdminCustomerList from './pages/admin/customers/CustomerList.jsx';
import AdminAnalytics from './pages/admin/analytics/Analytics.jsx';
import AdminCoupons from './pages/admin/marketing/Coupons.jsx';
import AdminSettings from './pages/admin/settings/Settings.jsx';
import SellerDashboard from './pages/seller/SellerDashboard.jsx';
import SellerProductList from './pages/seller/products/ProductList.jsx';
import SellerAddProduct from './pages/seller/products/AddProduct.jsx';
import SellerOrderList from './pages/seller/orders/OrderList.jsx';
import SellerOrderDetail from './pages/seller/orders/OrderDetail.jsx';
import SellerEarnings from './pages/seller/earnings/Earnings.jsx';
import SellerStoreSettings from './pages/seller/store/StoreSettings.jsx';
import SellerReviews from './pages/seller/reviews/Reviews.jsx';
import SellerAnalytics from './pages/seller/analytics/Analytics.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import Wishlist from './pages/Wishlist.jsx';
import Login from './pages/auth/Login.jsx';
import RegisterMultiStep from './pages/auth/RegisterMultiStep.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';
import VerifyEmail from './pages/auth/VerifyEmail.jsx';
import { fetchProfile } from './redux/slices/authSlice';
import styles from './App.module.css';
import './App.css';

function App() {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.ui.theme);

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  return (
    <div className={`${styles.appShell} ${theme === 'light' ? styles.lightMode : ''}`}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterMultiStep />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/products" element={<Layout><ProductList /></Layout>} />
        <Route path="/products/:id" element={<Layout><ProductDetail /></Layout>} />
        <Route path="/cart" element={<Layout><Cart /></Layout>} />
        <Route path="/checkout" element={<Layout><PrivateRoute><Checkout /></PrivateRoute></Layout>} />
        <Route path="/order-success/:orderId" element={<Layout><PrivateRoute><OrderSuccess /></PrivateRoute></Layout>} />
        <Route path="/profile" element={<Layout><PrivateRoute><Profile /></PrivateRoute></Layout>} />
        <Route path="/dashboard" element={<Layout><PrivateRoute><UserDashboard /></PrivateRoute></Layout>} />
        <Route path="/wishlist" element={<Layout><PrivateRoute><Wishlist /></PrivateRoute></Layout>} />
        
        <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="sellers" element={<AdminSellerList />} />
          <Route path="sellers/pending" element={<AdminSellerList />} />
          <Route path="sellers/verified" element={<AdminSellerList />} />
          <Route path="sellers/:id" element={<AdminSellerDetail />} />
          <Route path="products" element={<AdminProductList />} />
          <Route path="products/categories" element={<AdminProductList />} />
          <Route path="products/reviews" element={<AdminProductList />} />
          <Route path="products/low-stock" element={<AdminProductList />} />
          <Route path="orders" element={<AdminOrderList />} />
          <Route path="orders/pending" element={<AdminOrderList />} />
          <Route path="orders/returns" element={<AdminOrderList />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />
          <Route path="customers" element={<AdminCustomerList />} />
          <Route path="customers/segments" element={<AdminCustomerList />} />
          <Route path="customers/support" element={<AdminCustomerList />} />
          <Route path="marketing/coupons" element={<AdminCoupons />} />
          <Route path="marketing/campaigns" element={<AdminCoupons />} />
          <Route path="marketing/promotions" element={<AdminCoupons />} />
          <Route path="finance/revenue" element={<AdminAnalytics />} />
          <Route path="finance/payouts" element={<AdminAnalytics />} />
          <Route path="finance/transactions" element={<AdminAnalytics />} />
          <Route path="reports" element={<AdminAnalytics />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        
        <Route path="/seller" element={<PrivateRoute><SellerLayout /></PrivateRoute>}>
          <Route index element={<SellerDashboard />} />
          <Route path="products" element={<SellerProductList />} />
          <Route path="products/add" element={<SellerAddProduct />} />
          <Route path="products/edit/:id" element={<SellerAddProduct />} />
          <Route path="products/categories" element={<SellerProductList />} />
          <Route path="products/inventory" element={<SellerProductList />} />
          <Route path="products/bulk-upload" element={<SellerAddProduct />} />
          <Route path="orders" element={<SellerOrderList />} />
          <Route path="orders/pending" element={<SellerOrderList />} />
          <Route path="orders/processing" element={<SellerOrderList />} />
          <Route path="orders/returns" element={<SellerOrderList />} />
          <Route path="orders/:id" element={<SellerOrderDetail />} />
          <Route path="earnings" element={<SellerEarnings />} />
          <Route path="earnings/transactions" element={<SellerEarnings />} />
          <Route path="earnings/payouts" element={<SellerEarnings />} />
          <Route path="earnings/reports" element={<SellerEarnings />} />
          <Route path="reviews" element={<SellerReviews />} />
          <Route path="analytics" element={<SellerAnalytics />} />
          <Route path="marketing/promotions" element={<SellerAnalytics />} />
          <Route path="marketing/discounts" element={<SellerAnalytics />} />
          <Route path="store" element={<SellerStoreSettings />} />
          <Route path="settings" element={<SellerStoreSettings />} />
        </Route>
      </Routes>
      <ToastContainer position="bottom-right" theme={theme === 'light' ? 'light' : 'dark'} />
    </div>
  );
}

export default App;
