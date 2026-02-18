# Plan: Multi-Game PGN Trie with Novelty Annotations

@architect: "We should stick to the TypeScript implementation. Parse novelties, save in JSON via LowDB. Use Option C hybrid structure."

@claude-opus-4.6: Implementation plan below. All work scoped to `chess-and-love` SvelteKit frontend. No Python backend.

---

## Goal

Parse multiple PGN games between two players, build a move trie to detect
novelties and branch points, persist annotations in a LowDB JSON file,
and surface them in the existing `ChessPgnViewer`.

---

## Dependencies to Add

| Package | Purpose |
|---------|---------|
| `lowdb` | JSON file database — stores annotated games, novelties, branches |

`chess.js` (already at `^1.4.0` in `package.json:L30`) provides PGN parsing,
move validation, and legal move generation — all primitives needed to port
the Python trie.

---

## New Files

```
src/lib/
├── trie/
│   ├── types.ts          # TrieNode, GameInfo, MoveTrie interfaces
│   ├── parse.ts          # Multi-game PGN parser (port of Python parse_pgn)
│   ├── build.ts          # Trie construction (port of Python build_trie)
│   └── query.ts          # Novelties, branch points, common sequences, unplayed moves
├── db/
│   ├── schema.ts         # LowDB schema types (Option C structure)
│   └── store.ts          # LowDB init, read/write helpers
```

## Modified Files

```
src/lib/components/ChessPgnViewer.svelte   # Consume annotations, highlight novelties
src/routes/+page.svelte                     # Load from LowDB instead of inline PGN
```

---

## Step 1 — Type Definitions (`src/lib/trie/types.ts`)

Port the Python dataclasses to TypeScript interfaces:

```ts
interface TrieNode {
  move: string | null;        // SAN string, null for root
  ply: number;                // half-move depth (1 = White's first)
  children: Map<string, TrieNode>;
  gameIndices: number[];      // which games passed through this node
  parent: TrieNode | null;
}

// @architect: Is the ply field like when I say what happened during move one it is whites move then black's response?
// @claude-opus-4.6: Yes exactly. "Move 1" in chess notation is actually TWO plies:
//   ply 1 = White plays (1. e4)
//   ply 2 = Black responds (1... e5)
//   ply 3 = White plays again (2. Nf3)
//   ply 4 = Black responds (2... Nc6)
// So ply is the atomic unit — one player's one move. Odd ply = White, even ply = Black.
// When we say "noveltyAtPly: 5" that means White's 3rd move was the novel one.

interface GameInfo {
  id: number;
  white: string;
  black: string;
  result: string;
  date: string;
  url: string;
  moves: string[];            // SAN move list
}

interface MoveTrie {
  root: TrieNode;
  games: GameInfo[];
}
```


Derived properties from the Python `TrieNode` become utility functions
or getters: `isRoot`, `isLeaf`, `isBranchPoint`, `isNovelty`, `gameCount`,
`moveNumber`, `path`, `pathSan`, `continuations`.

Source: user-provided Python — `TrieNode` dataclass and its `@property` methods.


@architect: Everything else is good for the types.

@claude-opus-4.6: Types locked in. Moving on.

---

## Step 2 — Multi-Game PGN Parser (`src/lib/trie/parse.ts`)

Port of Python `parse_pgn()`. Uses `chess.js` to:

1. Split multi-game PGN text (chess.js `loadPgn` handles one game at a time,
   so we split on double-newline + header pattern `\n\n[`)
2. For each game: `new Chess()` → `loadPgn(segment)` → `header()` for metadata,
   `history()` for moves
3. Return `GameInfo[]`

Key difference from Python: `python-chess` has a streaming `read_game()` that
handles multi-game PGN natively. `chess.js` does not, so we need a splitter.

@architect: A comment, I intend to have multi png support but I honestly was just going to have a dir filled with the moves in .png format or txt files with the game in there. Then name each game. IN a sense the lowdb takes care of this and we just have to parse it one at a time I assume the db returns an array. Then we process one each time. For example, I had a vision for the INTRO section to be a simple view no abilit yot play forward moves or go back. Just a section that will display with increased speed all the gaems from the db.

@claude-opus-4.6: Got it. This simplifies the parser significantly:

1. **No multi-game PGN splitter needed.** Each file is one game. We read a
   directory of `.pgn` or `.txt` files, parse each individually with `chess.js`,
   and push each into LowDB as a `DbGame`. The `bun run analyze` script just
   loops over files in a folder (e.g. `static/games/`).

2. **LowDB is the source of truth.** After the analyze script runs, the frontend
   never touches raw PGN again — it reads `db.json` which has `games[]` as an
   array. Yes, `db.data.games` returns the full array.

3. **Intro section — "rapid replay" mode.** New UI concept: a read-only board
   that auto-plays through ALL games sequentially with increasing speed. No
   controls, no move list — just the board flashing through every game. Like a
   highlight reel. I'll add this as a new step in the plan.

Source: `chess.js` API — `loadPgn()`, `header()`, `history()`.
Source: user-provided Python — `parse_pgn()` function.

---

## Step 3 — Trie Construction (`src/lib/trie/build.ts`)

Direct port of Python `build_trie()`. Single pass, O(N * M):

```
for each game:
  current = root
  root.gameIndices.push(game.id)
  for each move in game.moves:
    if move not in current.children:
      create child node
    current = current.children[move]
    current.gameIndices.push(game.id)
```

Source: user-provided Python — `build_trie()` function.

---

## Step 4 — Query Functions (`src/lib/trie/query.ts`)

Port these Python functions:

| Function | What it does |
|----------|-------------|
| `findNovelties(trie)` | Nodes where `gameCount === 1` and `parent.gameCount > 1` |
| `findBranchPoints(trie)` | Nodes with `children.size > 1` |
| `findCommonSequences(trie, minGames)` | Non-root nodes with `gameCount >= minGames` |
| `subtreeAt(trie, moveSequence)` | Walk trie to a specific position |
| `boardAt(node)` | Replay `node.path()` on a `Chess()` instance |
| `unplayedMoves(node)` | `legalMoves - playedMoves` at a position |

Source: user-provided Python — sections 5.3 through 5.8.

---

## Step 5 — LowDB Schema & Store (`src/lib/db/`)

### Schema (Option C — Hybrid)

```ts
interface DbSchema {
  meta: {
    players: [string, string];
    analyzedAt: string;
    totalGames: number;
  };
  games: DbGame[];
  novelties: DbNovelty[];
  branches: DbBranch[];
}

interface DbGame {
  id: number;
  white: string;
  black: string;
  result: string;
  date: string;
  url: string;
  moves: AnnotatedMove[];        // each move tagged with its graph metadata
  noveltyPlies: number[];        // all plies where a novelty occurs (e.g. [5, 12, 23])
}

// Every move in a game is a node in the trie graph. The arrows pointing
// to that node are the games that played through it. This struct captures
// how many arrows (games) point to each node along this game's path.
//
// Visual:  e4 (42 arrows) → e5 (38) → Nf3 (30) → Nc6 (28) → Bb5 (1) ★
//
// When gameCount drops to 1 and the parent had more, that's a novelty.
// When multiple different moves exist at the parent, that's a branch point.
interface AnnotatedMove {
  san: string;                   // Standard Algebraic Notation
  ply: number;                   // 1-indexed half-move (odd = White, even = Black)
  gameCount: number;             // arrows pointing to this node in the trie
  isNovelty: boolean;            // gameCount === 1 && parent.gameCount > 1
  isBranchPoint: boolean;        // parent node had multiple children (different moves played here)
}

// A novelty is an edge in the graph where the arrow count drops to 1.
// It links back to the parent node (the divergence point with many arrows).
//
// Example: 28 games reached "1.e4 e5 2.Nf3 Nc6" (parent).
//          3 different moves were played there: Bb5(15), Bc4(12), Be2(1).
//          Be2 is a novelty — only game 5 went this way.
//
//   Parent node (28 arrows) ──Be2──▶ Novelty node (1 arrow: game 5)
//                            ──Bb5──▶ (15 arrows)
//                            ──Bc4──▶ (12 arrows)
interface DbNovelty {
  path: string[];                // full move sequence to this novelty node
  ply: number;
  san: string;                   // the novel move itself
  playedBy: string;              // player name who played it
  gameId: number;                // the single game that took this path
  sharedUntilPly: number;        // parent node's ply (where arrows were still many)
  gamesAtParent: number;         // arrow count at parent node
  parentGameIds: number[];       // which games pointed to the parent node
  alternativesAtParent: string[];// other moves (edges) played at parent node
}

interface DbBranch {
  path: string[];
  ply: number;
  gameCount: number;
  continuations: { san: string; gameCount: number }[];
}
```

### Store (`src/lib/db/store.ts`)

- Initialize LowDB with a `db.json` file in `static/` or `src/lib/data/`
- `loadDb()` — read the JSON
- `saveAnalysis(trie: MoveTrie)` — walk the trie, extract novelties/branches,
  write Option C structure
- `getGames()`, `getNovelties()`, `getBranches()` — typed accessors

Source: conversation — user chose Option C hybrid JSON structure.
Source: model knowledge — LowDB API (`JSONFile` adapter, `Low` class).

---

## Step 6 — Analysis Pipeline (new script or page action)

A single function that ties steps 2-5 together:

```
analyzePgn(pgnText: string) → void
  1. parse(pgnText) → GameInfo[]
  2. buildTrie(games) → MoveTrie
  3. findNovelties(trie) → TrieNode[]
  4. findBranchPoints(trie) → TrieNode[]
  5. saveAnalysis(trie, novelties, branches) → writes db.json
```

This runs once (or on file upload). The viewer then reads from `db.json`.

Could be triggered by:
- A "Load & Analyze PGN" button in the UI (extends existing file upload at
  `ChessPgnViewer.svelte:L272-278`)
- A SvelteKit server action / API route
- A standalone script via `bun run analyze`

Source: `src/lib/components/ChessPgnViewer.svelte:L272-278` — existing file upload.
Source: user-provided Python — `trie_from_pgn()` convenience function.

---

## Step 7 — Frontend Integration (`ChessPgnViewer.svelte`)

### 7a. New props / state

The viewer currently accepts a single `pgn` string prop (`L6`).
Extend to also accept the LowDB data:

- `games: DbGame[]` — all parsed games
- `novelties: DbNovelty[]` — pre-computed novelties
- `branches: DbBranch[]` — pre-computed branch points
- `selectedGameId: number` — which game is active in the viewer

### 7b. Game selector

Add a dropdown or list above the board to switch between games.
Shows: `{white} vs {black} — {date} — {result}`.

### 7c. Novelty highlighting in the move list

The move list sidebar (`L201-230`) currently renders a plain grid.
Enhance:

- If `moves[i]` matches a novelty at that ply → highlight with a distinct
  color/badge (e.g. gold border, star icon, "First time!" tooltip)
- `noveltyAtPly` on each `DbGame` tells us exactly which move index to flag —
  zero computation at render time

### 7d. Branch point indicators

At branch points in the move list, show a subtle fork icon or expand
button that reveals what alternatives were played and in how many games.

### 7e. Novelty summary section

On `+page.svelte`, add a new scroll-snap section: "Our Novel Moves" —
a curated list of all novelties with context:
- "In game 12, you played 5. Bb5 — the first time either of you tried this
  after 4...Nc6 (12 games reached that position)"

Source: `src/lib/components/ChessPgnViewer.svelte:L6` — current `pgn` prop.
Source: `src/lib/components/ChessPgnViewer.svelte:L201-230` — move list sidebar.
Source: `src/routes/+page.svelte` — scroll-snap sections structure.

---

## Step 8 — Wire Into `+page.svelte`

Replace the hardcoded Anderssen vs Dufresne PGN with:

1. On mount: load `db.json` via fetch or import
2. Pass `games`, `novelties`, `branches` to `ChessPgnViewer`
3. Add "Our Novel Moves" scroll-snap section using `novelties[]`

Source: `src/routes/+page.svelte` — current inline PGN and section structure.

---

## Implementation Order

| # | Task | Depends on | New/Modified |
|---|------|-----------|--------------|
| 1 | Install `lowdb` | — | `package.json` |
| 2 | Type definitions | — | `src/lib/trie/types.ts` |
| 3 | Multi-game PGN parser | Step 2 | `src/lib/trie/parse.ts` |
| 4 | Trie construction | Steps 2-3 | `src/lib/trie/build.ts` |
| 5 | Query functions | Steps 2-4 | `src/lib/trie/query.ts` |
| 6 | LowDB schema & store | Steps 2, 5 | `src/lib/db/schema.ts`, `src/lib/db/store.ts` |
| 7 | Analysis pipeline | Steps 3-6 | `src/lib/trie/analyze.ts` |
| 8 | Frontend: game selector + novelty highlights | Steps 6-7 | `ChessPgnViewer.svelte` |
| 9 | Frontend: novelty summary section | Steps 6-8 | `+page.svelte` |

---

## Open Questions for @architect

1. **Where should `db.json` live?**
   @architect: This is fine
   @claude-opus-4.6: Decided — `static/data/db.json`. Accessible via `fetch('/data/db.json')` at runtime.

2. **Analysis trigger**:
   @architect: That is nice yea lets do that
   @claude-opus-4.6: Decided — `bun run analyze` script. Reads `.pgn`/`.txt` files from a
   games directory, builds trie, writes `static/data/db.json`. Runs before `bun run dev`.

3. **Game URLs / GameInfo redundancy**:
   @architect: This is what I wanted to talk about. The GameInfo will be redunant because the DB will have all of the games.
   @claude-opus-4.6: Agreed. `GameInfo` only exists during the analyze step as a transient
   structure. Once written to LowDB as `DbGame`, the frontend never uses `GameInfo` — it reads
   `DbGame` directly from `db.json`. The `url` field on `DbGame` is optional; if the PGN headers
   have a `[Link]` we capture it, otherwise it's empty string. No separate game registry needed.

4. **Unplayed moves — dropped. Move frequency counts instead.**
   @architect: The novelties plus branches are enough because one of the sections will be a
   simple UI showing we played this sequence of moves this many times per game. You know? We
   essentially want to count the copies of moves that we split up based on their appearances in
   games & also the count for novelties. A novelty will be one move with only 1 value next to it.

   @claude-opus-4.6: Crystal clear. So the UI for the "common sequences" section is essentially:

   ```
   1. e4    (42 games)    1... e5   (38 games)
   2. Nf3   (30 games)    2... Nc6  (28 games)
   3. Bb5   (1 game) ★    3... a6   (1 game) ★
   ```

   Where the number is `gameCount` from the trie node, and a ★ (or similar visual marker)
   appears when `gameCount === 1` — that's a novelty. So every move in the sequence has a
   count badge, and novelties naturally stand out as the ones with count = 1 next to them.

   This means we DON'T need the `unplayedMoves()` query. Dropping it from Step 4.
   We DO need `gameCount` on every node in the path, which the trie already provides.

---

## Post-Plan Implementation Notes

@architect: We want a UI in Section 1 showing a speed-by of common moves — a rapid replay of all games from the DB. Also the schema needs to evolve: games should tag novelties (multiple per game, not just one), and novelties should link back to the parent node in the graph (which games were at the divergence point).

@claude-opus-4.6: Implemented all plan steps plus the following post-plan additions:

**Schema evolution (Step 5 superseded):**
- `DbGame.moves`: changed from `string[]` to `AnnotatedMove[]` — each move now carries `san`, `ply`, `gameCount`, `isNovelty`, `isBranchPoint`
- `DbGame.noveltyAtPly`: replaced with `noveltyPlies: number[]` — supports multiple novelties per game
- `DbNovelty`: added `parentGameIds: number[]` — back-reference to all games at the divergence point (graph bidirectionality)
- Actual schema: `src/lib/db/schema.ts`

**New component — RapidReplay (not in original plan):**
- Created `src/lib/components/RapidReplay.svelte` — read-only auto-play board
- Speed ramps: 600ms → 100ms (decreases 40ms per game)
- Shows game counter, player names, per-move `gameCount` badge, amber `★ novel` markers
- Loops all games continuously, auto-starts after 800ms
- Wired into Section 1 of `src/routes/+page.svelte` — side-by-side layout with hero text when `hasDbData` is true

**Full pipeline implemented (Steps 1-9):**
- `src/lib/trie/types.ts` — TrieNode, GameInfo, MoveTrie interfaces
- `src/lib/trie/parse.ts` — single-game PGN parser using chess.js
- `src/lib/trie/build.ts` — trie construction, O(N*M)
- `src/lib/trie/query.ts` — findNovelties, findBranchPoints, findCommonSequences
- `src/lib/db/schema.ts` — Option C hybrid with AnnotatedMove and graph back-refs
- `src/lib/db/store.ts` — LowDB init, read/write
- `scripts/analyze.ts` — `bun run analyze` reads `static/games/*.pgn`, writes `static/data/db.json`
- `src/lib/components/ChessPgnViewer.svelte` — game selector, novelty highlights, branch indicators, gameCount badges
- `src/routes/+page.svelte` — loads db.json, passes to viewer, "Our Novel Moves" section, RapidReplay in hero

**package.json updates:**
- Added `lowdb@^7.0.1` to dependencies
- Added `"analyze": "bun run scripts/analyze.ts"` to scripts

