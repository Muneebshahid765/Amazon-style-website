import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/User.js';

describe('Authentication Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message');
    });

    it('should not register user with existing email', async () => {
      await User.create({
        firstName: 'Existing',
        lastName: 'User',
        email: 'existing@example.com',
        password: 'Password123!',
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'existing@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        });

      expect(res.statusCode).toBe(400);
    });

    it('should validate password strength', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          password: 'weak',
          confirmPassword: 'weak',
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        });

      await User.findOneAndUpdate(
        { email: 'test@example.com' },
        { isVerified: true }
      );
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('user');
    });

    it('should not login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        });

      expect(res.statusCode).toBe(401);
    });

    it('should not login unverified user', async () => {
      await User.findOneAndUpdate(
        { email: 'test@example.com' },
        { isVerified: false }
      );

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken;

    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        });

      await User.findOneAndUpdate(
        { email: 'test@example.com' },
        { isVerified: true }
      );

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      authToken = loginRes.headers['set-cookie'];
    });

    it('should get current user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', authToken);

      expect(res.statusCode).toBe(200);
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should not get profile without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.statusCode).toBe(401);
    });
  });
});
