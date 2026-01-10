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
    const phoneNumber = '+919999999999'; // Placeholder phone number for admin

    // Check if admin already exists by email
    let existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      if (existingAdmin.role === 'admin') {
        console.log('Admin user already exists with email:', email);
        console.log('Updating password...');
        existingAdmin.password = password;
        // Ensure phoneNumber is set if missing
        if (!existingAdmin.phoneNumber) {
          existingAdmin.phoneNumber = phoneNumber;
        }
        await existingAdmin.save();
        console.log('Admin password updated successfully');
        process.exit(0);
      } else {
        // Update existing user to admin
        console.log('Updating existing user to admin role...');
        existingAdmin.role = 'admin';
        existingAdmin.password = password;
        // Ensure phoneNumber is set if missing
        if (!existingAdmin.phoneNumber) {
          existingAdmin.phoneNumber = phoneNumber;
        }
        await existingAdmin.save();
        console.log('User updated to admin role');
        process.exit(0);
      }
    }

    // Check if phone number already exists by another user
    const existingPhone = await User.findOne({ phoneNumber });
    if (existingPhone && existingPhone.email !== email) {
      console.error('Error: Phone number already in use by another user');
      console.error('Please use a different phone number or delete the existing user');
      process.exit(1);
    }

    // If phone number exists and matches our email, use that user
    if (existingPhone && existingPhone.email === email) {
      console.log('User found by phone number, updating to admin...');
      existingPhone.role = 'admin';
      existingPhone.password = password;
      await existingPhone.save();
      console.log('User updated to admin role');
      process.exit(0);
    }

    // Create new admin user
    const admin = await User.create({
      fullName,
      email,
      password,
      phoneNumber,
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








