# Plan: Parallax Love Icons (Multi-Layer Depth Effect)

## Context

The site currently tiles a single heart SVG pattern at 5% opacity as a flat background
on Sections 2 and 3 (`+page.svelte:L32, L41`). The user wants a **parallax effect** with
love icons at multiple depth layers — some in the **foreground** (closer, larger, faster)
and some in the **background** (further, smaller, slower) — creating a sense of depth
as the user scrolls.

**Constraint:** The scroll container uses `snap-y snap-mandatory` on a div (not `window`),
so scroll events must be captured from that container element.

---

## Approach: Scroll-Driven Parallax Layers

Create a `ParallaxHearts.svelte` component that renders multiple layers of love icons.
Each layer scrolls at a different rate relative to the page scroll position, producing
the parallax depth illusion. Use `translateY` transforms driven by a scroll listener
on the snap container.

### Why not CSS-only `perspective` / `translateZ`?

CSS 3D parallax (`perspective` on parent + `translateZ` on children) **conflicts with
`overflow-y: scroll` + `snap-y`** in most browsers. The snap container traps the scroll
context, breaking the perspective projection. A JS scroll listener is more reliable here.

### Why not `animation-timeline: scroll()`?

Browser support for CSS scroll-driven animations is still incomplete (no Firefox/Safari
as of early 2026). Not production-safe without a polyfill.

---

## Step 1: Create `ParallaxHearts.svelte` Component

**File:** `src/lib/components/ParallaxHearts.svelte` (NEW)

### Architecture

```
+---------------------------------------------+
|  Section (relative, overflow-hidden)          |
|                                               |
|  [Layer 0 — deep background]  speed: 0.1x    |
|    tiny hearts, 3-5% opacity, many            |
|                                               |
|  [Layer 1 — mid background]   speed: 0.3x    |
|    small hearts, 5-8% opacity, moderate       |
|                                               |
|  [Content — z-10]                             |
|    text, headings (unchanged)                 |
|                                               |
|  [Layer 2 — foreground]       speed: 0.6x    |
|    larger hearts, 8-12% opacity, few          |
|    blur(1px) for depth-of-field               |
|                                               |
+---------------------------------------------+
```

### Layer Configuration

| Layer | Speed | Icon Size | Opacity | Count | Blur | z-index |
|-------|-------|-----------|---------|-------|------|---------|
| 0 — deep bg | 0.1 | 16–24px | 0.03–0.05 | 20–30 | none | 0 |
| 1 — mid bg | 0.3 | 28–40px | 0.05–0.08 | 12–18 | none | 1 |
| 2 — foreground | 0.6 | 48–72px | 0.08–0.12 | 6–10 | blur(1px) | 20 |

**Speed** = fraction of scroll distance applied as `translateY` offset.
A speed of 0.3 means the layer moves at 30% of the scroll rate → appears further away.

### Icon Style: Candy Conversation Hearts

All icons are **heart shapes only** — styled like classic Sweethearts / conversation heart
candies with a pastel multi-color palette:

| Color Name | Hex | Notes |
|------------|-----|-------|
| Candy Pink | `#FF6B9D` | classic pink heart |
| Hot Red | `#E8334A` | bold red |
| Lavender | `#C9A0DC` | soft purple |
| Lemon | `#FDFD96` | pale yellow |
| Mint | `#AAF0D1` | green pastel |
| White | `#FFFFFF` | classic white candy |

Heart SVG path: `M20 10c-2-6-10-6-10 1s10 13 10 13 10-6 10-13-8-7-10-1z`

Each heart gets a **randomly assigned color** from the palette above. The fill color
is applied directly to the SVG `fill` attribute. Combined with the per-layer opacity,
the colors appear as subtle pastel washes in the background and slightly more vivid
in the foreground layer.

### Props

```ts
interface Props {
  scrollY: number;       // current scroll position (bound from parent)
  sectionIndex: number;  // which section (0-4), for seeded randomness
  density?: 'sparse' | 'medium' | 'dense';  // icon count multiplier
}
```

### Svelte 5 Implementation Notes

- Use `$derived` for transform calculations (pure computation from `scrollY`).
- Generate icon positions with a **seeded PRNG** from `sectionIndex` so positions
  are deterministic (no layout shift, SSR-safe).
- Render icons as inline `<svg>` elements inside absolutely-positioned `<div>`s.
- Each layer is a single `<div>` with `will-change: transform` for GPU compositing.
- The `pointer-events: none` on all layers so content remains interactive.

---

## Step 2: Capture Scroll Position from Snap Container

**File:** `src/routes/+page.svelte` (EDIT)

The outer `<div class="h-screen ... snap-y snap-mandatory">` needs a scroll listener.

```svelte
<script lang="ts">
  let scrollY = $state(0);

  function onScroll(e: Event) {
    scrollY = (e.target as HTMLElement).scrollTop;
  }
</script>

<div ... onscroll={onScroll}>
```

Pass `scrollY` down to each `ParallaxHearts` instance per section.

### Performance

- `scrollTop` reads are cheap (no forced reflow).
- Transforms on `will-change: transform` layers are GPU-composited.
- No `requestAnimationFrame` throttle needed — Svelte's reactive system batches updates.
- If jank appears, add `requestAnimationFrame` debounce as a follow-up.

---

## Step 3: Integrate into Page Sections

**File:** `src/routes/+page.svelte` (EDIT)

Replace the static heart `<div>`s (lines 32, 41) with `<ParallaxHearts>`:

```svelte
<!-- Section 2: The Story -->
<section class="h-screen ... relative overflow-hidden">
  <ParallaxHearts {scrollY} sectionIndex={1} density="medium" />
  <div class="text-center text-white ... relative z-10">
    ...
  </div>
</section>
```

Apply to **all 5 sections** with candy-colored hearts everywhere.
Vary density per section:

| Section | Density | Notes |
|---------|---------|-------|
| 1 — Hero | sparse | keep hero clean, subtle depth |
| 2 — Story | medium | colorful candy hearts floating |
| 3 — Moments | medium | warm pastel depth |
| 4 — Game | sparse | don't compete with chess board |
| 5 — Forever | dense | climactic, most hearts |

---

## Step 4: Seeded Random Positioning

Use a simple seeded PRNG so icon positions are stable across renders:

```ts
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
```

For each layer, generate `count` icons with random:
- `x`: 0–100% (left position)
- `y`: -20% to 120% (allows icons to start/end off-screen for smooth parallax)
- `rotation`: 0–360deg
- `scale`: within layer's size range
- `icon`: random selection from the icon set

---

## Files Modified

| File | Action |
|------|--------|
| `src/lib/components/ParallaxHearts.svelte` | **Create** — parallax layer component |
| `src/routes/+page.svelte` | **Edit** — add scroll listener, replace static hearts with ParallaxHearts |

---

## Verification

1. `bun run dev` — no errors
2. Scroll through all sections — icons move at different rates creating depth
3. Foreground icons appear closer (larger, slightly blurred, faster movement)
4. Background icons appear further (smaller, subtle, slower movement)
5. Content text remains readable and interactive (pointer-events pass through)
6. `bun run check` — TypeScript passes
7. No jank on scroll (check with DevTools Performance tab)

---

## Resolved Decisions

@claude-opus-4.6: A few things to decide:

1. **Icon variety** — Do you want just hearts, or the mixed set (hearts + roses + chess pieces + sparkles)?
2. **Foreground blur** — The plan adds `blur(1px)` on foreground icons for depth-of-field. Want this or keep everything sharp?
3. **Gentle spin** — Step 5 adds a very slow rotation to icons. Want this or keep them static?
4. **All sections or just 2-3?** — Plan applies parallax to all 5 sections. Want it everywhere or only specific sections?

@architect:
1. Different colored hearts like candy conversation heart candies — hearts only, no mixed icons.
2. Some icons foreground (up close), some background — keep the multi-depth layers with blur.
3. No gentle spin — keep them static.
4. Everywhere — all 5 sections.

@claude-opus-4.6: Updated plan to reflect all decisions:
- Replaced icon variety with candy conversation hearts palette (pink, red, lavender, lemon, mint, white)
- Kept 3-layer depth system with foreground blur(1px) for depth-of-field
- Removed Step 5 (gentle spin) — icons are static
- All 5 sections get parallax hearts, density varies per section
- Replaced `variant` prop with `density` prop since it's hearts-only everywhere
