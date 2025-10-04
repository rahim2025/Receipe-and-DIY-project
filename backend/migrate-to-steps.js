/**
 * Migration Script: Convert Old Posts to New Step-by-Step System
 * 
 * This script migrates existing posts from the old separate
 * cookingSteps/instructions arrays to the new unified steps array.
 * 
 * Usage: node migrate-to-steps.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Post from './src/models/post.model.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Migration function
const migrateToSteps = async () => {
  try {
    console.log('\n🔄 Starting migration to unified steps system...\n');

    // Find all posts that need migration (have cookingSteps or instructions but no steps)
    const postsToMigrate = await Post.find({
      $or: [
        { 
          type: 'recipe',
          cookingSteps: { $exists: true, $ne: [] },
          $or: [
            { steps: { $exists: false } },
            { steps: { $size: 0 } }
          ]
        },
        { 
          type: 'diy',
          instructions: { $exists: true, $ne: [] },
          $or: [
            { steps: { $exists: false } },
            { steps: { $size: 0 } }
          ]
        }
      ]
    });

    console.log(`📊 Found ${postsToMigrate.length} posts to migrate\n`);

    if (postsToMigrate.length === 0) {
      console.log('✅ No posts need migration. All posts are up to date!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Migrate each post
    for (const post of postsToMigrate) {
      try {
        console.log(`   Migrating: ${post.title} (${post.type})`);
        
        // Determine source array based on post type
        const sourceSteps = post.type === 'recipe' 
          ? post.cookingSteps 
          : post.instructions;

        if (!sourceSteps || sourceSteps.length === 0) {
          console.log(`   ⚠️  No steps found for "${post.title}", skipping`);
          continue;
        }

        // Create new steps array with enhanced structure
        post.steps = sourceSteps.map(step => {
          // Generate a title from the instruction if not present
          const title = step.title || 
                       step.instruction.substring(0, 80).trim() + 
                       (step.instruction.length > 80 ? '...' : '');

          return {
            stepNumber: step.stepNumber,
            title: title,
            instruction: step.instruction,
            image: step.image || '',
            video: step.video || '',
            estimatedTime: step.estimatedTime || 0,
            estimatedCost: step.estimatedCost || 0,
            notes: step.notes || '',
            materials: step.materials || []
          };
        });

        // Save the post (pre-save middleware will handle the rest)
        await post.save();
        
        console.log(`   ✅ Migrated successfully (${post.steps.length} steps)`);
        successCount++;

      } catch (error) {
        console.error(`   ❌ Error migrating "${post.title}":`, error.message);
        errors.push({ title: post.title, error: error.message });
        errorCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 Migration Summary');
    console.log('='.repeat(60));
    console.log(`✅ Successfully migrated: ${successCount} posts`);
    console.log(`❌ Failed to migrate: ${errorCount} posts`);
    console.log(`📊 Total processed: ${postsToMigrate.length} posts\n`);

    if (errors.length > 0) {
      console.log('❌ Errors encountered:');
      errors.forEach(({ title, error }) => {
        console.log(`   - "${title}": ${error}`);
      });
      console.log('');
    }

    // Verify migration
    console.log('🔍 Verifying migration...');
    const postsWithSteps = await Post.countDocuments({ 
      steps: { $exists: true, $ne: [] } 
    });
    const recipesWithOldFormat = await Post.countDocuments({ 
      type: 'recipe',
      cookingSteps: { $exists: true, $ne: [] },
      $or: [
        { steps: { $exists: false } },
        { steps: { $size: 0 } }
      ]
    });
    const diyWithOldFormat = await Post.countDocuments({ 
      type: 'diy',
      instructions: { $exists: true, $ne: [] },
      $or: [
        { steps: { $exists: false } },
        { steps: { $size: 0 } }
      ]
    });

    console.log(`   Posts with steps: ${postsWithSteps}`);
    console.log(`   Recipes still needing migration: ${recipesWithOldFormat}`);
    console.log(`   DIY posts still needing migration: ${diyWithOldFormat}\n`);

    if (recipesWithOldFormat === 0 && diyWithOldFormat === 0) {
      console.log('🎉 Migration completed successfully! All posts are now using the unified steps system.\n');
    } else {
      console.log('⚠️  Some posts still need migration. You may want to run this script again.\n');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Statistics function
const showStatistics = async () => {
  try {
    console.log('\n📊 Post Statistics');
    console.log('='.repeat(60));

    const totalPosts = await Post.countDocuments();
    const recipePosts = await Post.countDocuments({ type: 'recipe' });
    const diyPosts = await Post.countDocuments({ type: 'diy' });
    const postsWithSteps = await Post.countDocuments({ 
      steps: { $exists: true, $ne: [] } 
    });
    const postsWithOldCookingSteps = await Post.countDocuments({ 
      cookingSteps: { $exists: true, $ne: [] } 
    });
    const postsWithOldInstructions = await Post.countDocuments({ 
      instructions: { $exists: true, $ne: [] } 
    });

    console.log(`Total Posts: ${totalPosts}`);
    console.log(`  - Recipes: ${recipePosts}`);
    console.log(`  - DIY Projects: ${diyPosts}`);
    console.log(`\nStep Format:`);
    console.log(`  - Using new 'steps': ${postsWithSteps}`);
    console.log(`  - Using old 'cookingSteps': ${postsWithOldCookingSteps}`);
    console.log(`  - Using old 'instructions': ${postsWithOldInstructions}\n`);

    // Get sample post with steps
    const samplePost = await Post.findOne({ 
      steps: { $exists: true, $ne: [] } 
    }).select('title type steps');

    if (samplePost) {
      console.log('📝 Sample migrated post:');
      console.log(`   Title: ${samplePost.title}`);
      console.log(`   Type: ${samplePost.type}`);
      console.log(`   Steps: ${samplePost.steps.length}`);
      if (samplePost.steps.length > 0) {
        const firstStep = samplePost.steps[0];
        console.log(`\n   First Step:`);
        console.log(`     - Number: ${firstStep.stepNumber}`);
        console.log(`     - Title: ${firstStep.title}`);
        console.log(`     - Has Image: ${!!firstStep.image}`);
        console.log(`     - Has Video: ${!!firstStep.video}`);
        console.log(`     - Estimated Time: ${firstStep.estimatedTime} min`);
        console.log(`     - Materials: ${firstStep.materials?.length || 0}`);
      }
    }
    console.log('');

  } catch (error) {
    console.error('❌ Error showing statistics:', error);
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    
    // Show statistics before migration
    console.log('\n📊 Before Migration:');
    await showStatistics();

    // Confirm migration
    console.log('⚠️  This script will migrate all posts to the new unified steps system.');
    console.log('   Old cookingSteps and instructions will be preserved for safety.\n');
    
    // In production, you might want to add a confirmation prompt here
    // For now, we'll proceed automatically
    
    // Run migration
    await migrateToSteps();

    // Show statistics after migration
    console.log('📊 After Migration:');
    await showStatistics();

    console.log('✅ Migration process completed!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
};

// Run the script
main();
