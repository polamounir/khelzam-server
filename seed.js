import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './src/models/Admin.js';

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const adminExists = await Admin.findOne({ email: 'john@khelzam.com' });

    if (adminExists) {
      console.log('Super Admin already exists');
      process.exit();
    }

    const admin = await Admin.create({
      name: 'Super Admin',
      email: 'john@khelzam.com',
      password: 'john1103',
      role: 'super',
    });

    if (admin) {
      console.log('Super Admin created successfully');
      console.log('Email: john@khelzam.com');
      console.log('Password: john1103');
    }

    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedSuperAdmin();
