require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../Modals/UserModal');
const { connectDB } = require('../config/db');

async function createAdmin() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    const email = 'yashclass@gmail.com';
    const password = '12345678';
    const fullName = 'Super Admin';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      if (existingAdmin.role === 'admin') {
        console.log('Admin user already exists with email:', email);
        console.log('Updating password...');
        existingAdmin.password = password;
        await existingAdmin.save();
        console.log('Admin password updated successfully');
        process.exit(0);
      } else {
        // Update existing user to admin
        existingAdmin.role = 'admin';
        existingAdmin.password = password;
        await existingAdmin.save();
        console.log('User updated to admin role');
        process.exit(0);
      }
    }

    // Create new admin user
    const admin = await User.create({
      fullName,
      email,
      password,
      role: 'admin',
    });

    console.log('Super admin created successfully!');
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();




