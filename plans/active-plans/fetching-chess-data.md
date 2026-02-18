# Plan: Chess.com PubAPI Fetch Utilities

## Context

The `scripts/analyze.ts` pipeline reads `.pgn` files from `static/games/` and produces `static/data/db.json`. Currently `static/games/` is empty — games must be manually placed there. The user wants utility functions to **automatically fetch games from Chess.com's PubAPI**, filtered to only games between two specific players, and save them as individual PGN files ready for the analyzer.

## Files to Create

### 1. `src/lib/utils/chesscom.ts` — PubAPI client

**Types:**
- `ChessComPlayer` — `{ username, rating?, result? }`
- `ChessComGame` — `{ url, pgn, time_control, end_time, rated, white: ChessComPlayer, black: ChessComPlayer, ... }`
- `MonthlyGamesResponse` — `{ games: ChessComGame[] }`
- `ArchivesResponse` — `{ archives: string[] }`

**Functions:**

| Function | Signature | Purpose |
|----------|-----------|---------|
| `fetchMonthlyGames` | `(username, year, month) → Promise<ChessComGame[]>` | GET `/pub/player/{u}/games/{YYYY}/{MM}` |
| `fetchArchives` | `(username) → Promise<string[]>` | GET `/pub/player/{u}/games/archives` |
| `filterByOpponent` | `(games, opponent) → ChessComGame[]` | Case-insensitive filter on white/black username |

**Details:**
- Base URL: `https://api.chess.com/pub`
- User-Agent header: `chess-and-love/1.0`
- Throw on non-OK responses with status code in error message
- `filterByOpponent` normalizes usernames to lowercase for comparison

### 2. `src/lib/utils/save.ts` — PGN file writer

**Functions:**

| Function | Signature | Purpose |
|----------|-----------|---------|
| `generateFilename` | `(game: ChessComGame) → string` | Deterministic filename from game metadata |
| `saveGames` | `(games, outputDir?) → Promise<string[]>` | Write each game's `.pgn` field to `static/games/` |

**Filename format:** `{white}_{black}_{end_time}.pgn`
- Lowercase, filesystem-safe
- `end_time` (unix timestamp) makes it sortable and unique per game
- Example: `hikaru_magnuscarlsen_1708901234.pgn`
- Deterministic: re-running produces same filenames (idempotent overwrites)

**Dependencies:** `node:fs/promises` (mkdir, writeFile) — already used in `scripts/analyze.ts`

### 3. `scripts/fetch-games.ts` — CLI convenience script

```
Usage: bun run fetch-games <username> <opponent> [YYYY-MM]
```

- If `YYYY-MM` provided → fetch that single month
- If omitted → use `fetchArchives` to discover all months, fetch each with 1s delay between requests
- Filter by opponent, save to `static/games/`, log progress

### 4. `package.json` — add script entry

Add `"fetch-games": "bun run scripts/fetch-games.ts"` alongside existing `"analyze"` script.

## Integration

```
Chess.com API → bun run fetch-games → static/games/*.pgn → bun run analyze → static/data/db.json
```

The PubAPI returns standard PGN with headers (`White`, `Black`, `Result`, `Date`, `Link`). These are exactly what `parsePgn()` in `src/lib/trie/parse.ts:L19-34` expects via `chess.js`.

## No New Dependencies

Uses native `fetch()` (Bun built-in) and `node:fs/promises` + `node:path` (already used in `scripts/analyze.ts`).

## Verification

1. `bun run fetch-games <user> <opponent> 2025-01` — confirm PGN files appear in `static/games/`
2. `bun run analyze` — confirm db.json is generated without parse errors
3. `bun run dev` — confirm the page loads with real game data
