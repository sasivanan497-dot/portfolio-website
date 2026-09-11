# Smooth Scroll Image Animation

A framework-free scroll-controlled canvas animation generated from the supplied MP4.

## Run locally

Because the animation loads image files, serve the folder with any local HTTP server.

### Python
```bash
python -m http.server 8000
```
Then open `http://localhost:8000`.

### VS Code
Use the **Live Server** extension and open `index.html`.

## Files
- `index.html` — page markup
- `style.css` — responsive presentation / sticky scroll section
- `script.js` — frame preloading, canvas cover rendering, scroll tracking and easing
- `frames/` — 120 WebP frames extracted from the source video

## Customize
- Change `.sequence { height: 500vh; }` to make the animation scrub faster/slower.
- Adjust interpolation in `script.js`: `* 0.16` (higher = more responsive, lower = softer).
- The canvas uses a `cover` fit, so it fills desktop and mobile screens without distortion.
