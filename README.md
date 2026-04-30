git init
git add .
git commit -m "chore: initial commit — add InfiniteMarquee demo"
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
# InfiniteMarquee

A small, zero-dependency infinite marquee library (vanilla JavaScript). This repo contains a demo page and the distributable UMD script `infinite-marquee.js` which can be used as a standalone CDN-backed script.

Live demo
- Demo site (GitHub Pages): https://ashfad0273.github.io/Infinite-Marquee/

CDN (jsDelivr)
You can load the library from jsDelivr using the GitHub versioned path. The latest version (main branch) can be referenced like this:

```html
<script src="https://cdn.jsdelivr.net/gh/ashfad0273/Infinite-Marquee@main/infinite-marquee.js"></script>
```

Or pin to a specific release tag (recommended for production):

```html
<script src="https://cdn.jsdelivr.net/gh/ashfad0273/Infinite-Marquee@v2.0.0/infinite-marquee.js"></script>
```

Quick usage
1. Include the script in your page head or before the closing `</body>` tag:

```html
<script src="https://cdn.jsdelivr.net/gh/ashfad0273/Infinite-Marquee@main/infinite-marquee.js"></script>
```

2. Add any container element and mark it with `data-marquee` plus optional `data-marquee-*` attributes (see full attribute reference below):

```html
<div data-marquee data-marquee-speed="60" data-marquee-direction="left">
	<div>Item 1</div>
	<div>Item 2</div>
	<div>Item 3</div>
</div>
```

3. The script auto-initializes all `[data-marquee]` elements on DOMContentLoaded. You can also initialize manually:

```html
<script>
	// After loading the script
	InfiniteMarquee.autoInit();

	// Or instantiate directly
	const el = document.querySelector('[data-marquee]');
	const imq = new InfiniteMarquee(el, { speed: 80, direction: 'left' });
	// control programmatically
	imq.pause();
	imq.play();
	imq.update({ speed: 40 });
</script>
```

Attribute reference
All `data-marquee-*` attributes mirror the constructor options. Values are strings and booleans are expressed as `"true"` or `"false"` (or omitted for default behavior). If an attribute is missing, defaults are used.

- `data-marquee-speed` (number, px/s) — Movement speed in pixels per second. Default: `50`.
- `data-marquee-direction` ("left" | "right" | "up" | "down") — Scroll direction. Default: `left`.
- `data-marquee-gap` (number, px) — Gap between items in pixels. Default: `40`.
- `data-marquee-pause-on-hover` (boolean) — When `true`, hovering pauses the animation. Default: `true`.
- `data-marquee-reverse-on-hover` (boolean) — When `true`, hovering reverses the direction (animation is flipped). Default: `false`.
- `data-marquee-drag` (boolean) — When `true`, allows click/touch drag-to-scroll with inertia. Default: `true`.
- `data-marquee-fade` (boolean) — When `true`, applies a fade mask on the edges. Default: `false`.
- `data-marquee-fade-size` (number, px) — Size of the fade mask in pixels. Default: `80`.
- `data-marquee-slow-on-hover` (boolean) — When `true`, the animation slows while hovered instead of pausing. Default: `false`.
- `data-marquee-slow-speed` (number, px/s) — The slow speed used when `slow-on-hover` is enabled. Default: `15`.

Programmatic API
- Constructor: `new InfiniteMarquee(element, options)` — returns an instance.
	- Options (same keys as attributes): `speed`, `direction`, `gap`, `pauseOnHover`, `reverseOnHover`, `drag`, `fade`, `fadeSize`, `slowOnHover`, `slowSpeed`.

- Methods:
	- `pause()` — Pause the animation.
	- `play()` — Resume the animation.
	- `toggle()` — Toggle pause/play.
	- `update(opts)` — Dynamically update options (e.g., `imq.update({ speed: 20 })`).
	- `destroy()` — Remove the marquee and restore the original DOM.

Accessibility and notes
- The library respects the user's `prefers-reduced-motion` setting and will slow animations accordingly.
- Items cloned for the infinite effect are given `aria-hidden="true"` so screen readers only read original content.

Files
- `index.html` — demo page showing several configurations.
- `infinite-marquee.js` — library (UMD) with auto-init.

License
Add a `LICENSE` file if you want to publish under a specific license (MIT is common).

If you'd like, I can also:
- Add a versioned release tag (e.g., `v2.0.0`) and push it so the CDN pin example is available.
- Add a small `LICENSE` (MIT) and a simple GitHub Actions workflow to publish a release.

---
Updated README with CDN usage, attribute reference, and examples.
