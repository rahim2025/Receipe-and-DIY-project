import mongoose from 'mongoose';
import Post from './src/models/post.model.js';
import User from './src/models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

const checkPostFields = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const allPosts = await Post.find({ status: 'published' })
      .select('title type difficulty cookingTime estimatedTime duration totalCostEstimate')
      .sort({ createdAt: -1 });

    console.log(`📊 Analyzing ${allPosts.length} published posts...\n`);

    allPosts.forEach((post, index) => {
      console.log(`${index + 1}. "${post.title}" (${post.type.toUpperCase()})`);
      console.log(`   - Difficulty: ${post.difficulty || '❌ MISSING'}`);
      
      const time = post.cookingTime || post.estimatedTime || post.duration;
      console.log(`   - Time: ${time || '❌ MISSING'}`);
      
      console.log(`   - Cost: $${post.totalCostEstimate || 0}`);
      
      // Check if post would pass default filters
      const hasIssues = [];
      if (!post.difficulty) hasIssues.push('No difficulty');
      if (!time) hasIssues.push('No time');
      if (post.totalCostEstimate > 50) hasIssues.push('Cost > $50 (default filter)');
      
      if (hasIssues.length > 0) {
        console.log(`   ⚠️  Issues: ${hasIssues.join(', ')}`);
      } else {
        console.log(`   ✅ All fields OK`);
      }
      console.log('');
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkPostFields();
