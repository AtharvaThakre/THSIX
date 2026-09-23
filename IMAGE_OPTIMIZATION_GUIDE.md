# Image Optimization Guide

## Critical Issues Identified

Total unoptimized image payload: **~26.6 MB**

### Largest Offenders

1. **group-121.png**: 10.69 MB (3258x3556) → displayed much smaller
2. **clean-and-classic.jpg**: 4.77 MB (5712x4284) → displayed ~310x413
3. **city-moves.jpg**: 2.03 MB (941x1254) → displayed ~413x413
4. **everyday-essentials.jpg**: 2.02 MB (941x1254) → displayed ~413x413
5. **philosophy-lifestyle.jpg**: 2.02 MB (1254x1157) → displayed ~721x721
6. **hero-shoes.jpg**: 1.85 MB → poster image (critical for LCP)
7. **newsletter-bg.png**: 1.17 MB

## Optimization Tools

### Option 1: Sharp (Node.js - Recommended)
```bash
npm install sharp --save-dev
```

### Option 2: Online Tools
- **Squoosh**: https://squoosh.app/ (Google's image optimizer)
- **TinyPNG**: https://tinypng.com/ (excellent for PNG/JPG)

### Option 3: Command Line (ImageMagick)
```bash
# Install ImageMagick: https://imagemagick.org/
```

## Automated Optimization Script

Create `scripts/optimize-images.js`:

\`\`\`javascript
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const optimizationConfig = [
  // Next Drop
  {
    input: 'public/assets/group-121.png',
    outputs: [
      { width: 800, name: 'group-121', format: 'webp', quality: 85 },
      { width: 1600, name: 'group-121@2x', format: 'webp', quality: 85 },
      { width: 800, name: 'group-121-fallback', format: 'jpg', quality: 82 }
    ]
  },
  
  // Lookbook images
  {
    input: 'public/assets/lookbook/clean-and-classic.jpg',
    outputs: [
      { width: 450, name: 'lookbook/clean-and-classic', format: 'webp', quality: 85 },
      { width: 900, name: 'lookbook/clean-and-classic@2x', format: 'webp', quality: 85 }
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
  
  // Philosophy
  {
    input: 'public/assets/philosophy-lifestyle.jpg',
    outputs: [
      { width: 800, name: 'philosophy-lifestyle', format: 'webp', quality: 85 },
      { width: 1600, name: 'philosophy-lifestyle@2x', format: 'webp', quality: 85 }
    ]
  },
  
  // Hero poster (critical for LCP)
  {
    input: 'public/assets/hero-shoes.jpg',
    outputs: [
      { width: 1280, name: 'hero-shoes-mobile', format: 'webp', quality: 82 },
      { width: 1920, name: 'hero-shoes-desktop', format: 'webp', quality: 85 },
      { width: 1920, name: 'hero-shoes-fallback', format: 'jpg', quality: 80 }
    ]
  }
];

async function optimizeImages() {
  console.log('Starting image optimization...\n');
  
  for (const config of optimizationConfig) {
    console.log(`Processing: ${config.input}`);
    
    try {
      const inputBuffer = await fs.readFile(config.input);
      const image = sharp(inputBuffer);
      const metadata = await image.metadata();
      
      console.log(`  Original: ${metadata.width}x${metadata.height}, ${(inputBuffer.length / 1024 / 1024).toFixed(2)} MB`);
      
      for (const output of config.outputs) {
        const outputPath = path.join('public/assets', `${output.name}.${output.format}`);
        
        await sharp(inputBuffer)
          .resize(output.width, null, { withoutEnlargement: true })
          [output.format]({ quality: output.quality })
          .toFile(outputPath);
        
        const stats = await fs.stat(outputPath);
        console.log(`  → ${output.name}.${output.format}: ${output.width}w, ${(stats.size / 1024).toFixed(0)} KB`);
      }
      
      console.log('');
    } catch (error) {
      console.error(`  Error processing ${config.input}:`, error.message);
    }
  }
  
  console.log('Image optimization complete!');
}

optimizeImages();
\`\`\`

## Manual Optimization Steps

### 1. group-121.png (10.69 MB → ~100 KB target)

```bash
# Using Sharp
npx sharp -i public/assets/group-121.png -o public/assets/group-121.webp --resize 800 --webp-quality 85

# Using ImageMagick
convert public/assets/group-121.png -resize 800x -quality 85 public/assets/group-121.webp
```

### 2. Lookbook Images (4.77 MB → ~50 KB each target)

```bash
# clean-and-classic
npx sharp -i public/assets/lookbook/clean-and-classic.jpg -o public/assets/lookbook/clean-and-classic.webp --resize 450 --webp-quality 85

# city-moves
npx sharp -i public/assets/lookbook/city-moves.jpg -o public/assets/lookbook/city-moves.webp --resize 450 --webp-quality 85

# everyday-essentials
npx sharp -i public/assets/lookbook/everyday-essentials.jpg -o public/assets/lookbook/everyday-essentials.webp --resize 450 --webp-quality 85
```

### 3. Hero Poster (1.85 MB → ~200 KB target)

```bash
# Desktop version
npx sharp -i public/assets/hero-shoes.jpg -o public/assets/hero-shoes-desktop.webp --resize 1920 --webp-quality 85

# Mobile version
npx sharp -i public/assets/hero-shoes.jpg -o public/assets/hero-shoes-mobile.webp --resize 1280 --webp-quality 82
```

### 4. Philosophy Image (2.02 MB → ~80 KB target)

```bash
npx sharp -i public/assets/philosophy-lifestyle.jpg -o public/assets/philosophy-lifestyle.webp --resize 800 --webp-quality 85
```

## Quick Command-Line Batch Optimization

```bash
# Install Sharp CLI globally
npm install -g sharp-cli

# Optimize all lookbook images
cd public/assets/lookbook
for file in *.jpg; do
  npx sharp -i "$file" -o "${file%.jpg}.webp" --resize 450 --webp-quality 85
done

# Go back to root
cd ../../..
```

## Expected Results

| Image | Before | After | Savings |
|-------|--------|-------|---------|
| group-121.png | 10.69 MB | ~100 KB | 10.59 MB |
| clean-and-classic.jpg | 4.77 MB | ~50 KB | 4.72 MB |
| city-moves.jpg | 2.03 MB | ~40 KB | 1.99 MB |
| everyday-essentials.jpg | 2.02 MB | ~40 KB | 1.98 MB |
| philosophy-lifestyle.jpg | 2.02 MB | ~80 KB | 1.94 MB |
| hero-shoes.jpg | 1.85 MB | ~200 KB | 1.65 MB |
| **TOTAL** | **23.38 MB** | **~0.51 MB** | **~22.87 MB** |

## Verification Checklist

- [ ] Sharp or ImageMagick installed
- [ ] Optimization script run successfully
- [ ] WebP versions created
- [ ] JPG fallbacks created for older browsers
- [ ] Original images backed up
- [ ] File sizes verified (use `ls -lh public/assets/`)
- [ ] Visual quality checked (images still look sharp)
- [ ] Update component code to use new images (next phase)

## Next: Update Components

After optimization, components need to use responsive images with `srcset`. This is covered in PHASE 7.
