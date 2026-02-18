# Chess & Love

A Valentine's Day gift — an interactive web app that visualizes two players' shared chess history from Chess.com. It turns your games into a scrollable love letter with parallax hearts, game replays, stats, an opening explorer, and novelty detection.

## Tech Stack

- [SvelteKit](https://svelte.dev/docs/kit) + [Svelte 5](https://svelte.dev)
- [TailwindCSS 4](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)
- [chess.js](https://github.com/jhlywa/chess.js) + [svelte-chess](https://github.com/gtim/svelte-chess)
- [lowdb](https://github.com/typicode/lowdb) for local JSON database
- [Bun](https://bun.sh) as the runtime & package manager

## Getting Started

```sh
# Install dependencies
bun install

# Start the dev server
bun run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start the dev server |
| `bun run build` | Build for production |
| `bun run preview` | Preview the production build |
| `bun run check` | Run svelte-check for type errors |
| `bun run lint` | Check formatting with Prettier |
| `bun run format` | Auto-format with Prettier |
| `bun run fetch-games` | Fetch games from Chess.com |
| `bun run analyze` | Analyze games to build the opening trie, detect novelties, and generate `static/data/db.json` |

## Data Pipeline

1. **Fetch** — `bun run fetch-games` downloads PGN files from Chess.com into `static/games/`.
2. **Analyze** — `bun run analyze` parses the PGNs, builds a move trie, identifies opening branches and novelties, and writes `static/data/db.json`.
3. **Serve** — The SvelteKit app loads `db.json` at runtime and renders the interactive sections.
