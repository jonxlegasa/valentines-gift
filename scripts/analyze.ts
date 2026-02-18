/**
 * Analysis pipeline — reads PGN files, builds trie, writes db.json.
 *
 * Usage: bun run analyze
 *
 * Reads .pgn and .txt files from static/games/
 * Writes analysis results to static/data/db.json
 */

import { readdir, readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

import { parsePgn } from "../src/lib/trie/parse.js";
import { buildTrie } from "../src/lib/trie/build.js";
import { findNovelties, findBranchPoints } from "../src/lib/trie/query.js";
import { saveAnalysis } from "../src/lib/db/store.js";

const GAMES_DIR = "static/games";
const DATA_DIR = "static/data";

async function analyze(): Promise<void> {
  // Ensure output directory exists
  await mkdir(DATA_DIR, { recursive: true });

  // Read all PGN/TXT files from the games directory
  let files: string[];
  try {
    const entries = await readdir(GAMES_DIR);
    files = entries
      .filter((f) => f.endsWith(".pgn") || f.endsWith(".txt"))
      .sort(); // deterministic order
  } catch {
    console.error(`No games directory found at ${GAMES_DIR}`);
    console.error("Create it and add .pgn or .txt files, then re-run.");
    process.exit(1);
  }

  if (files.length === 0) {
    console.error(`No .pgn or .txt files found in ${GAMES_DIR}`);
    process.exit(1);
  }

  console.log(`Found ${files.length} game file(s) in ${GAMES_DIR}`);

  // Parse each file individually
  const games = [];
  for (let i = 0; i < files.length; i++) {
    const filePath = join(GAMES_DIR, files[i]);
    const content = await readFile(filePath, "utf-8");
    try {
      const game = parsePgn(content, i);
      games.push(game);
      console.log(`  [${i}] ${files[i]} → ${game.white} vs ${game.black} (${game.moves.length} moves)`);
    } catch (err) {
      console.error(`  [${i}] ${files[i]} — FAILED to parse:`, err);
    }
  }

  if (games.length === 0) {
    console.error("No games parsed successfully.");
    process.exit(1);
  }

  // Build trie
  console.log(`\nBuilding trie from ${games.length} game(s)...`);
  const trie = buildTrie(games);

  // Find novelties and branch points
  const novelties = findNovelties(trie);
  const branches = findBranchPoints(trie);
  console.log(`  Novelties: ${novelties.length}`);
  console.log(`  Branch points: ${branches.length}`);

  // Save to db.json
  await saveAnalysis(trie, novelties, branches);
  console.log(`\nAnalysis saved to ${DATA_DIR}/db.json`);
}

analyze().catch((err) => {
  console.error("Analysis failed:", err);
  process.exit(1);
});
