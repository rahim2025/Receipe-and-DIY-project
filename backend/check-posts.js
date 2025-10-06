import mongoose from 'mongoose';
import Post from './src/models/post.model.js';
import User from './src/models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

const checkPosts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const allPosts = await Post.find({})
      .select('title status type author createdAt')
      .populate('author', 'username')
      .sort({ createdAt: -1 });

    console.log(`\n📊 Total posts in database: ${allPosts.length}\n`);

    const published = allPosts.filter(p => p.status === 'published');
    const drafts = allPosts.filter(p => p.status === 'draft');
    const archived = allPosts.filter(p => p.status === 'archived');

    console.log(`✅ Published: ${published.length}`);
    console.log(`📝 Drafts: ${drafts.length}`);
    console.log(`📦 Archived: ${archived.length}\n`);

    console.log('=== ALL POSTS ===\n');
    allPosts.forEach((post, index) => {
      console.log(`${index + 1}. [${post.status.toUpperCase()}] ${post.type.toUpperCase()} - "${post.title}"`);
      console.log(`   Author: ${post.author?.username || 'Unknown'}`);
      console.log(`   Created: ${post.createdAt.toLocaleDateString()}\n`);
    });

    if (drafts.length > 0) {
      console.log('\n⚠️  ISSUE FOUND: You have draft posts that are NOT showing on HomePage!');
      console.log('   Solution: These posts need to be published to appear on the HomePage.\n');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkPosts();
