import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const fixDiscountIssue = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern_ecommerce');
    console.log('✓ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('subscriptionplans');

    console.log('Fetching all subscription plans...');
    const plans = await collection.find({}).toArray();

    console.log(`\nFound ${plans.length} plans:\n`);

    plans.forEach((plan) => {
      console.log(`Plan: ${plan.name}`);
      console.log(`  - ID: ${plan._id}`);
      console.log(`  - Price: $${plan.priceMonthly}`);
      console.log(`  - Discount:`, plan.discount);
      console.log('---\n');
    });

    console.log('\nFixing discount data for all plans...\n');

    const defaultDiscount = {
      isActive: false,
      type: 'percentage',
      value: 0,
      label: '',
      minPrice: 0
    };

    for (const plan of plans) {
      console.log(`Processing plan: ${plan.name}`);
      
      await collection.updateOne(
        { _id: plan._id },
        {
          $set: {
            discount: defaultDiscount
          }
        }
      );
      console.log(`  ✓ Discount object initialized\n`);
    }

    console.log('\n✅ All plans fixed successfully!');
    
    console.log('\n=== FINAL STATE ===\n');
    const updatedPlans = await collection.find({}).toArray();
    updatedPlans.forEach((plan) => {
      console.log(`${plan.name}:`);
      console.log(`  Price: $${plan.priceMonthly}`);
      console.log(`  Discount:`, plan.discount);
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

fixDiscountIssue();