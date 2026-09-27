#!/usr/bin/env node
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsDir = path.resolve(__dirname, '../public/assets');

/**
 * Optimization targets based on PageSpeed Insights report (Sept 28, 2026).
 * Targets: lookbook images (3.9 MB clean-and-classic.jpg, 2.1 MB city-moves.jpg, etc.),
 * oversized product images (952 KB adidas.png), and Instagram reel posters.
 */

const optimizations = [
  // ── Priority 1: Lookbook images (10+ MB savings) ──
  {
    name: 'clean-and-classic',
    src: path.join(assetsDir, 'lookbook/clean-and-classic.jpg'),
    outDir: path.join(assetsDir, 'lookbook'),
    // Displayed at 637×849 on desktop, 784×784 on mobile
    widths: [850, 1700], // 1x and 2x for 850px max display
    quality: 82,
    format: 'webp'
  },
  {
    name: 'city-moves',
    src: path.join(assetsDir, 'lookbook/city-moves.jpg'),
    outDir: path.join(assetsDir, 'lookbook'),
    // Displayed at 805×805
    widths: [850, 1700],
    quality: 82,
    format: 'webp'
  },
  {
    name: 'everyday-essentials',
    src: path.join(assetsDir, 'lookbook/everyday-essentials.jpg'),
    outDir: path.join(assetsDir, 'lookbook'),
    // Displayed at 784×784
    widths: [850, 1700],
    quality: 82,
    format: 'webp'
  },
  {
    name: 'style-beyond-basics',
    src: path.join(assetsDir, 'lookbook/style-beyond-basics.jpg'),
    outDir: path.join(assetsDir, 'lookbook'),
    widths: [850, 1700],
    quality: 82,
    format: 'webp'
  },

  // ── Priority 2: Large adidas.png product image (952 KB → ~30 KB) ──
  {
    name: 'adidas',
    src: path.join(assetsDir, 'products/adidas.png'),
    outDir: path.join(assetsDir, 'products'),
    // Displayed at 382×197
    widths: [400, 800],
    quality: 85,
    format: 'webp',
    preserveAlpha: true
  },

  // ── Priority 3: Instagram reel poster images ──
  {
    name: 'reel_1_cover',
    src: path.join(assetsDir, 'reels/reel_1_cover.png'),
    outDir: path.join(assetsDir, 'reels'),
    // Displayed at 390×700
    widths: [400, 800],
    quality: 80,
    format: 'webp'
  },
  {
    name: 'reel_2_cover',
    src: path.join(assetsDir, 'reels/reel_2_cover.png'),
    outDir: path.join(assetsDir, 'reels'),
    widths: [400, 800],
    quality: 80,
    format: 'webp'
  },
  {
    name: 'reel_3_cover',
    src: path.join(assetsDir, 'reels/reel_3_cover.png'),
    outDir: path.join(assetsDir, 'reels'),
    widths: [400, 800],
    quality: 80,
    format: 'webp'
  },

  // ── Priority 4: Other product images ──
  {
    name: 'nike',
    src: path.join(assetsDir, 'products/nike.jpg'),
    outDir: path.join(assetsDir, 'products'),
    widths: [400, 800],
    quality: 85,
    format: 'webp'
  },
  {
    name: 'puma',
    src: path.join(assetsDir, 'products/puma.jpg'),
    outDir: path.join(assetsDir, 'products'),
    widths: [400, 800],
    quality: 85,
    format: 'webp'
  },
  {
    name: 'newBalance',
    src: path.join(assetsDir, 'products/newBalance.jpg'),
    outDir: path.join(assetsDir, 'products'),
    widths: [400, 800],
    quality: 85,
    format: 'webp'
  },
  {
    name: 'converse',
    src: path.join(assetsDir, 'products/converse.jpg'),
    outDir: path.join(assetsDir, 'products'),
    widths: [400, 800],
    quality: 85,
    format: 'webp'
  },
  {
    name: 'asics',
    src: path.join(assetsDir, 'products/asics.jpeg'),
    outDir: path.join(assetsDir, 'products'),
    widths: [400, 800],
    quality: 85,
    format: 'webp'
  },

  // ── Priority 5: Logo images (large puma-logo.png, nike-logo.png, etc.) ──
  {
    name: 'adidas-logo',
    src: path.join(assetsDir, 'logos/adidas-logo.png'),
    outDir: path.join(assetsDir, 'logos'),
    // Displayed at ~123×74
    widths: [200, 400],
    quality: 85,
    format: 'webp',
    preserveAlpha: true
  },
  {
    name: 'nike-logo',
    src: path.join(assetsDir, 'logos/nike-logo.png'),
    outDir: path.join(assetsDir, 'logos'),
    widths: [200, 400],
    quality: 85,
    format: 'webp',
    preserveAlpha: true
  },
  {
    name: 'puma-logo',
    src: path.join(assetsDir, 'logos/puma-logo.png'),
    outDir: path.join(assetsDir, 'logos'),
    widths: [200, 400],
    quality: 85,
    format: 'webp',
    preserveAlpha: true
  },
  {
    name: 'new-balance-logo',
    src: path.join(assetsDir, 'logos/new-balance-logo.png'),
    outDir: path.join(assetsDir, 'logos'),
    widths: [200, 400],
    quality: 85,
    format: 'webp',
    preserveAlpha: true
  },
  {
    name: 'converse-logo',
    src: path.join(assetsDir, 'logos/converse-logo.png'),
    outDir: path.join(assetsDir, 'logos'),
    widths: [200, 400],
    quality: 85,
    format: 'webp',
    preserveAlpha: true
  },
  {
    name: 'asics-logo',
    src: path.join(assetsDir, 'logos/asics-logo.png'),
    outDir: path.join(assetsDir, 'logos'),
    widths: [200, 400],
    quality: 85,
    format: 'webp',
    preserveAlpha: true
  },

  // ── Priority 6: Logo-Photoroom (already optimized in existing script, but ensure it's up to date) ──
  {
    name: 'logo-Photoroom',
    src: path.join(assetsDir, 'logo-Photoroom.png'),
    outDir: assetsDir,
    widths: [280, 560],
    quality: 85,
    format: 'webp',
    preserveAlpha: true
  }
];

async function optimizeImage(config) {
  const { name, src, outDir, widths, quality, format, preserveAlpha } = config;

  // Check if source exists
  try {
    await fs.access(src);
  } catch {
    console.warn(`⚠️  Source not found, skipping: ${src}`);
    return;
  }

  console.log(`\n🔧 Optimizing: ${name}`);

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
      } else if (format === 'avif') {
        pipeline.avif({ quality, effort: 4 });
      } else if (format === 'jpg' || format === 'jpeg') {
        pipeline.jpeg({ quality, mozjpeg: true });
      }

      if (!preserveAlpha && format !== 'webp' && format !== 'avif') {
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
  console.log('  THSIX Image Optimization (Performance Fix)');
  console.log('  Based on PageSpeed Insights Sept 28, 2026');
  console.log('═══════════════════════════════════════════════\n');

  for (const config of optimizations) {
    await optimizeImage(config);
  }

  console.log('\n✅ Image optimization complete!\n');
  console.log('📊 Expected savings:');
  console.log('   • Lookbook images: ~10 MB → ~1 MB (WebP)');
  console.log('   • Adidas product: 952 KB → ~30 KB (WebP)');
  console.log('   • Reel posters: ~1.1 MB → ~90 KB (WebP)');
  console.log('   • Product images: ~500 KB → ~50 KB (WebP)');
  console.log('   • Logo images: ~240 KB → ~40 KB (WebP)');
  console.log('\n💡 Total estimated savings: ~10.8 MB\n');
}

main().catch(console.error);
