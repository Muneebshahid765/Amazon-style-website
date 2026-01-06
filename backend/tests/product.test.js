import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

describe('Product Tests', () => {
  let adminToken;
  let testProduct;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST);

    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'AdminPass123!',
      role: 'admin',
      isVerified: true,
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'AdminPass123!',
      });

    adminToken = loginRes.headers['set-cookie'];
  });

  afterAll(async () => {
    await Product.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Product.deleteMany({});
  });

  describe('GET /api/products', () => {
    beforeEach(async () => {
      await Product.create([
        {
          name: 'Product 1',
          description: 'Description 1',
          price: 100,
          category: 'Electronics',
          stock: 10,
          images: [{ url: 'image1.jpg', public_id: 'img1' }],
        },
        {
          name: 'Product 2',
          description: 'Description 2',
          price: 200,
          category: 'Clothing',
          stock: 20,
          images: [{ url: 'image2.jpg', public_id: 'img2' }],
        },
      ]);
    });

    it('should get all products', async () => {
      const res = await request(app).get('/api/products');

      expect(res.statusCode).toBe(200);
      expect(res.body.products).toHaveLength(2);
    });

    it('should filter products by category', async () => {
      const res = await request(app).get('/api/products?category=Electronics');

      expect(res.statusCode).toBe(200);
      expect(res.body.products).toHaveLength(1);
      expect(res.body.products[0].category).toBe('Electronics');
    });

    it('should filter products by price range', async () => {
      const res = await request(app).get('/api/products?minPrice=150&maxPrice=250');

      expect(res.statusCode).toBe(200);
      expect(res.body.products).toHaveLength(1);
      expect(res.body.products[0].price).toBe(200);
    });
  });

  describe('POST /api/products', () => {
    it('should create product as admin', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Cookie', adminToken)
        .send({
          name: 'New Product',
          description: 'New Description',
          price: 150,
          category: 'Electronics',
          stock: 15,
          images: [{ url: 'newimage.jpg', public_id: 'newimg' }],
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.product).toHaveProperty('name', 'New Product');
    });

    it('should not create product without authentication', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({
          name: 'New Product',
          description: 'New Description',
          price: 150,
          category: 'Electronics',
          stock: 15,
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/products/:id', () => {
    beforeEach(async () => {
      testProduct = await Product.create({
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        category: 'Electronics',
        stock: 10,
        images: [{ url: 'test.jpg', public_id: 'test' }],
      });
    });

    it('should get product by ID', async () => {
      const res = await request(app).get(`/api/products/${testProduct._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.product).toHaveProperty('name', 'Test Product');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/products/${fakeId}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
