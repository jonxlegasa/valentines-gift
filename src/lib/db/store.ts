/**
 * LowDB store — persist analysis results to static/data/db.json.
 *
 * This module is used by the analysis script (Node/Bun context), NOT by the
 * browser. The frontend reads db.json via fetch('/data/db.json').
 */

import { JSONFilePreset } from "lowdb/node";
import type { Low } from "lowdb";

import type {
  AnnotatedMove,
  DbBranch,
  DbGame,
  DbNovelty,
  DbSchema,
} from "./schema.js";
import { emptySchema } from "./schema.js";

import type { GameInfo, MoveTrie, TrieNode } from "../trie/types.js";
import {
  continuations,
  gameCount,
  isBranchPoint as isTrieBranch,
  isNovelty as isTrieNovelty,
  pathSan,
} from "../trie/types.js";

// ---------------------------------------------------------------------------
// DB path
// ---------------------------------------------------------------------------

const DB_PATH = "static/data/db.json";

// ---------------------------------------------------------------------------
// Initialize / load
// ---------------------------------------------------------------------------

export async function loadDb(): Promise<Low<DbSchema>> {
  const db = await JSONFilePreset<DbSchema>(DB_PATH, emptySchema);
  return db;
}

// ---------------------------------------------------------------------------
// Save analysis results
// ---------------------------------------------------------------------------

/**
 * Walk the trie and persist the Option C hybrid structure to db.json.
 */
export async function saveAnalysis(
  trie: MoveTrie,
  noveltyNodes: TrieNode[],
  branchNodes: TrieNode[],
): Promise<void> {
  const db = await loadDb();

  // Determine the two players from the first game (if available)
  const players: [string, string] =
    trie.games.length > 0
      ? [trie.games[0].white, trie.games[0].black]
      : ["", ""];

  db.data = {
    meta: {
      players,
      analyzedAt: new Date().toISOString(),
      totalGames: trie.games.length,
    },
    games: trie.games.map((game) => annotateGame(game, trie)),
    novelties: noveltyNodes.map((node) => toDbNovelty(node, trie)),
    branches: branchNodes.map((node) => toDbBranch(node)),
  };

  await db.write();
}

// ---------------------------------------------------------------------------
// Read accessors
// ---------------------------------------------------------------------------

export async function getGames(): Promise<DbGame[]> {
  const db = await loadDb();
  return db.data.games;
}

export async function getNovelties(): Promise<DbNovelty[]> {
  const db = await loadDb();
  return db.data.novelties;
}

export async function getBranches(): Promise<DbBranch[]> {
  const db = await loadDb();
  return db.data.branches;
}

// ---------------------------------------------------------------------------
// Internal converters
// ---------------------------------------------------------------------------

/**
 * Annotate each move in a game with trie metadata (gameCount, novelty, branch).
 */
function annotateGame(game: GameInfo, trie: MoveTrie): DbGame {
  const annotatedMoves: AnnotatedMove[] = [];
  const noveltyPlies: number[] = [];

  let current: TrieNode = trie.root;

  for (let i = 0; i < game.moves.length; i++) {
    const san = game.moves[i];
    const ply = i + 1;
    const child = current.children.get(san);

    if (!child) break; // shouldn't happen for a game in the trie

    const novelty = isTrieNovelty(child);
    const branchPoint = isTrieBranch(current); // parent had multiple children

    annotatedMoves.push({
      san,
      ply,
      gameCount: gameCount(child),
      isNovelty: novelty,
      isBranchPoint: branchPoint,
    });

    if (novelty) {
      noveltyPlies.push(ply);
    }

    current = child;
  }

  return {
    id: game.id,
    white: game.white,
    black: game.black,
    result: game.result,
    date: game.date,
    url: game.url,
    moves: annotatedMoves,
    noveltyPlies,
  };
}

/** Convert a novelty TrieNode to the DbNovelty persistence format. */
function toDbNovelty(node: TrieNode, trie: MoveTrie): DbNovelty {
  const parent = node.parent!; // novelties always have a parent
  const game = trie.games[node.gameIndices[0]];

  // Determine who played the novel move: odd ply = White, even ply = Black
  const playedBy = node.ply % 2 === 1 ? game.white : game.black;

  // Alternative moves at the parent (siblings, excluding this node's move)
  const alternatives = continuations(parent).filter((m) => m !== node.move);

  return {
    path: pathSan(node),
    ply: node.ply,
    san: node.move!,
    playedBy,
    gameId: node.gameIndices[0],
    sharedUntilPly: parent.ply,
    gamesAtParent: gameCount(parent),
    parentGameIds: [...parent.gameIndices],
    alternativesAtParent: alternatives,
  };
}

/** Convert a branch-point TrieNode to the DbBranch persistence format. */
function toDbBranch(node: TrieNode): DbBranch {
  const conts: { san: string; gameCount: number }[] = [];
  for (const [san, child] of node.children) {
    conts.push({ san, gameCount: gameCount(child) });
  }

  return {
    path: pathSan(node),
    ply: node.ply,
    gameCount: gameCount(node),
    continuations: conts,
  };
}
