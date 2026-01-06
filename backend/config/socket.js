import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.email}`);

    socket.join(`user:${socket.user._id}`);

    if (socket.user.role === 'admin') {
      socket.join('admin');
    }

    socket.on('join_order_room', (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`User ${socket.user.email} joined order room: ${orderId}`);
    });

    socket.on('leave_order_room', (orderId) => {
      socket.leave(`order:${orderId}`);
      console.log(`User ${socket.user.email} left order room: ${orderId}`);
    });

    socket.on('typing', ({ orderId, isTyping }) => {
      socket.to(`order:${orderId}`).emit('user_typing', {
        userId: socket.user._id,
        userName: `${socket.user.firstName} ${socket.user.lastName}`,
        isTyping,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.email}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

const emitToAdmin = (event, data) => {
  if (io) {
    io.to('admin').emit(event, data);
  }
};

const emitToOrder = (orderId, event, data) => {
  if (io) {
    io.to(`order:${orderId}`).emit(event, data);
  }
};

export { initializeSocket, getIO, emitToUser, emitToAdmin, emitToOrder };
