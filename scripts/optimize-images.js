#!/usr/bin/env node

/**
 * Image Optimization Script
 * Requires: npm install sharp --save-dev
 * Run: node scripts/optimize-images.js
 */

const fs = require('fs').promises;
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('\n❌ Error: Sharp is not installed.');
  console.error('Please run: npm install sharp --save-dev\n');
  process.exit(1);
}

const optimizationConfig = [
  // Next Drop - massive 10.69MB PNG
  {
    input: 'public/assets/group-121.png',
    outputs: [
      { width: 800, name: 'group-121', format: 'webp', quality: 85 },
      { width: 1600, name: 'group-121@2x', format: 'webp', quality: 85 },
      { width: 800, name: 'group-121-fallback', format: 'jpg', quality: 82 }
    ]
  },
  
  // Lookbook images - 4.77MB, 2.03MB, 2.02MB
  {
    input: 'public/assets/lookbook/clean-and-classic.jpg',
    outputs: [
      { width: 450, name: 'lookbook/clean-and-classic', format: 'webp', quality: 85 },
      { width: 900, name: 'lookbook/clean-and-classic@2x', format: 'webp', quality: 85 },
      { width: 450, name: 'lookbook/clean-and-classic-fallback', format: 'jpg', quality: 80 }
    ]
  },
  {
    input: 'public/assets/lookbook/city-moves.jpg',
    outputs: [
      { width: 450, name: 'lookbook/city-moves', format: 'webp', quality: 85 },
      { width: 900, name: 'lookbook/city-moves@2x', format: 'webp', quality: 85 }
    ]
  },
  {
    input: 'public/assets/lookbook/everyday-essentials.jpg',
    outputs: [
      { width: 450, name: 'lookbook/everyday-essentials', format: 'webp', quality: 85 },
      { width: 900, name: 'lookbook/everyday-essentials@2x', format: 'webp', quality: 85 }
    ]
  },
  {
    input: 'public/assets/lookbook/style-beyond-basics.jpg',
    outputs: [
      { width: 450, name: 'lookbook/style-beyond-basics', format: 'webp', quality: 85 },
      { width: 900, name: 'lookbook/style-beyond-basics@2x', format: 'webp', quality: 85 }
    ]
  },
  
  // Philosophy - 2.02MB
  {
    input: 'public/assets/philosophy-lifestyle.jpg',
    outputs: [
      { width: 800, name: 'philosophy-lifestyle', format: 'webp', quality: 85 },
      { width: 1600, name: 'philosophy-lifestyle@2x', format: 'webp', quality: 85 },
      { width: 800, name: 'philosophy-lifestyle-fallback', format: 'jpg', quality: 80 }
    ]
  },
  
  // Hero poster - 1.85MB (CRITICAL FOR LCP)
  {
    input: 'public/assets/hero-shoes.jpg',
    outputs: [
      { width: 1280, name: 'hero-shoes-mobile', format: 'webp', quality: 82 },
      { width: 1920, name: 'hero-shoes-desktop', format: 'webp', quality: 85 },
      { width: 1920, name: 'hero-shoes-fallback', format: 'jpg', quality: 80 }
    ]
  },
  
  // Newsletter background
  {
    input: 'public/assets/newsletter-bg.png',
    outputs: [
      { width: 1200, name: 'newsletter-bg', format: 'webp', quality: 85 },
      { width: 1200, name: 'newsletter-bg-fallback', format: 'jpg', quality: 80 }
    ]
  },
  
  // Product images
  {
    input: 'public/assets/products/adidas.png',
    outputs: [
      { width: 400, name: 'products/adidas', format: 'webp', quality: 85 },
      { width: 800, name: 'products/adidas@2x', format: 'webp', quality: 85 }
    ]
  }
];

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function optimizeImages() {
  console.log('🖼️  THSIX Image Optimization\n');
  console.log('═'.repeat(60));
  
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let processedCount = 0;
  let skippedCount = 0;
  
  for (const config of optimizationConfig) {
    const inputExists = await fileExists(config.input);
    
    if (!inputExists) {
      console.log(`\n⚠️  Skipped: ${config.input} (not found)`);
      skippedCount++;
      continue;
    }
    
    console.log(`\n📁 Processing: ${config.input}`);
    
    try {
      const inputBuffer = await fs.readFile(config.input);
      const image = sharp(inputBuffer);
      const metadata = await image.metadata();
      
      const originalSizeMB = (inputBuffer.length / 1024 / 1024).toFixed(2);
      totalOriginalSize += inputBuffer.length;
      
      console.log(`   Original: ${metadata.width}x${metadata.height}, ${originalSizeMB} MB`);
      
      for (const output of config.outputs) {
        const outputPath = path.join('public/assets', `${output.name}.${output.format}`);
        const outputDir = path.dirname(outputPath);
        
        // Ensure output directory exists
        await fs.mkdir(outputDir, { recursive: true });
        
        await sharp(inputBuffer)
          .resize(output.width, null, { 
            withoutEnlargement: true,
            fit: 'inside'
          })
          .toFormat(output.format, { quality: output.quality })
          .toFile(outputPath);
        
        const stats = await fs.stat(outputPath);
        const sizeKB = (stats.size / 1024).toFixed(1);
        totalOptimizedSize += stats.size;
        
        console.log(`   ✓ ${output.name}.${output.format}: ${output.width}w, ${sizeKB} KB`);
      }
      
      processedCount++;
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Optimization Summary\n');
  console.log(`   Images processed: ${processedCount}`);
  console.log(`   Images skipped: ${skippedCount}`);
  console.log(`   Original size: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Optimized size: ${(totalOptimizedSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Saved: ${((totalOriginalSize - totalOptimizedSize) / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Reduction: ${(((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100).toFixed(1)}%`);
  console.log('\n✨ Image optimization complete!\n');
}

optimizeImages().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
