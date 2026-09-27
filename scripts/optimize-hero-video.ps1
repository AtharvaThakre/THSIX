# Hero Video Optimization Script (PowerShell)
# Reduces 14.6 MB video to ~2-3 MB while preserving acceptable quality

$INPUT_VIDEO = "public\assets\herovideo.mp4"
$OUTPUT_DIR = "public\assets"
$OUTPUT_DESKTOP = "$OUTPUT_DIR\herovideo-optimized.mp4"
$OUTPUT_MOBILE = "$OUTPUT_DIR\herovideo-mobile.mp4"

if (-not (Test-Path $INPUT_VIDEO)) {
    Write-Host "❌ Error: Input video not found at $INPUT_VIDEO" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: ffmpeg is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install ffmpeg to optimize the hero video:" -ForegroundColor Yellow
    Write-Host "  • Windows: choco install ffmpeg" -ForegroundColor Cyan
    Write-Host "  • Or download from: https://ffmpeg.org/download.html" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  Skipping video optimization..." -ForegroundColor Yellow
    Write-Host "    The existing 14.6 MB video will continue to be used." -ForegroundColor Yellow
    Write-Host "    Consider optimizing manually or installing ffmpeg later." -ForegroundColor Yellow
    exit 0
}

Write-Host "🎬 Optimizing hero video..." -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# Get input video info
Write-Host "📊 Input video info:" -ForegroundColor Cyan
ffprobe -v error -show_entries format=duration,size,bit_rate `
    -show_entries stream=codec_name,width,height,r_frame_rate `
    -of default=noprint_wrappers=1 "$INPUT_VIDEO" 2>$null

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "🖥️  Creating optimized desktop version (1920x1080)..." -ForegroundColor Cyan

# Desktop version: 1920x1080, H.264, optimized for web
ffmpeg -i "$INPUT_VIDEO" `
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" `
    -c:v libx264 `
    -preset faster `
    -profile:v main `
    -level 4.0 `
    -crf 28 `
    -r 30 `
    -pix_fmt yuv420p `
    -movflags +faststart `
    -an `
    -y `
    "$OUTPUT_DESKTOP" 2>&1 | Select-String -Pattern "frame=|size=|time="

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📱 Creating optimized mobile version (1280x720)..." -ForegroundColor Cyan

# Mobile version: 1280x720, more aggressive compression
ffmpeg -i "$INPUT_VIDEO" `
    -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" `
    -c:v libx264 `
    -preset faster `
    -profile:v main `
    -level 3.1 `
    -crf 30 `
    -r 24 `
    -pix_fmt yuv420p `
    -movflags +faststart `
    -an `
    -y `
    "$OUTPUT_MOBILE" 2>&1 | Select-String -Pattern "frame=|size=|time="

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✅ Video optimization complete!" -ForegroundColor Green
Write-Host ""

# Show file sizes
if (Test-Path $OUTPUT_DESKTOP) {
    $desktopSize = [math]::Round((Get-Item $OUTPUT_DESKTOP).Length / 1MB, 2)
    Write-Host "🖥️  Desktop: $OUTPUT_DESKTOP ($desktopSize MB)" -ForegroundColor Cyan
}

if (Test-Path $OUTPUT_MOBILE) {
    $mobileSize = [math]::Round((Get-Item $OUTPUT_MOBILE).Length / 1MB, 2)
    Write-Host "📱 Mobile:  $OUTPUT_MOBILE ($mobileSize MB)" -ForegroundColor Cyan
}

$originalSize = [math]::Round((Get-Item $INPUT_VIDEO).Length / 1MB, 2)
Write-Host "📦 Original: $INPUT_VIDEO ($originalSize MB)" -ForegroundColor Yellow
Write-Host ""

Write-Host "💡 Next steps:" -ForegroundColor Magenta
Write-Host "   1. Test the optimized videos in your browser" -ForegroundColor White
Write-Host "   2. Update HeroImage.tsx to use the new files:" -ForegroundColor White
Write-Host "      • Desktop: /assets/herovideo-optimized.mp4" -ForegroundColor Gray
Write-Host "      • Mobile:  /assets/herovideo-mobile.mp4" -ForegroundColor Gray
Write-Host "   3. If quality is acceptable, replace the original" -ForegroundColor White
Write-Host ""
