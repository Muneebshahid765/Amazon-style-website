import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import { connectDB } from './config/db.js';
import { configureCloudinary } from './config/cloudinary.js';
import { configureSession } from './config/session.js';
import { configurePassport } from './config/passport.js';
import passport from 'passport';
import { connectRedis } from './config/redis.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import sellerRoutes from './routes/sellerRoutes.js';
import { initializeSocket } from './config/socket.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);

await connectDB();
await connectRedis();
configureCloudinary();
configurePassport();
initializeSocket(server);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(configureSession());
app.use(passport.initialize());
app.use(passport.session());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(limiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: NODE_ENV, dbState: mongoose.connection.readyState });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api', reviewRoutes);
app.use('/api', searchRoutes);
app.use('/api', notificationRoutes);
app.use('/api/seller', sellerRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
});
