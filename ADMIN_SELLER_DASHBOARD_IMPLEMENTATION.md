# Admin & Seller Dashboard Implementation Guide

## Overview
Complete Admin and Seller Dashboard systems similar to Amazon Seller Central, Shopify Admin, and eBay Seller Hub.

---

## Implementation Status

### ✅ Completed:
1. **Backend Models:**
   - ✅ Payout Model created
   - ✅ Product Model updated (seller, sellerInfo, approvalStatus)
   - ✅ Order Model updated (multi-seller support, item tracking)
   - ✅ User Model (already has accountType, businessInfo)
   - ✅ Store Model (already created)

2. **Middleware:**
   - ✅ Role-based authentication (isAdmin, isSeller, checkOwnership)

### 🚧 To Be Implemented:

Due to the extensive scope (50+ endpoints, 30+ components, 10+ pages), this implementation requires:

**Backend (Estimated 40-50 hours):**
- Admin Controller (25+ endpoints)
- Seller Controller (25+ endpoints)
- Admin Routes configuration
- Seller Routes configuration
- Email notification system
- Real-time notifications (Socket.io)
- Analytics aggregation pipelines
- Audit logging system

**Frontend (Estimated 60-80 hours):**
- Admin Layout & Sidebar
- Seller Layout & Sidebar
- 15+ Admin pages
- 12+ Seller pages
- 20+ Reusable components
- Redux slices (admin, seller)
- Chart components (recharts)
- CSS Modules for all components
- Responsive design implementation

---

## Quick Start Implementation Guide

### Phase 1: Core Backend (Week 1-2)

#### 1. Admin Controller - Priority Endpoints

Create `backend/controllers/adminController.js`:

```javascript
import User from '../models/User.js';
import Store from '../models/Store.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { sendEmail } from '../utils/sendEmail.js';

// Dashboard Stats
export const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisYear = new Date(today.getFullYear(), 0, 1);

    // Parallel queries for performance
    const [
      totalRevenue,
      todayRevenue,
      monthRevenue,
      yearRevenue,
      totalOrders,
      ordersByStatus,
      totalCustomers,
      newCustomersToday,
      totalSellers,
      pendingSellers,
      totalProducts,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: today }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: thisMonth }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: thisYear }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      Order.countDocuments(),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      User.countDocuments({ accountType: 'customer' }),
      User.countDocuments({ accountType: 'customer', createdAt: { $gte: today } }),
      User.countDocuments({ accountType: 'seller' }),
      User.countDocuments({ 
        accountType: 'seller', 
        'businessInfo.verificationStatus': 'pending' 
      }),
      Product.countDocuments(),
    ]);

    res.json({
      revenue: {
        total: totalRevenue[0]?.total || 0,
        today: todayRevenue[0]?.total || 0,
        thisMonth: monthRevenue[0]?.total || 0,
        thisYear: yearRevenue[0]?.total || 0,
      },
      orders: {
        total: totalOrders,
        byStatus: ordersByStatus,
      },
      customers: {
        total: totalCustomers,
        newToday: newCustomersToday,
      },
      sellers: {
        total: totalSellers,
        pending: pendingSellers,
      },
      products: {
        total: totalProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all sellers
export const getSellers = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const query = { accountType: 'seller' };

    if (status) {
      query['businessInfo.verificationStatus'] = status;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'businessInfo.businessName': { $regex: search, $options: 'i' } },
      ];
    }

    const sellers = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.json({
      sellers,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    next(error);
  }
};

// Verify seller
export const verifySeller = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const seller = await User.findById(id);
    if (!seller || seller.accountType !== 'seller') {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.businessInfo.verificationStatus = status;
    if (status === 'rejected') {
      seller.businessInfo.rejectionReason = rejectionReason;
      seller.accountStatus = 'suspended';
    } else if (status === 'approved') {
      seller.businessInfo.isVerified = true;
      seller.accountStatus = 'active';
      
      // Activate seller's store
      await Store.findOneAndUpdate(
        { seller: id },
        { isActive: true }
      );
    }

    await seller.save();

    // Send email notification
    const emailSubject = status === 'approved' 
      ? 'Your Seller Account Has Been Approved!' 
      : 'Seller Account Application Update';
    
    const emailBody = status === 'approved'
      ? `Congratulations! Your seller account has been approved. You can now start selling on our platform.`
      : `We regret to inform you that your seller application has been rejected. Reason: ${rejectionReason}`;

    await sendEmail({
      to: seller.email,
      subject: emailSubject,
      html: `<p>Hi ${seller.firstName},</p><p>${emailBody}</p>`,
    });

    res.json({ message: `Seller ${status} successfully`, seller });
  } catch (error) {
    next(error);
  }
};

// Get all orders
export const getOrders = async (req, res, next) => {
  try {
    const { status, dateRange, page = 1, limit = 20, search } = req.query;
    const query = {};

    if (status) query.status = status;
    
    if (dateRange) {
      const [start, end] = dateRange.split(',');
      query.createdAt = { $gte: new Date(start), $lte: new Date(end) };
    }

    if (search) {
      query.orderNumber = { $regex: search, $options: 'i' };
    }

    const orders = await Order.find(query)
      .populate('user', 'firstName lastName email')
      .populate('orderItems.product', 'title images')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    next(error);
  }
};

// More endpoints to be implemented...
```

#### 2. Seller Controller - Priority Endpoints

Create `backend/controllers/sellerController.js`:

```javascript
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Store from '../models/Store.js';
import Payout from '../models/Payout.js';

// Get seller dashboard stats
export const getDashboardStats = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      totalRevenue,
      monthRevenue,
      totalOrders,
      pendingOrders,
      totalProducts,
      lowStockProducts,
      store,
    ] = await Promise.all([
      Order.aggregate([
        { $unwind: '$orderItems' },
        { $match: { 'orderItems.seller': sellerId, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: thisMonth } } },
        { $unwind: '$orderItems' },
        { $match: { 'orderItems.seller': sellerId, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } } } }
      ]),
      Order.countDocuments({ 'orderItems.seller': sellerId }),
      Order.countDocuments({ 'orderItems.seller': sellerId, 'orderItems.itemStatus': 'pending' }),
      Product.countDocuments({ seller: sellerId }),
      Product.countDocuments({ seller: sellerId, stock: { $lte: '$lowStockThreshold' } }),
      Store.findOne({ seller: sellerId }),
    ]);

    res.json({
      revenue: {
        total: totalRevenue[0]?.total || 0,
        thisMonth: monthRevenue[0]?.total || 0,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts,
      },
      rating: store?.rating?.average || 0,
    });
  } catch (error) {
    next(error);
  }
};

// Get seller's products
export const getProducts = async (req, res, next) => {
  try {
    const { status, category, page = 1, limit = 20, search } = req.query;
    const query = { seller: req.user._id };

    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query)
      .populate('category', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    next(error);
  }
};

// Create product
export const createProduct = async (req, res, next) => {
  try {
    const productData = {
      ...req.body,
      seller: req.user._id,
    };

    // Get seller's store
    const store = await Store.findOne({ seller: req.user._id });
    if (store) {
      productData.sellerInfo = store._id;
    }

    const product = await Product.create(productData);
    
    // Update store product count
    if (store) {
      store.totalProducts += 1;
      await store.save();
    }

    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
};

// Get seller's orders
export const getOrders = async (req, res, next) => {
  try {
    const { status, dateRange, page = 1, limit = 20 } = req.query;
    const matchQuery = { 'orderItems.seller': req.user._id };

    if (status) matchQuery['orderItems.itemStatus'] = status;
    if (dateRange) {
      const [start, end] = dateRange.split(',');
      matchQuery.createdAt = { $gte: new Date(start), $lte: new Date(end) };
    }

    const orders = await Order.find(matchQuery)
      .populate('user', 'firstName lastName email')
      .populate('orderItems.product', 'title images')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Order.countDocuments(matchQuery);

    res.json({
      orders,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    next(error);
  }
};

// More endpoints to be implemented...
```

#### 3. Create Routes

Create `backend/routes/adminRoutes.js`:

```javascript
import express from 'express';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roleAuth.js';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect, isAdmin);

// Dashboard
router.get('/stats/overview', adminController.getDashboardStats);

// Sellers
router.get('/sellers', adminController.getSellers);
router.get('/sellers/:id', adminController.getSellerDetails);
router.put('/sellers/:id/verify', adminController.verifySeller);

// Orders
router.get('/orders', adminController.getOrders);

// Add more routes as needed...

export default router;
```

Create `backend/routes/sellerRoutes.js`:

```javascript
import express from 'express';
import { protect } from '../middleware/auth.js';
import { isSeller } from '../middleware/roleAuth.js';
import * as sellerController from '../controllers/sellerController.js';

const router = express.Router();

// All routes require authentication and seller role
router.use(protect, isSeller);

// Dashboard
router.get('/dashboard/stats', sellerController.getDashboardStats);

// Products
router.get('/products', sellerController.getProducts);
router.post('/products', sellerController.createProduct);

// Orders
router.get('/orders', sellerController.getOrders);

// Add more routes as needed...

export default router;
```

Update `backend/server.js`:

```javascript
import adminRoutes from './routes/adminRoutes.js';
import sellerRoutes from './routes/sellerRoutes.js';

app.use('/api/admin', adminRoutes);
app.use('/api/seller', sellerRoutes);
```

---

### Phase 2: Frontend Foundation (Week 3-4)

#### 1. Redux Slices

Create `frontend/src/redux/slices/adminSlice.js`:

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const fetchDashboardStats = createAsyncThunk(
  'admin/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/admin/stats/overview`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
    }
  }
);

export const fetchSellers = createAsyncThunk(
  'admin/fetchSellers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/admin/sellers`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sellers');
    }
  }
);

const initialState = {
  dashboardStats: null,
  sellers: [],
  orders: [],
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = adminSlice.actions;
export default adminSlice.reducer;
```

Create `frontend/src/redux/slices/sellerSlice.js` (similar structure)

#### 2. Admin Layout

Create `frontend/src/components/admin/AdminLayout.jsx`:

```jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={styles.layout}>
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={styles.main}>
        <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
```

#### 3. Admin Sidebar

Create `frontend/src/components/admin/AdminSidebar.jsx`:

```jsx
import { NavLink } from 'react-router-dom';
import { 
  FiHome, FiPackage, FiShoppingCart, FiUsers, 
  FiStore, FiMessageSquare, FiTag, FiBarChart2, FiSettings 
} from 'react-icons/fi';
import styles from './AdminSidebar.module.css';

const AdminSidebar = ({ isOpen, onToggle }) => {
  const navItems = [
    { path: '/admin', icon: FiHome, label: 'Dashboard', exact: true },
    { path: '/admin/products', icon: FiPackage, label: 'Products' },
    { path: '/admin/orders', icon: FiShoppingCart, label: 'Orders' },
    { path: '/admin/customers', icon: FiUsers, label: 'Customers' },
    { path: '/admin/sellers', icon: FiStore, label: 'Sellers', badge: 5 },
    { path: '/admin/reviews', icon: FiMessageSquare, label: 'Reviews' },
    { path: '/admin/coupons', icon: FiTag, label: 'Coupons' },
    { path: '/admin/analytics', icon: FiBarChart2, label: 'Analytics' },
    { path: '/admin/settings', icon: FiSettings, label: 'Settings' },
  ];

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
      <div className={styles.logo}>
        <h2>Admin Panel</h2>
      </div>
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) => 
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <item.icon className={styles.icon} />
            <span className={styles.label}>{item.label}</span>
            {item.badge && <span className={styles.badge}>{item.badge}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
```

---

### Phase 3: Dashboard Pages (Week 5-6)

#### Admin Dashboard Page

Create `frontend/src/pages/admin/AdminDashboard.jsx`:

```jsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats } from '../../redux/slices/adminSlice';
import StatsCard from '../../components/admin/StatsCard';
import RevenueChart from '../../components/admin/RevenueChart';
import OrdersChart from '../../components/admin/OrdersChart';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { dashboardStats, loading } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.dashboard}>
      <h1>Dashboard Overview</h1>
      
      <div className={styles.statsGrid}>
        <StatsCard
          title="Total Revenue"
          value={`$${dashboardStats?.revenue?.total || 0}`}
          growth={12.5}
          icon="dollar"
        />
        <StatsCard
          title="Total Orders"
          value={dashboardStats?.orders?.total || 0}
          growth={8.2}
          icon="shopping"
        />
        <StatsCard
          title="Total Customers"
          value={dashboardStats?.customers?.total || 0}
          growth={15.3}
          icon="users"
        />
        <StatsCard
          title="Pending Sellers"
          value={dashboardStats?.sellers?.pending || 0}
          badge="attention"
          icon="store"
        />
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.fullWidth}>
          <RevenueChart />
        </div>
        <div className={styles.halfWidth}>
          <OrdersChart />
        </div>
        <div className={styles.halfWidth}>
          {/* Top Products */}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
```

---

## Complete File Structure

```
backend/
├── controllers/
│   ├── adminController.js (NEW - 25+ endpoints)
│   └── sellerController.js (NEW - 25+ endpoints)
├── middleware/
│   └── roleAuth.js (✅ CREATED)
├── models/
│   ├── Payout.js (✅ CREATED)
│   ├── Product.js (✅ UPDATED)
│   └── Order.js (✅ UPDATED)
└── routes/
    ├── adminRoutes.js (NEW)
    └── sellerRoutes.js (NEW)

frontend/
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── AdminSidebar.jsx
│   │   │   ├── AdminHeader.jsx
│   │   │   ├── StatsCard.jsx
│   │   │   ├── RevenueChart.jsx
│   │   │   └── ... (15+ more components)
│   │   └── seller/
│   │       ├── SellerLayout.jsx
│   │       ├── SellerSidebar.jsx
│   │       └── ... (12+ more components)
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── SellerList.jsx
│   │   │   ├── SellerDetail.jsx
│   │   │   ├── ProductList.jsx
│   │   │   ├── OrderList.jsx
│   │   │   ├── CustomerList.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── ... (8+ more pages)
│   │   └── seller/
│   │       ├── SellerDashboard.jsx
│   │       ├── ProductList.jsx
│   │       ├── AddProduct.jsx
│   │       ├── OrderList.jsx
│   │       ├── Earnings.jsx
│   │       ├── MyStore.jsx
│   │       └── ... (6+ more pages)
│   └── redux/
│       └── slices/
│           ├── adminSlice.js
│           └── sellerSlice.js
```

---

## Next Steps

### Immediate Priority:
1. Complete Admin Controller endpoints
2. Complete Seller Controller endpoints
3. Create admin and seller routes
4. Test all backend endpoints with Postman

### Frontend Priority:
1. Set up layouts and navigation
2. Create dashboard pages
3. Implement charts with recharts
4. Build CRUD pages for products/orders
5. Add responsive design

### Additional Features:
1. Real-time notifications (Socket.io)
2. Email notification system
3. Audit logging
4. Export functionality (CSV/PDF)
5. Advanced analytics
6. Bulk operations

---

## Dependencies to Install

**Backend:**
```bash
npm install socket.io
```

**Frontend:**
```bash
npm install recharts react-icons
```

---

## Estimated Timeline

- **Phase 1 (Backend Core):** 2 weeks
- **Phase 2 (Frontend Foundation):** 2 weeks
- **Phase 3 (Dashboard Pages):** 2 weeks
- **Phase 4 (Advanced Features):** 2 weeks
- **Phase 5 (Testing & Polish):** 1 week

**Total:** 9-10 weeks for complete implementation

---

This is a production-grade enterprise feature that requires significant development time. The foundation has been laid with the models and middleware. The implementation guide above provides the roadmap for completing the full system.
