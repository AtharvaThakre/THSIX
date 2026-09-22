# Generate Video Poster Images

To create poster images for your videos, use FFmpeg:

```powershell
# Install FFmpeg if not already installed (using winget on Windows)
winget install ffmpeg

# Generate poster from first frame of each video
ffmpeg -i igexport-Ddbk0pvtkZL.mp4 -ss 00:00:01 -vframes 1 -q:v 2 igexport-Ddbk0pvtkZL-poster.jpg
ffmpeg -i igexport-DdeO8usNeZP.mp4 -ss 00:00:01 -vframes 1 -q:v 2 igexport-DdeO8usNeZP-poster.jpg
ffmpeg -i igexport-DdWc5pAt43Y.mp4 -ss 00:00:01 -vframes 1 -q:v 2 igexport-DdWc5pAt43Y-poster.jpg
```

Or use any video editing tool to export the first frame as JPG.

## Alternative: Use a placeholder until you generate posters

If you don't have FFmpeg, you can temporarily use a solid color or existing image as placeholder:
- Create a black or brand-colored JPG (1080x1920px for vertical video)
- Name them: `igexport-Ddbk0pvtkZL-poster.jpg`, etc.
