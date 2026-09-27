#!/usr/bin/env node
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsDir = path.resolve(__dirname, '../public/assets');

/**
 * Advanced image optimization focusing on Lighthouse-reported savings.
 * Creates properly sized responsive variants based on actual rendered dimensions.
 */

const optimizations = [
  // ── Brand Product Images (300px max display) ──
  {
    name: 'adidas',
    src: path.join(assetsDir, 'products/adidas.png'),
    outDir: path.join(assetsDir, 'products'),
    widths: [300, 600], // 1x and 2x for 300px cards
    quality: 85,
    format: 'webp',
    preserveAlpha: true
  },
  {
    name: 'nike',
    src: path.join(assetsDir, 'products/nike.jpg'),
    outDir: path.join(assetsDir, 'products'),
    widths: [300, 600],
    quality: 85,
    format: 'webp'
  },
  {
    name: 'puma',
    src: path.join(assetsDir, 'products/puma.jpg'),
    outDir: path.join(assetsDir, 'products'),
    widths: [300, 600],
    quality: 85,
    format: 'webp'
  },
  {
    name: 'newBalance',
    src: path.join(assetsDir, 'products/newBalance.jpg'),
    outDir: path.join(assetsDir, 'products'),
    widths: [300, 600],
    quality: 85,
    format: 'webp'
  },
  {
    name: 'converse',
    src: path.join(assetsDir, 'products/converse.jpg'),
    outDir: path.join(assetsDir, 'products'),
    widths: [300, 600],
    quality: 85,
    format: 'webp'
  },
  {
    name: 'asics',
    src: path.join(assetsDir, 'products/asics.jpeg'),
    outDir: path.join(assetsDir, 'products'),
    widths: [300, 600],
    quality: 85,
    format: 'webp'
  },

  // ── Brand Logo Images (150px max display) ──
  {
    name: 'adidas-logo',
    src: path.join(assetsDir, 'logos/adidas-logo.png'),
    outDir: path.join(assetsDir, 'logos'),
    widths: [150, 300],
    quality: 85,
    format: 'webp',
    preserveAlpha: true
  },
  {
    name: 'nike-logo',
    src: path.join(assetsDir, 'logos/nike-logo.png'),
    outDir: path.join(assetsDir, 'logos'),
    widths: [150, 300],
    quality: 85,
    format: 'webp',
    preserveAlpha: true
  },
  {
    name: 'puma-logo',
    src: path.join(assetsDir, 'logos/puma-logo.png'),
    outDir: path.join(assetsDir, 'logos'),
    widths: [150, 300],
    quality: 85,
    format: 'webp',
    preserveAlpha: true
  },
  {
    name: 'new-balance-logo',
    src: path.join(assetsDir, 'logos/new-balance-logo.png'),
    outDir: path.join(assetsDir, 'logos'),
    widths: [150, 300],
    quality: 85,
    format: 'webp',
    preserveAlpha: true
  },
  {
    name: 'converse-logo',
    src: path.join(assetsDir, 'logos/converse-logo.png'),
    outDir: path.join(assetsDir, 'logos'),
    widths: [150, 300],
    quality: 85,
    format: 'webp',
    preserveAlpha: true
  },
  {
    name: 'asics-logo',
    src: path.join(assetsDir, 'logos/asics-logo.png'),
    outDir: path.join(assetsDir, 'logos'),
    widths: [150, 300],
    quality: 85,
    format: 'webp',
    preserveAlpha: true
  }
];

async function optimizeImage(config) {
  const { name, src, outDir, widths, quality, format, preserveAlpha } = config;

  try {
    await fs.access(src);
  } catch {
    console.warn(`⚠️  Source not found, skipping: ${src}`);
    return;
  }

  console.log(`🔧 Optimizing: ${name}`);

  for (let i = 0; i < widths.length; i++) {
    const width = widths[i];
    const suffix = i === 0 ? '' : '@2x';
    const outPath = path.join(outDir, `${name}${suffix}.${format}`);

    try {
      const pipeline = sharp(src).resize(width, null, {
        fit: 'inside',
        withoutEnlargement: true
      });

      if (format === 'webp') {
        pipeline.webp({ quality, effort: 6 });
      }

      if (!preserveAlpha) {
        pipeline.flatten({ background: { r: 255, g: 255, b: 255 } });
      }

      await pipeline.toFile(outPath);
      
      const stats = await fs.stat(outPath);
      console.log(`   ✓ ${path.basename(outPath)} → ${(stats.size / 1024).toFixed(1)} KB`);
    } catch (err) {
      console.error(`   ✗ Failed ${path.basename(outPath)}:`, err.message);
    }
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Advanced Image Optimization (Responsive)');
  console.log('  Properly sized variants for actual display');
  console.log('═══════════════════════════════════════════════\n');

  for (const config of optimizations) {
    await optimizeImage(config);
  }

  console.log('\n✅ Responsive image optimization complete!\n');
  console.log('📊 Expected additional savings:');
  console.log('   • Brand product images: 300px instead of 400px');
  console.log('   • Brand logos: 150px instead of 200px');
  console.log('   • ~20-30% reduction in transferred image data\n');
}

main().catch(console.error);
