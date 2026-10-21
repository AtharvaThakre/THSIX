#!/bin/bash

# Hero Video Optimization Script
# Reduces 14.6 MB video to ~2-3 MB while preserving acceptable quality
# Creates both desktop and mobile versions

set -e

INPUT="public/assets/herovideo.mp4"
OUTPUT_DIR="public/assets"
OUTPUT_DESKTOP="${OUTPUT_DIR}/herovideo-optimized.mp4"
OUTPUT_MOBILE="${OUTPUT_DIR}/herovideo-mobile.mp4"

if [ ! -f "$INPUT" ]; then
    echo "❌ Error: Input video not found at $INPUT"
    exit 1
fi

if ! command -v ffmpeg &> /dev/null; then
    echo "❌ Error: ffmpeg is not installed"
    echo "Install ffmpeg to optimize the hero video:"
    echo "  • macOS: brew install ffmpeg"
    echo "  • Ubuntu: sudo apt install ffmpeg"
    echo "  • Windows: choco install ffmpeg"
    exit 1
fi

echo "🎬 Optimizing hero video..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get input video info
echo "📊 Input video info:"
ffprobe -v error -show_entries format=duration,size,bit_rate \
    -show_entries stream=codec_name,width,height,r_frame_rate \
    -of default=noprint_wrappers=1 "$INPUT" 2>/dev/null || echo "Could not read video info"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🖥️  Creating optimized desktop version (1920x1080, ~2.5 MB)..."

# Desktop version: 1920x1080, H.264, optimized for web
# - CRF 28 (higher = more compression, 23 is default)
# - Preset faster (good compression/speed balance)
# - Profile main (wider compatibility)
# - 30 FPS (reduced from likely 60)
# - Remove audio (hero videos don't need it)
ffmpeg -i "$INPUT" \
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
    -c:v libx264 \
    -preset faster \
    -profile:v main \
    -level 4.0 \
    -crf 28 \
    -r 30 \
    -pix_fmt yuv420p \
    -movflags +faststart \
    -an \
    -y \
    "$OUTPUT_DESKTOP" \
    2>&1 | grep -E "frame=|size=|time=" || true

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Creating optimized mobile version (1280x720, ~1.2 MB)..."

# Mobile version: 1280x720, more aggressive compression
# - CRF 30 (higher compression for mobile)
# - Lower resolution for mobile bandwidth
# - 24 FPS (cinematic, lower file size)
ffmpeg -i "$INPUT" \
    -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" \
    -c:v libx264 \
    -preset faster \
    -profile:v main \
    -level 3.1 \
    -crf 30 \
    -r 24 \
    -pix_fmt yuv420p \
    -movflags +faststart \
    -an \
    -y \
    "$OUTPUT_MOBILE" \
    2>&1 | grep -E "frame=|size=|time=" || true

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Video optimization complete!"
echo ""

# Show file sizes
if [ -f "$OUTPUT_DESKTOP" ]; then
    DESKTOP_SIZE=$(du -h "$OUTPUT_DESKTOP" | cut -f1)
    echo "🖥️  Desktop: $OUTPUT_DESKTOP ($DESKTOP_SIZE)"
fi

if [ -f "$OUTPUT_MOBILE" ]; then
    MOBILE_SIZE=$(du -h "$OUTPUT_MOBILE" | cut -f1)
    echo "📱 Mobile:  $OUTPUT_MOBILE ($MOBILE_SIZE)"
fi

ORIGINAL_SIZE=$(du -h "$INPUT" | cut -f1)
echo "📦 Original: $INPUT ($ORIGINAL_SIZE)"
echo ""

echo "💡 Next steps:"
echo "   1. Test the optimized videos in your browser"
echo "   2. Update HeroImage.tsx to use the new files:"
echo "      • Desktop: /assets/herovideo-optimized.mp4"
echo "      • Mobile:  /assets/herovideo-mobile.mp4"
echo "   3. If quality is acceptable, replace the original"
echo ""
