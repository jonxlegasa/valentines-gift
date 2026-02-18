# Plan: Chess PGN Viewer

## Context

The chess-and-love project is a SvelteKit 2 app (Svelte 5, Vite 7, TypeScript) styled with
Tailwind CSS v4 via the Vite plugin. It currently has a Valentine's themed scroll-snap landing
page but no chess logic or interactive board. The goal is to add a PGN viewer that can load
`.pgn` files, display a chess board, and allow stepping through (replaying) game moves.

### Stack constraints

- **Package manager:** Bun (not npm/pnpm)
- **Svelte version:** 5 (runes mode — `$state`, `$derived`, `$effect`, `$props`)
- **Styling:** Tailwind CSS v4 (CSS-first config via `@import "tailwindcss"`)
- **TypeScript:** strict mode enabled
- **No UI component library** installed

### Key research findings

| Library | Role | License | Svelte 5 compatible? |
|---|---|---|---|
| `chess.js` | Move validation, PGN parsing, FEN generation | BSD-2-Clause | Yes (headless) |
| `svelte-chess` (gtim) | Board UI wrapping Chessground | GPL-3.0 | Svelte 4 patterns — needs SSR guard |
| `svelte-chessground` (gtim) | Lower-level Chessground wrapper | GPL-3.0 | Svelte 4 patterns |
| `chessground` (Lichess) | Board renderer (DOM-based) | GPL-3.0 | Framework-agnostic |
| `@mliebelt/pgn-parser` | Multi-game PGN, variations, annotations | MIT | Yes (headless) |
| `svelte-chess-pgn` | PGN-first Svelte component | BSD-3-Clause | Unmaintained, likely broken on Svelte 5 |

@claude-opus-4.6: The `svelte-chess` wrapper uses Svelte 4 idioms (`export let`, `on:click`,
`createEventDispatcher`). Since this project is Svelte 5 runes-only, we have two options:

1. **Use `svelte-chess` as-is** — Svelte 5 still supports legacy mode for imported components,
   but we must guard against SSR (Chessground manipulates DOM directly).
2. **Use `chessground` directly** — skip the Svelte wrapper, mount Chessground in an `$effect`
   on a container `<div>`, and control it imperatively. More work but avoids Svelte 4 compat issues.

@architect: We need to verify which approach works before committing. Step 0 is a spike.

---

## Step 0: Spike — verify `svelte-chess` works with Svelte 5 + Bun

**Goal:** Confirm the library loads, renders, and responds to `move()` calls in our stack.

**Commands:**
```bash
bun install svelte-chess chess.js
```

**File:** `src/routes/chess/+page.svelte` (NEW — throwaway test route, deleted after spike)

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  let ChessComponent: any = $state(null);
  let board: any = $state(null);

  onMount(async () => {
    const mod = await import('svelte-chess');
    ChessComponent = mod.Chess;
  });
</script>

{#if browser && ChessComponent}
  <svelte:component this={ChessComponent} bind:this={board} />
  <button onclick={() => board?.move('e4')}>Play e4</button>
{/if}
```

**Success criteria:**
- Board renders with pieces
- Clicking "Play e4" moves the pawn
- No SSR crash on `bun run build`

**If spike fails:** Fall back to direct `chessground` integration (see Fallback section below).

---

## Step 1: Install dependencies

**Commands:**
```bash
bun install chess.js
bun install svelte-chess        # if spike passed
# OR
bun install chessground         # if spike failed
```

**File:** `package.json` (modified by bun automatically)

---

## Step 2: Create `ChessPgnViewer.svelte` component

**File:** `src/lib/components/ChessPgnViewer.svelte` (NEW)

### Architecture

```
ChessPgnViewer.svelte
├── Props: pgn (string)
├── State: moves[], positions[] (FEN per move), currentMoveIndex
├── Logic: chess.js for PGN parsing + FEN generation
├── Board: svelte-chess (or chessground) for rendering
├── Controls: prev / next / start / end buttons
├── Move list: clickable SAN notation
└── File upload: <input type="file" accept=".pgn">
```

### Svelte 5 patterns to use

- `$state()` for `moves`, `currentMoveIndex`, `errorMessage`
- `$derived()` for computed values (current FEN, move counter text, button disabled states)
- `$effect()` only for Chessground mount/unmount or board sync (imperative DOM)
- `$props()` for the `pgn` input
- No `export let`, no `on:click` — use `onclick`, `$props`, `$bindable` as needed

### Keyboard navigation

- `ArrowRight` → next move
- `ArrowLeft` → previous move
- `Home` → go to start
- `End` → go to end

Attach via `onkeydown` on `<svelte:window>`.

### Styling approach

All styling via Tailwind utility classes. The board itself (Chessground) needs its own CSS
imported — this will be handled with a direct CSS import of `chessground/assets/chessground.base.css`
and a theme CSS file.

---

## Step 3: Integrate viewer as a scroll-snap section

@architect: I want this to be a component to be used in scroll section.

**File:** `src/routes/+page.svelte` (EDIT — add 5th section)

Add the `ChessPgnViewer` as a new section in the existing scroll-snap layout, between
the "Cherished Moments" and "Forever Yours" sections (or after "Forever Yours" as a final section).

```svelte
<!-- Section 5: Our Game -->
<section class="h-screen w-full snap-start bg-gradient-to-br from-purple-600 to-indigo-700
                flex items-center justify-center">
  <ChessPgnViewer pgn={samplePgn} />
</section>
```

Include a sample PGN (e.g., the Evergreen Game: Anderssen vs Dufresne, 1852) as a constant
in the page script so the viewer is immediately usable without file upload.

### SSR handling

Since the viewer is embedded in the main page (not a separate route), we cannot use
`export const ssr = false` without disabling SSR for the entire landing page. Instead,
use dynamic import + `browser` guard inside `ChessPgnViewer.svelte` itself:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  let BoardComponent: any = $state(null);

  onMount(async () => {
    const mod = await import('svelte-chess');
    BoardComponent = mod.Chess;
  });
</script>

{#if browser && BoardComponent}
  <!-- render board -->
{/if}
```

This keeps the rest of the page SSR-friendly while the chess board hydrates client-side.

---

## Step 4: Style the viewer with Tailwind

Layout for the viewer page:

```
┌──────────────────────────────────┐
│  Header: White vs Black (Date)   │
├──────────────┬───────────────────┤
│              │                   │
│  Chess Board │   Move List       │
│  (square)    │   (scrollable)    │
│              │                   │
├──────────────┴───────────────────┤
│  ⏮  ◀  Move 12/45  ▶  ⏭       │
├──────────────────────────────────┤
│  [Load PGN file]                 │
└──────────────────────────────────┘
```

Tailwind classes for responsive layout:
- Desktop: `grid grid-cols-[1fr_minmax(200px,300px)]` — board + sidebar
- Mobile: `flex flex-col` — board stacked above move list
- Board container: `aspect-square max-w-lg`
- Controls: `flex items-center justify-center gap-2`

Color palette: continue the Valentine's theme (rose/pink/purple accents).

---

## Step 5: Add PGN file upload

The component should accept PGN via:
1. **Prop** — for hardcoded/server-loaded games
2. **File input** — `<input type="file" accept=".pgn,.txt">` with `File.text()` API
3. **Textarea paste** — optional, for quick testing

---

## Step 6: (Future) Multi-game PGN support

If needed later, add `@mliebelt/pgn-parser` for:
- Splitting multi-game PGN files
- Preserving variations and annotations
- Game selector dropdown

This is out of scope for the initial implementation.

---

## Fallback: Direct Chessground integration

If `svelte-chess` does not work with Svelte 5, use `chessground` directly:

```svelte
<script lang="ts">
  import { Chessground } from 'chessground';
  import type { Api } from 'chessground/api';

  let container: HTMLDivElement;
  let cg: Api | null = $state(null);

  $effect(() => {
    if (container && !cg) {
      cg = Chessground(container, {
        fen: currentFen,
        viewOnly: true,
        animation: { enabled: true, duration: 300 }
      });
    }
    return () => cg?.destroy();
  });

  // Update board when FEN changes
  $effect(() => {
    cg?.set({ fen: currentFen });
  });
</script>

<div bind:this={container} class="aspect-square"></div>
```

This gives full control but requires manual CSS import for board theming.

---

## Files Modified / Created

| File | Action |
|------|--------|
| `package.json` | Modified (bun install adds deps) |
| `src/lib/components/ChessPgnViewer.svelte` | Create — main viewer component |
| `src/routes/+page.svelte` | Edit — add 5th scroll-snap section with viewer |

---

## Post-Implementation Edits

@architect: Make it so that when we click play the game RUNS and shows all the moves without having to click the button over and over.

@claude-opus-4.6: Added auto-play feature to ChessPgnViewer (not in original plan).
- `ChessPgnViewer.svelte`: Added `isPlaying`/`playTimer` state, `togglePlay()`/`stopPlay()` functions — 800ms setInterval auto-advances moves
- New play/pause toggle button (rose-accented ▶/⏸) added to nav controls; separate ⏩ button retained for single-step
- `goToMove()`: calls `stopPlay()` so any manual navigation halts auto-play
- Pressing play at `atEnd` restarts from beginning (`currentMoveIndex = -1`)
- Spacebar keyboard shortcut added to `handleKeydown` for toggle
- `onDestroy` cleanup prevents interval leaks

@architect: Change the background of the chess theme and pieces to be more modern and change the theme for the whole website to be MORE valentine like.

@claude-opus-4.6: Valentine theme overhaul — custom board CSS, deeper page gradients, glass-morphism controls.
- `src/lib/styles/app.css`: Custom chessground overrides — rose/mauve board squares (#fce4ec light, #c48b9f dark at 55% opacity), pink last-move/selected highlights, rose move-destination dots, matching coordinate label colors, dark wine body (#1a0a10)
- `src/routes/+page.svelte`: Deepened section gradients (rose-900, pink-800, fuchsia-800, wine #2d0a1a), subtle heart SVG pattern backgrounds, dot sparkle overlays, bouncing scroll arrow on hero, heart symbol on forever section
- `ChessPgnViewer.svelte` controls: rose glass-morphism buttons (bg-rose-950/50, border-rose-400/10, rounded-lg), backdrop-blur move list sidebar (bg-rose-950/40), glowing shadow on active move (shadow-rose-500/30), rose-tinted loading placeholder, pink-tinted text throughout

---

## Verification

1. `bun run dev` — dev server starts without errors
2. Open `/` — scroll to 5th section, board renders with sample game
3. Click next/prev — moves step forward/backward correctly
4. Keyboard arrows — same behavior (when viewer section is focused)
5. Upload `.pgn` file — game loads and is playable
6. `bun run build` — production build succeeds (no SSR crash from Chessground)
7. `bun run check` — TypeScript passes

---

## Resolved Questions

1. **GPL-3.0 license:** Accepted. @architect: GPL license is okay.
2. **Integration style:** Embedded as a scroll-snap section, not a dedicated route. @architect: I want this to be a component to be used in scroll section.
3. **Piece theme:** Default Lichess pieces. @architect: Piece theme should be the default basic one.
