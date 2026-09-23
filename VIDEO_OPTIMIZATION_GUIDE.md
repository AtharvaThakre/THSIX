# Hero Video Optimization Guide

## Current Issue
- **File**: `/public/assets/herovideo.mp4`
- **Current Size**: ~15.34 MB (15,338,029 bytes)
- **Problem**: Blocking initial page load, causing poor LCP

## Immediate Code Changes Applied ✅
1. **Mobile**: Video completely skipped on mobile devices (width < 768px)
2. **Poster Priority**: Poster image now loads with `fetchpriority="high"` and `loading="eager"`
3. **Lazy Loading**: Video deferred using `requestIdleCallback` (loads during browser idle time)
4. **Preload Strategy**: Changed from `preload="metadata"` to `preload="none"`
5. **Reduced Motion**: Video skipped for users with `prefers-reduced-motion`

## Required: Video File Compression

### Recommended Approach
Use **FFmpeg** to compress the video. Install FFmpeg from: https://ffmpeg.org/download.html

### Compression Commands

#### Option 1: Mobile-Optimized (Recommended for initial load)
```bash
ffmpeg -i public/assets/herovideo.mp4 \
  -vf "scale=1280:720" \
  -c:v libx264 \
  -preset slow \
  -crf 28 \
  -movflags +faststart \
  -an \
  public/assets/herovideo-optimized.mp4
```
**Expected size**: ~1-2 MB
**Use**: Replace current herovideo.mp4 with this version

#### Option 2: WebM Format (Better compression, modern browsers)
```bash
ffmpeg -i public/assets/herovideo.mp4 \
  -vf "scale=1280:720" \
  -c:v libvpx-vp9 \
  -crf 35 \
  -b:v 0 \
  -an \
  public/assets/herovideo.webm
```
**Expected size**: ~800KB - 1.5MB
**Browser support**: 95%+ (Chrome, Firefox, Edge, Safari 14.1+)

#### Option 3: Dual Format (Best quality + compression)
```bash
# Create optimized MP4
ffmpeg -i public/assets/herovideo.mp4 \
  -vf "scale=1920:1080" \
  -c:v libx264 \
  -preset slow \
  -crf 25 \
  -movflags +faststart \
  -an \
  public/assets/herovideo-desktop.mp4

# Create mobile version
ffmpeg -i public/assets/herovideo.mp4 \
  -vf "scale=1280:720" \
  -c:v libx264 \
  -preset slow \
  -crf 28 \
  -movflags +faststart \
  -an \
  public/assets/herovideo-mobile.mp4

# Create WebM version
ffmpeg -i public/assets/herovideo.mp4 \
  -vf "scale=1920:1080" \
  -c:v libvpx-vp9 \
  -crf 35 \
  -b:v 0 \
  -an \
  public/assets/herovideo.webm
```

### Compression Parameter Explanation
- **scale**: Reduces resolution (1920x1080 desktop, 1280x720 mobile)
- **crf**: Quality (18-28 range, higher = smaller file, 23-28 recommended)
- **preset slow**: Better compression (takes longer to encode)
- **movflags +faststart**: Enables progressive streaming
- **-an**: Removes audio (hero videos don't need sound)
- **libvpx-vp9**: Modern WebM codec with excellent compression

### Target Sizes
- Mobile (720p): **< 1 MB**
- Desktop (1080p): **< 2 MB**
- WebM (1080p): **< 1.5 MB**

## After Compression

Update `HeroImage.tsx` to use responsive videos:

```tsx
{shouldLoadVideo && !isMobile && (
  <video
    ref={videoRef}
    loop
    muted
    playsInline
    preload="none"
    poster="/assets/hero-shoes.jpg"
    style={{
      opacity: isLoaded ? 1 : 0,
      transition: 'opacity 0.5s ease-in-out'
    }}
  >
    <source src="/assets/herovideo.webm" type="video/webm" />
    <source src="/assets/herovideo-desktop.mp4" type="video/mp4" />
  </video>
)}
```

## Alternative: Cloud Video Hosting

Consider hosting video on:
- **Cloudflare Stream**: Automatic optimization, adaptive bitrate
- **Vimeo**: Professional video hosting with API
- **Bunny.net Stream**: CDN with video optimization

Benefits:
- Automatic compression
- Adaptive bitrate streaming
- CDN delivery
- No hosting on your server

## Expected Performance Improvement

### Before
- Hero video: ~15 MB
- Mobile LCP: 48+ seconds
- Total payload: 66 MB

### After (with optimized video)
- Hero video: ~1-2 MB (mobile skipped entirely)
- Expected mobile LCP: < 3 seconds
- Total payload reduction: ~13-14 MB

## Testing After Optimization

1. Clear browser cache
2. Test on mobile (video should NOT load)
3. Test on desktop (video loads after idle time)
4. Verify poster image appears immediately
5. Run Lighthouse mobile test again

## Verification Checklist

- [ ] FFmpeg installed
- [ ] Video compressed to < 2 MB
- [ ] WebM version created (optional but recommended)
- [ ] Old herovideo.mp4 backed up
- [ ] New video(s) placed in `/public/assets/`
- [ ] Mobile test: video doesn't load
- [ ] Desktop test: poster appears immediately, video loads after ~1 second
- [ ] Lighthouse score improved
