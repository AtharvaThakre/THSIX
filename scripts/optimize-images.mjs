/**
 * Image Optimization Script for THSIX
 * 
 * Converts oversized JPG/PNG images to WebP format at appropriate display dimensions.
 * Generates 1x and 2x versions for responsive srcset.
 * 
 * Run: node scripts/optimize-images.mjs
 */
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.resolve(__dirname, '../public/assets');

// Quality settings
const WEBP_QUALITY = 82;
const WEBP_QUALITY_2X = 75; // Slightly lower for 2x since it's downscaled anyway

/**
 * Image optimization targets.
 * Each entry defines: source file, output base name, 1x display dimensions.
 * We generate: {base}.webp (1x) and {base}@2x.webp (2x)
 */
const targets = [
  // ── Lookbook images (already have webp but they're still serving raw JPGs) ──
  // clean-and-classic: displayed at ~637×849, source is 4284×5265 (3.9 MB!)
  {
    src: 'lookbook/clean-and-classic.jpg',
    out: 'lookbook/clean-and-classic',
    width1x: 850,   // Slightly larger than display for sharpness
    height1x: 1050,
    fit: 'cover',
  },
  // city-moves: displayed at ~805×805
  {
    src: 'lookbook/city-moves.jpg',
    out: 'lookbook/city-moves',
    width1x: 810,
    height1x: 810,
    fit: 'cover',
  },
  // everyday-essentials: displayed at ~784×784
  {
    src: 'lookbook/everyday-essentials.jpg',
    out: 'lookbook/everyday-essentials',
    width1x: 800,
    height1x: 800,
    fit: 'cover',
  },
  // style-beyond-basics
  {
    src: 'lookbook/style-beyond-basics.jpg',
    out: 'lookbook/style-beyond-basics',
    width1x: 800,
    height1x: 800,
    fit: 'cover',
  },

  // ── Product images (displayed at ~382×~200) ──
  {
    src: 'products/adidas.png',
    out: 'products/adidas',
    width1x: 400,
    height1x: null,   // Preserve aspect ratio
    fit: 'inside',
    // PNG has transparency - keep alpha
    hasAlpha: true,
  },
  {
    src: 'products/nike.jpg',
    out: 'products/nike',
    width1x: 400,
    height1x: null,
    fit: 'inside',
  },
  {
    src: 'products/puma.jpg',
    out: 'products/puma',
    width1x: 400,
    height1x: null,
    fit: 'inside',
  },
  {
    src: 'products/converse.jpg',
    out: 'products/converse',
    width1x: 400,
    height1x: null,
    fit: 'inside',
  },
  {
    src: 'products/newBalance.jpg',
    out: 'products/newBalance',
    width1x: 400,
    height1x: null,
    fit: 'inside',
  },
  {
    src: 'products/asics.jpeg',
    out: 'products/asics',
    width1x: 400,
    height1x: null,
    fit: 'inside',
  },

  // ── Brand logos (displayed at ~134×74) ──
  {
    src: 'logos/puma-logo.png',
    out: 'logos/puma-logo',
    width1x: 200,
    height1x: null,
    fit: 'inside',
    hasAlpha: true,
  },
  {
    src: 'logos/nike-logo.png',
    out: 'logos/nike-logo',
    width1x: 200,
    height1x: null,
    fit: 'inside',
    hasAlpha: true,
  },
  {
    src: 'logos/converse-logo.png',
    out: 'logos/converse-logo',
    width1x: 160,
    height1x: null,
    fit: 'inside',
    hasAlpha: true,
  },
  {
    src: 'logos/new-balance-logo.png',
    out: 'logos/new-balance-logo',
    width1x: 200,
    height1x: null,
    fit: 'inside',
    hasAlpha: true,
  },
  {
    src: 'logos/adidas-logo.png',
    out: 'logos/adidas-logo',
    width1x: 180,
    height1x: null,
    fit: 'inside',
    hasAlpha: true,
  },
  {
    src: 'logos/asics-logo.png',
    out: 'logos/asics-logo',
    width1x: 200,
    height1x: null,
    fit: 'inside',
    hasAlpha: true,
  },

  // ── Reel cover images (displayed at ~390×700) ──
  {
    src: 'reels/reel_1_cover.png',
    out: 'reels/reel_1_cover',
    width1x: 400,
    height1x: 720,
    fit: 'cover',
  },
  {
    src: 'reels/reel_2_cover.png',
    out: 'reels/reel_2_cover',
    width1x: 400,
    height1x: 720,
    fit: 'cover',
  },
  {
    src: 'reels/reel_3_cover.png',
    out: 'reels/reel_3_cover',
    width1x: 400,
    height1x: 720,
    fit: 'cover',
  },

  // ── Logo (preloader) ──
  {
    src: 'logo-Photoroom.png',
    out: 'logo-Photoroom',
    width1x: 280,
    height1x: 280,
    fit: 'contain',
    hasAlpha: true,
  },
];

async function optimizeImage(target) {
  const srcPath = path.join(ASSETS_DIR, target.src);
  
  try {
    await fs.access(srcPath);
  } catch {
    console.warn(`⚠️  Source not found: ${target.src}`);
    return;
  }

  const srcStat = await fs.stat(srcPath);
  const srcSizeKB = Math.round(srcStat.size / 1024);
  
  const img = sharp(srcPath);
  const meta = await img.metadata();

  // Generate 1x version
  const out1x = path.join(ASSETS_DIR, `${target.out}.webp`);
  const resizeOpts1x = {
    width: target.width1x,
    ...(target.height1x && { height: target.height1x }),
    fit: target.fit || 'cover',
    withoutEnlargement: true,
  };

  await sharp(srcPath)
    .resize(resizeOpts1x)
    .webp({ quality: WEBP_QUALITY, effort: 6 })
    .toFile(out1x);

  const stat1x = await fs.stat(out1x);
  const size1xKB = Math.round(stat1x.size / 1024);

  // Generate 2x version
  const out2x = path.join(ASSETS_DIR, `${target.out}@2x.webp`);
  const resizeOpts2x = {
    width: target.width1x * 2,
    ...(target.height1x && { height: target.height1x * 2 }),
    fit: target.fit || 'cover',
    withoutEnlargement: true,
  };

  await sharp(srcPath)
    .resize(resizeOpts2x)
    .webp({ quality: WEBP_QUALITY_2X, effort: 6 })
    .toFile(out2x);

  const stat2x = await fs.stat(out2x);
  const size2xKB = Math.round(stat2x.size / 1024);

  const savings = srcSizeKB - size1xKB;
  const pct = Math.round((savings / srcSizeKB) * 100);

  console.log(
    `✅ ${target.src} (${srcSizeKB} KB, ${meta.width}×${meta.height}) → ` +
    `1x: ${size1xKB} KB, 2x: ${size2xKB} KB  (saved ${savings} KB / ${pct}%)`
  );
}

async function main() {
  console.log('🖼️  THSIX Image Optimization\n');
  console.log(`Processing ${targets.length} images...\n`);

  for (const target of targets) {
    await optimizeImage(target);
  }

  console.log('\n✨ Done! All optimized images saved as WebP.');
}

main().catch(console.error);
