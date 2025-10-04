// Script to make a user an admin
// Usage: node make-admin.js user@email.com

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './src/models/user.model.js';

dotenv.config();

const makeAdmin = async (email) => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            console.log('❌ User not found with email:', email);
            process.exit(1);
        }

        // Check if already admin
        if (user.role === 'admin') {
            console.log('ℹ️  User is already an admin:', user.username);
            process.exit(0);
        }

        // Update to admin
        user.role = 'admin';
        await user.save();

        console.log('✅ Successfully made user an admin!');
        console.log('👤 Username:', user.username);
        console.log('📧 Email:', user.email);
        console.log('🎖️  Role:', user.role);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.log('❌ Please provide an email address');
    console.log('Usage: node make-admin.js user@email.com');
    process.exit(1);
}

makeAdmin(email);
