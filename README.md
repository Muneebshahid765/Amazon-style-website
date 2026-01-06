# NovaMart - MERN E-commerce Platform

A full-stack e-commerce application built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring production-grade session-based authentication, modern UI, and comprehensive security measures.

## Features

### Authentication & Security
- ✅ **Session-based Authentication** with MongoDB session store
- ✅ **Email Verification** with token-based verification
- ✅ **Password Reset** flow with secure tokens
- ✅ **Google OAuth** integration
- ✅ **Rate Limiting** on login attempts
- ✅ **Security Headers** (Helmet)
- ✅ **Input Sanitization** (XSS, NoSQL injection prevention)
- ✅ **CORS** with whitelist
- ✅ **Secure Cookies** (httpOnly, sameSite)

### Backend Features
- RESTful API architecture
- MongoDB with Mongoose ODM
- Comprehensive data models (User, Product, Order, Cart, Review, etc.)
- Role-based access control (User, Admin)
- Email service with Nodemailer
- Cloudinary integration for media management
- Stripe payment integration (ready)

### Frontend Features
- React 18 with Vite
- Redux Toolkit for state management
- React Router DOM for navigation
- Formik + Yup for form validation
- Protected routes with auto-redirect
- Session refresh on token expiry
- Toast notifications
- Dark/Light theme support
- Responsive design with CSS Modules

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd ecommerec-website
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173

MONGODB_URI=mongodb://localhost:27017/mern_ecommerce

SESSION_SECRET=your_super_secret_session_key_change_this_in_production_min_32_chars

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM="NovaMart <no-reply@novamart.com>"

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

STRIPE_SECRET_KEY=sk_test_placeholder

GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:5000/api
```

## Running the Application

### Start MongoDB
Make sure MongoDB is running on your system:
```bash
mongod
```

### Start Backend Server
```bash
cd backend
npm run dev
```
Backend will run on `http://localhost:5000`

### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:5173`

## API Endpoints

### Authentication Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/login` - Login user (rate-limited)
- `GET /api/auth/session/refresh` - Refresh session
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/me` - Get current user profile

### User Routes
- `PUT /api/users/me` - Update user profile
- `GET /api/users` - List all users (Admin only)
- `GET /api/users/cart` - Get user cart
- `POST /api/users/cart` - Add item to cart
- `DELETE /api/users/cart/:productId` - Remove item from cart
- `DELETE /api/users/cart` - Clear cart

### Product Routes
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

### Order Routes
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order by ID
- `PATCH /api/orders/:id` - Update order status (Admin only)

### Admin Routes
- `GET /api/admin/dashboard` - Get dashboard statistics (Admin only)

## Project Structure

```
ecommerec-website/
├── backend/
│   ├── config/
│   │   ├── cloudinary.js
│   │   ├── db.js
│   │   ├── passport.js
│   │   └── session.js
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   ├── productController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── models/
│   │   ├── Cart.js
│   │   ├── Category.js
│   │   ├── Coupon.js
│   │   ├── Notification.js
│   │   ├── Order.js
│   │   ├── Payment.js
│   │   ├── Product.js
│   │   ├── Review.js
│   │   └── User.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── productRoutes.js
│   │   └── userRoutes.js
│   ├── utils/
│   │   ├── ApiFeatures.js
│   │   └── sendEmail.js
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── common/
    │   │   │   ├── Footer.jsx
    │   │   │   ├── Layout.jsx
    │   │   │   ├── Navbar.jsx
    │   │   │   ├── PrivateRoute.jsx
    │   │   │   ├── SectionTitle.jsx
    │   │   │   └── Sidebar.jsx
    │   │   └── product/
    │   │       └── ProductCard.jsx
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   ├── ForgotPassword.jsx
    │   │   │   ├── Login.jsx
    │   │   │   ├── Register.jsx
    │   │   │   ├── ResetPassword.jsx
    │   │   │   └── VerifyEmail.jsx
    │   │   ├── AdminDashboard.jsx
    │   │   ├── Cart.jsx
    │   │   ├── Checkout.jsx
    │   │   ├── Home.jsx
    │   │   ├── ProductDetail.jsx
    │   │   ├── ProductList.jsx
    │   │   └── Profile.jsx
    │   ├── redux/
    │   │   ├── slices/
    │   │   │   ├── authSlice.js
    │   │   │   ├── cartSlice.js
    │   │   │   ├── productSlice.js
    │   │   │   └── uiSlice.js
    │   │   └── store.js
    │   ├── services/
    │   │   └── api.js
    │   ├── styles/
    │   │   ├── Auth.module.css
    │   │   ├── Footer.module.css
    │   │   ├── Layout.module.css
    │   │   ├── Navbar.module.css
    │   │   └── Sidebar.module.css
    │   ├── App.css
    │   ├── App.jsx
    │   ├── App.module.css
    │   ├── index.css
    │   └── main.jsx
    ├── .env
    ├── package.json
    └── vite.config.js
```

## Configuration Notes

### Email Setup (Gmail)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: Google Account → Security → 2-Step Verification → App passwords
3. Use the generated password in `EMAIL_PASS`

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### Cloudinary Setup
1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Get your Cloud Name, API Key, and API Secret from dashboard
3. Add to `.env` file

## Security Best Practices

- ✅ All passwords are hashed using bcrypt
- ✅ Session secrets should be strong and random (min 32 characters)
- ✅ Email verification tokens expire after 24 hours
- ✅ Password reset tokens expire after 10 minutes
- ✅ Sessions expire after 7 days of inactivity
- ✅ Rate limiting on login (5 attempts per 15 minutes)
- ✅ Input sanitization against XSS and NoSQL injection
- ✅ CORS configured with whitelist
- ✅ Secure cookies in production (httpOnly, secure, sameSite)

## Production Deployment

### Environment Variables to Update
- Set `NODE_ENV=production`
- Use strong `SESSION_SECRET` (min 32 random characters)
- Update `CLIENT_URL` to your production domain
- Update `ALLOWED_ORIGINS` with production domains
- Use production MongoDB URI
- Configure production email service
- Add production `COOKIE_DOMAIN` if needed
- Update Google OAuth callback URL

### Additional Security
- Enable HTTPS
- Use environment-specific secrets
- Set up MongoDB authentication
- Configure firewall rules
- Enable MongoDB replica sets for sessions
- Set up monitoring and logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please create an issue in the repository.
