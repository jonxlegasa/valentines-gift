/**
 * LowDB schema — Option C hybrid structure.
 *
 * The db.json file stores pre-computed analysis results so the frontend
 * never needs to touch raw PGN or rebuild the trie at runtime.
 */

// ---------------------------------------------------------------------------
// Top-level schema
// ---------------------------------------------------------------------------

export interface DbSchema {
  meta: {
    players: [string, string];
    analyzedAt: string;
    totalGames: number;
  };
  games: DbGame[];
  novelties: DbNovelty[];
  branches: DbBranch[];
}

// ---------------------------------------------------------------------------
// Game with annotated moves
// ---------------------------------------------------------------------------

export interface DbGame {
  id: number;
  white: string;
  black: string;
  result: string;
  date: string;
  url: string;
  moves: AnnotatedMove[];
  noveltyPlies: number[];   // all plies where a novelty occurs (e.g. [5, 12, 23])
}

/**
 * Every move in a game is a node in the trie graph. The arrows pointing
 * to that node are the games that played through it.
 *
 * Visual:  e4 (42 arrows) → e5 (38) → Nf3 (30) → Nc6 (28) → Bb5 (1) ★
 *
 * When gameCount drops to 1 and the parent had more, that's a novelty.
 * When multiple different moves exist at the parent, that's a branch point.
 */
export interface AnnotatedMove {
  san: string;              // Standard Algebraic Notation
  ply: number;              // 1-indexed half-move (odd = White, even = Black)
  gameCount: number;        // arrows pointing to this node in the trie
  isNovelty: boolean;       // gameCount === 1 && parent.gameCount > 1
  isBranchPoint: boolean;   // parent node had multiple children
}

// ---------------------------------------------------------------------------
// Novelty — an edge where the arrow count drops to 1
// ---------------------------------------------------------------------------

/**
 * Example: 28 games reached "1.e4 e5 2.Nf3 Nc6" (parent).
 *          3 different moves were played there: Bb5(15), Bc4(12), Be2(1).
 *          Be2 is a novelty — only game 5 went this way.
 *
 *   Parent node (28 arrows) ──Be2──▶ Novelty node (1 arrow: game 5)
 *                            ──Bb5──▶ (15 arrows)
 *                            ──Bc4──▶ (12 arrows)
 */
export interface DbNovelty {
  path: string[];               // full move sequence to this novelty node
  ply: number;
  san: string;                  // the novel move itself
  playedBy: string;             // player name who played it
  gameId: number;               // the single game that took this path
  sharedUntilPly: number;       // parent node's ply (where arrows were still many)
  gamesAtParent: number;        // arrow count at parent node
  parentGameIds: number[];      // which games pointed to the parent node
  alternativesAtParent: string[]; // other moves (edges) played at parent node
}

// ---------------------------------------------------------------------------
// Branch point — a node with multiple children
// ---------------------------------------------------------------------------

export interface DbBranch {
  path: string[];
  ply: number;
  gameCount: number;
  continuations: { san: string; gameCount: number }[];
}

// ---------------------------------------------------------------------------
// Default empty schema
// ---------------------------------------------------------------------------

export const emptySchema: DbSchema = {
  meta: {
    players: ["", ""],
    analyzedAt: "",
    totalGames: 0,
  },
  games: [],
  novelties: [],
  branches: [],
};
