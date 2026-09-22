#!/usr/bin/env node

/**
 * Quick poster generator for video files
 * Falls back to creating placeholder images if video processing isn't available
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reelsDir = path.join(__dirname, '..', 'Assets', 'reels');

// ponytail: SVG placeholders beat missing images
const createPlaceholderPoster = (filename, index) => {
  const svg = `<svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad${index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#111;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#333;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#grad${index})"/>
  <text x="540" y="960" font-family="Arial" font-size="48" fill="#fff" text-anchor="middle">THSIX</text>
  <text x="540" y="1020" font-family="Arial" font-size="24" fill="#999" text-anchor="middle">Reel ${index + 1}</text>
</svg>`;
  
  const posterPath = path.join(reelsDir, filename.replace('.mp4', '-poster.svg'));
  fs.writeFileSync(posterPath, svg);
  console.log(`Created placeholder: ${posterPath}`);
  return posterPath;
};

const videos = [
  'igexport-Ddbk0pvtkZL.mp4',
  'igexport-DdeO8usNeZP.mp4',
  'igexport-DdWc5pAt43Y.mp4'
];

console.log('Generating video poster placeholders...\n');

videos.forEach((video, index) => {
  const videoPath = path.join(reelsDir, video);
  
  if (fs.existsSync(videoPath)) {
    createPlaceholderPoster(video, index);
  } else {
    console.log(`⚠️  Video not found: ${video}`);
  }
});

console.log('\n✅ Done! To use actual video frames, install FFmpeg and run the commands in GENERATE_POSTERS.md');
