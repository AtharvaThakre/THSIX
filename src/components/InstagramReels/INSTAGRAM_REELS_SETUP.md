# Instagram Reels Component Setup

This component displays a carousel of Instagram reels with smooth rotation and video playback.

## How to Extract Instagram Reel Video URLs

Instagram doesn't provide public APIs for direct video access, but you can extract video URLs using these methods:

### Method 1: Using Browser Developer Tools (Easiest)
1. Open the Instagram reel in your browser
2. Open Developer Tools (F12 or Right-click → Inspect)
3. Go to the **Network** tab
4. Filter by "video" or "media"
5. Refresh the page or play the reel
6. Look for requests to `scontent.cdninstagram.com` with `.mp4` extension
7. Copy the full URL from the **Response Headers** or **Preview** tab
8. The URL will look like: `https://scontent.cdninstagram.com/v/t16.13266-10/XXXXXXX.mp4?_nc_ht=scontent.cdninstagram&_nc_cat=X&oh=XXXXX&oe=XXXXX`

### Method 2: Using Online Tools
Services like:
- [Instasaver](https://insta-saver.com/)
- [IG Downloader](https://igdownloader.app/)
- [SaveInsta](https://www.saveinsta.io/)

However, be mindful of the terms of service.

### Method 3: Instagram Embed (Alternative)
Instead of direct video URLs, you can use Instagram's embedded post feature:
```tsx
// Add to your HTML
<iframe src="https://www.instagram.com/reel/DdZBkXWtTzo/embed" width="400"></iframe>
```

## Updating Video URLs

Edit `src/components/InstagramReels/InstagramReels.tsx` and update the `reelsData` array:

```tsx
const reelsData: ReelData[] = [
  {
    id: 'reel-1',
    videoUrl: 'https://scontent.cdninstagram.com/v/t16.13266-10/YOUR_VIDEO_ID.mp4?_nc_ht=scontent.cdninstagram&_nc_cat=1&oh=XXXXX&oe=XXXXX',
    thumbnail: 'https://your-thumbnail-url.jpg',
    instagramUrl: 'https://www.instagram.com/reel/DdZBkXWtTzo/'
  },
  {
    id: 'reel-2', 
    videoUrl: 'https://scontent.cdninstagram.com/v/t16.13266-10/YOUR_VIDEO_ID_2.mp4?_nc_ht=scontent.cdninstagram&_nc_cat=1&oh=XXXXX&oe=XXXXX',
    thumbnail: 'https://your-thumbnail-url-2.jpg',
    instagramUrl: 'https://www.instagram.com/reel/DdWc5pAt43Y/'
  },
  {
    id: 'reel-3',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg'
  }
];
```

## Current Setup

### Reel 1 (DdZBkXWtTzo)
- **Status**: Awaiting video URL extraction
- **Instagram**: https://www.instagram.com/reel/DdZBkXWtTzo/
- **Action**: Extract URL using Method 1 above

### Reel 2 (DdWc5pAt43Y)
- **Status**: Awaiting video URL extraction
- **Instagram**: https://www.instagram.com/reel/DdWc5pAt43Y/
- **Action**: Extract URL using Method 1 above

### Reel 3
- **Status**: Using placeholder video
- **Video**: ForBiggerBlazes (Google sample video)
- **Action**: Keep as-is or replace with your video

## CORS Considerations

Instagram's CDN videos have CORS restrictions. If you encounter CORS errors:

1. Videos should work fine with crossOrigin="anonymous" attribute
2. If videos don't load in production, consider:
   - Hosting videos on your own server
   - Using a CORS proxy (not recommended for production)
   - Embedding Instagram posts directly

## Component Features

- ✅ 3-card carousel layout
- ✅ Center card is larger and plays automatically
- ✅ Side cards are blurred and paused
- ✅ Smooth rotation animations
- ✅ No native video controls
- ✅ Muted autoplay (works reliably)
- ✅ Responsive design for all screen sizes
- ✅ Keyboard accessible

## Notes

- The `videoUrl` field supports both direct `.mp4` URLs and HTTP streams
- Thumbnails are optional; videos will display a black background if not provided
- The component automatically plays/pauses videos based on carousel position
- Maximum 3 reels are displayed (can be extended in code if needed)
