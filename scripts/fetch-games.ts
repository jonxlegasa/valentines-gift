/**
 * Fetch Chess.com games between two players and save as PGN files.
 *
 * Usage: bun run fetch-games <username> <opponent> [YYYY-MM] [--since=YYYY-MM]
 *
 * If YYYY-MM is provided, fetches that single month.
 * If omitted, discovers all available months via the archives endpoint
 * and fetches each with a 1 s delay between requests.
 *
 * --since=YYYY-MM  Skip archive months before this date (all-months mode only).
 *
 * Saves matching games to static/games/ as individual .pgn files.
 */

import {
  fetchMonthlyGames,
  fetchArchives,
  filterByOpponent
} from '../src/lib/utils/chesscom.js';
import { saveGames } from '../src/lib/utils/save.js';

const RATE_LIMIT_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function usage(): never {
  console.error('Usage: bun run fetch-games <username> <opponent> [YYYY-MM] [--since=YYYY-MM]');
  console.error('');
  console.error('Examples:');
  console.error('  bun run fetch-games hikaru magnuscarlsen 2025-01');
  console.error('  bun run fetch-games hikaru magnuscarlsen');
  console.error('  bun run fetch-games hikaru magnuscarlsen --since=2024-06');
  process.exit(1);
}

function parseSinceFlag(args: string[]): string | undefined {
  const flag = args.find((a) => a.startsWith('--since='));
  if (!flag) return undefined;
  const value = flag.split('=')[1];
  if (!/^\d{4}-\d{1,2}$/.test(value)) {
    console.error(`Invalid --since format: "${value}" — expected YYYY-MM`);
    process.exit(1);
  }
  return value;
}

function archiveIsOnOrAfter(archiveUrl: string, since: string): boolean {
  const parts = archiveUrl.split('/');
  const y = Number(parts[parts.length - 2]);
  const m = Number(parts[parts.length - 1]);
  const [sinceY, sinceM] = since.split('-').map(Number);
  return y > sinceY || (y === sinceY && m >= sinceM);
}

async function fetchGames(): Promise<void> {
  const positional = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const [username, opponent, monthStr] = positional;
  const since = parseSinceFlag(process.argv.slice(2));

  if (!username || !opponent) {
    usage();
  }

  console.log(`Fetching games: ${username} vs ${opponent}`);

  let allGames: Awaited<ReturnType<typeof fetchMonthlyGames>> = [];

  if (monthStr) {
    // Single month mode
    const match = monthStr.match(/^(\d{4})-(\d{1,2})$/);
    if (!match) {
      console.error(`Invalid month format: "${monthStr}" — expected YYYY-MM`);
      process.exit(1);
    }
    const year = Number(match[1]);
    const month = Number(match[2]);

    console.log(`Fetching ${year}-${String(month).padStart(2, '0')}...`);
    const games = await fetchMonthlyGames(username, year, month);
    console.log(`  Found ${games.length} total games`);
    allGames = games;
  } else {
    // All months mode
    console.log('Discovering available months...');
    let archives = await fetchArchives(username);

    if (since) {
      const before = archives.length;
      archives = archives.filter((url) => archiveIsOnOrAfter(url, since));
      console.log(`  --since=${since}: skipped ${before - archives.length} older month(s)`);
    }

    console.log(`  Fetching ${archives.length} monthly archive(s)`);

    for (let i = 0; i < archives.length; i++) {
      // Parse year/month from archive URL
      const parts = archives[i].split('/');
      const year = Number(parts[parts.length - 2]);
      const month = Number(parts[parts.length - 1]);
      const label = `${year}-${String(month).padStart(2, '0')}`;

      console.log(`  [${i + 1}/${archives.length}] Fetching ${label}...`);
      const games = await fetchMonthlyGames(username, year, month);
      console.log(`    ${games.length} games`);
      allGames.push(...games);

      if (i < archives.length - 1) {
        await sleep(RATE_LIMIT_MS);
      }
    }
  }

  // Filter by opponent
  const matched = filterByOpponent(allGames, opponent);
  console.log(`\nFiltered: ${matched.length} game(s) between ${username} and ${opponent}`);

  if (matched.length === 0) {
    console.log('No games found. Nothing to save.');
    return;
  }

  // Save to static/games/
  const paths = await saveGames(matched);
  console.log(`\nSaved ${paths.length} PGN file(s) to static/games/:`);
  for (const p of paths) {
    console.log(`  ${p}`);
  }
}

fetchGames().catch((err) => {
  console.error('Fetch failed:', err);
  process.exit(1);
});
