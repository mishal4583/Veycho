# Public assets

The hero video band loads `/video-pothkal.mp4` (checked in here). If the file is
missing, the band falls back to `food-poster.svg` via the `<video>` poster, so
the page works either way.

To swap the clip, replace `public/video-pothkal.mp4` (or change the `src` in
`components/Hero.tsx`).
