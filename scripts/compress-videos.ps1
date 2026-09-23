#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Compresses hero video for THSIX website using FFmpeg
    
.DESCRIPTION
    Creates optimized video formats:
    - herovideo-desktop.mp4 (1920x1080, ~2MB)
    - herovideo-mobile.mp4 (1280x720, ~1MB)
    - herovideo.webm (1920x1080, VP9 codec, ~1.5MB)
    
.PREREQUISITE
    FFmpeg must be installed and available in PATH
    Install from: https://ffmpeg.org/download.html
    
.USAGE
    .\scripts\compress-videos.ps1
#>

$inputVideo = "public/assets/herovideo.mp4"
$outputDir = "public/assets"

# Colors for output
$success = @{ ForegroundColor = 'Green' }
$error_color = @{ ForegroundColor = 'Red' }
$info = @{ ForegroundColor = 'Cyan' }

Write-Host "🎬 THSIX Video Compression Script" @info
Write-Host "=====================================" @info

# Check if input video exists
if (-not (Test-Path $inputVideo)) {
    Write-Host "❌ Error: Input video not found at $inputVideo" @error_color
    exit 1
}

# Check if FFmpeg is installed
try {
    $ffmpegVersion = & ffmpeg -version 2>&1 | Select-Object -First 1
    Write-Host "✅ FFmpeg detected: $ffmpegVersion" @success
}
catch {
    Write-Host "❌ Error: FFmpeg not found. Install from: https://ffmpeg.org/download.html" @error_color
    exit 1
}

Write-Host ""
Write-Host "Input: $inputVideo" @info
Write-Host "Output directory: $outputDir" @info
Write-Host ""

# Create desktop MP4 (1920x1080, H.264, CRF 25)
Write-Host "📹 Creating desktop MP4 (1920x1080)..." @info
& ffmpeg -i $inputVideo `
    -vf "scale=1920:1080" `
    -c:v libx264 `
    -preset slow `
    -crf 25 `
    -movflags +faststart `
    -an `
    "$outputDir/herovideo-desktop.mp4" `
    -y 2>&1 | Select-String "frame=|size="

if ($LASTEXITCODE -eq 0) {
    $size = (Get-Item "$outputDir/herovideo-desktop.mp4").Length / 1MB
    Write-Host "✅ Desktop MP4 created: $([math]::Round($size, 2))MB" @success
} else {
    Write-Host "❌ Desktop MP4 creation failed" @error_color
    exit 1
}

# Create mobile MP4 (1280x720, H.264, CRF 28)
Write-Host ""
Write-Host "📱 Creating mobile MP4 (1280x720)..." @info
& ffmpeg -i $inputVideo `
    -vf "scale=1280:720" `
    -c:v libx264 `
    -preset slow `
    -crf 28 `
    -movflags +faststart `
    -an `
    "$outputDir/herovideo-mobile.mp4" `
    -y 2>&1 | Select-String "frame=|size="

if ($LASTEXITCODE -eq 0) {
    $size = (Get-Item "$outputDir/herovideo-mobile.mp4").Length / 1MB
    Write-Host "✅ Mobile MP4 created: $([math]::Round($size, 2))MB" @success
} else {
    Write-Host "❌ Mobile MP4 creation failed" @error_color
    exit 1
}

# Create WebM (1920x1080, VP9, CRF 35)
Write-Host ""
Write-Host "🎥 Creating WebM (1920x1080, VP9 codec)..." @info
& ffmpeg -i $inputVideo `
    -vf "scale=1920:1080" `
    -c:v libvpx-vp9 `
    -crf 35 `
    -b:v 0 `
    -an `
    "$outputDir/herovideo.webm" `
    -y 2>&1 | Select-String "frame=|size="

if ($LASTEXITCODE -eq 0) {
    $size = (Get-Item "$outputDir/herovideo.webm").Length / 1MB
    Write-Host "✅ WebM created: $([math]::Round($size, 2))MB" @success
} else {
    Write-Host "❌ WebM creation failed" @error_color
    exit 1
}

# Summary
Write-Host ""
Write-Host "=====================================@info
Write-Host "📊 Compression Complete!" @success
Write-Host "=====================================" @info
Write-Host ""

$desktopSize = (Get-Item "$outputDir/herovideo-desktop.mp4").Length / 1MB
$mobileSize = (Get-Item "$outputDir/herovideo-mobile.mp4").Length / 1MB
$webmSize = (Get-Item "$outputDir/herovideo.webm").Length / 1MB
$originalSize = (Get-Item $inputVideo).Length / 1MB

Write-Host "Original:        $([math]::Round($originalSize, 2))MB" @info
Write-Host "Desktop MP4:     $([math]::Round($desktopSize, 2))MB (CRF 25, 1920x1080)"
Write-Host "Mobile MP4:      $([math]::Round($mobileSize, 2))MB (CRF 28, 1280x720)"
Write-Host "WebM:            $([math]::Round($webmSize, 2))MB (CRF 35, 1920x1080)"
Write-Host "Total Savings:   $([math]::Round($originalSize - ($desktopSize + $mobileSize + $webmSize), 2))MB"
Write-Host ""

Write-Host "✅ Videos ready for deployment!" @success
Write-Host "Videos will be served in order:" @info
Write-Host "  1. herovideo.webm (modern browsers, best compression)"
Write-Host "  2. herovideo-desktop.mp4 (fallback for desktop)"
Write-Host "  3. herovideo-mobile.mp4 (fallback for mobile)"
Write-Host "  4. herovideo.mp4 (last resort, very old browsers)"
Write-Host ""
Write-Host "💡 Tip: Keep herovideo.mp4 as last resort fallback" @info
