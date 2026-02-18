# Plan: Full-Page Scroll-Snap View with Tailwind CSS

## Context

The chess-and-love project is a fresh SvelteKit (Svelte 5, Vite 7) app with no styling setup.
The goal is to add Tailwind CSS and create a full-viewport scroll-snap page where each section
fills the entire screen and scrolling snaps between sections.


@architect: GREAT CONTEXT you understand the problem at hand.

---

## Step 1: Install Tailwind CSS v4

@architect: good yes we want use tailwindcss

**Command:**
```bash
bun install -D tailwindcss @tailwindcss/vite
```

**File:** `package.json` (modified by bun automatically)

---

## Step 2: Add Tailwind Vite plugin

**File:** `vite.config.ts`

Add `@tailwindcss/vite` plugin before the sveltekit plugin:

```ts
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()]
});
```

**Why before sveltekit():** Tailwind needs to process CSS before SvelteKit handles component styles.

---

## Step 3: Create `src/lib/styles/app.css`

**File:** `src/lib/styles/app.css` (NEW)

```css
@import "tailwindcss";
```

Tailwind v4 uses CSS-first config with `@import` instead of `@tailwind` directives.
Placed under `src/lib/` so it can be imported via the `$lib` alias from any route.

---

## Step 4: Import CSS in layout via `$lib` alias

**File:** `src/routes/+layout.svelte`

Add `import '$lib/styles/app.css';` in the script block.

@claude-opus-4.6: Updated to use `$lib` alias path as requested.
@architect: make it so that these are dynamic paths

## Step 5: Build scroll-snap page

**File:** `src/routes/+page.svelte` (REPLACE)

Valentine's themed scroll-snap layout:

```svelte
<div class="h-screen w-full overflow-y-scroll snap-y snap-mandatory">
  <!-- Hero: Love at first scroll -->
  <section class="h-screen w-full snap-start bg-gradient-to-br from-rose-500 to-pink-600">
    Chess & Love — hero title, romantic tagline
  </section>

  <!-- Section 2: The story / about -->
  <section class="h-screen w-full snap-start bg-gradient-to-br from-pink-600 to-fuchsia-500">
    A love letter or story section
  </section>

  <!-- Section 3: The moments / gallery -->
  <section class="h-screen w-full snap-start bg-gradient-to-br from-fuchsia-500 to-purple-600">
    Cherished moments or highlights
  </section>

  <!-- Section 4: Forever / closing -->
  <section class="h-screen w-full snap-start bg-gradient-to-br from-purple-600 to-rose-400">
    Closing message, call to action
  </section>
</div>
```

**Valentine's color palette:** rose, pink, fuchsia, purple — warm romantic gradients
**Content theme:** Love story arc (intro → story → moments → forever)

Key Tailwind classes:
- **Container:** `h-screen overflow-y-scroll snap-y snap-mandatory` — fills viewport, enables scroll-snap
- **Sections:** `h-screen w-full snap-start` — each section fills viewport, snaps to top
- **Centering:** `flex items-center justify-center` — content centered in each section
- **Valentine colors:** `from-rose-500`, `from-pink-600`, `from-fuchsia-500`, `from-purple-600`

@claude-opus-4.6: Updated to Valentine's theme with romantic color palette and love story section arc.
@architect: I want the layout to be a valentine setup

---

## Files Modified

| File | Action |
|------|--------|
| `package.json` | Modified (bun install adds deps) |
| `vite.config.ts` | Edit — add Tailwind plugin |
| `src/lib/styles/app.css` | Create — Tailwind import via `$lib` |
| `src/routes/+layout.svelte` | Edit — import `$lib/styles/app.css` |
| `src/routes/+page.svelte` | Replace — Valentine's scroll-snap sections |

---

## Post-Implementation Edits

@architect: Make it so that when we click play the game RUNS and shows all the moves without having to click the button over and over.

@claude-opus-4.6: Added auto-play feature to ChessPgnViewer.
- `ChessPgnViewer.svelte`: Added `isPlaying`/`playTimer` state and `togglePlay()`/`stopPlay()` functions — 800ms interval advances moves automatically
- Play/pause toggle button (rose-accented ▶/⏸) replaces old single-step ▶; separate ⏩ button for manual step-forward
- Manual navigation (any button/move click) stops auto-play; pressing play at end restarts from beginning
- Spacebar keyboard shortcut toggles play/pause
- `onDestroy` cleanup prevents timer leaks

@architect: Change the background of the chess theme and pieces to be more modern and change the theme for the whole website to be MORE valentine like.

@claude-opus-4.6: Valentine theme overhaul across board, controls, and page sections.
- `src/lib/styles/app.css`: Custom chessground board CSS — rose/mauve squares (#fce4ec/#c48b9f), pink last-move highlights, rose move destination dots, matching coordinate label colors, dark wine body background (#1a0a10)
- `src/routes/+page.svelte`: Deepened gradients (rose-900, pink-800, fuchsia-800, wine #2d0a1a), added heart SVG pattern backgrounds, dot sparkle overlays, bouncing scroll arrow on hero, heart symbol on final section
- `ChessPgnViewer.svelte`: All controls rethemed — rose glass-morphism buttons (bg-rose-950/50, border-rose-400/10), backdrop-blur move list sidebar, glowing shadow on active move and play button, rose-tinted loading placeholder

---

## Verification

1. `bun run dev` — dev server starts without errors
2. Open browser — see 4 full-screen colored sections
3. Scroll — sections snap into place smoothly
4. `bun run check` — TypeScript passes
