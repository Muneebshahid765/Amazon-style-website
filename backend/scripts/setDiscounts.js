import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const setDiscounts = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern_ecommerce');
    console.log('✓ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('subscriptionplans');

    // Set discount for AirPods Pro Max Premium
    console.log('Setting discount for AirPods Pro Max Premium...');
    await collection.updateOne(
      { name: 'AirPods Pro Max Premium' },
      {
        $set: {
          discount: {
            isActive: true,
            type: 'percentage',
            value: 30,
            label: 'NEW YEAR OFFER 30% OFF',
            startsAt: new Date('2026-01-12'),
            endsAt: new Date('2026-01-14'),
            minPrice: 0
          }
        }
      }
    );
    console.log('✓ Discount set for AirPods Pro Max Premium\n');

    // Set discount for HeadPhone Pro Max Premium
    console.log('Setting discount for HeadPhone Pro Max Premium...');
    await collection.updateOne(
      { name: 'HeadPhone Pro Max Premium' },
      {
        $set: {
          discount: {
            isActive: true,
            type: 'percentage',
            value: 30,
            label: 'NEW YEAR OFFER 30% OFF',
            startsAt: new Date('2026-01-12'),
            endsAt: new Date('2026-01-14'),
            minPrice: 0
          }
        }
      }
    );
    console.log('✓ Discount set for HeadPhone Pro Max Premium\n');

    console.log('\n=== FINAL STATE ===\n');
    const plans = await collection.find({}).toArray();
    plans.forEach((plan) => {
      console.log(`${plan.name}:`);
      console.log(`  Price: $${plan.priceMonthly}`);
      console.log(`  Discount Active: ${plan.discount?.isActive}`);
      console.log(`  Discount Value: ${plan.discount?.value}%`);
      console.log(`  Discount Label: ${plan.discount?.label}`);
      console.log('');
    });

    await mongoose.connection.close();
    console.log('✓ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

setDiscounts();
