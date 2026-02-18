import type { DbBranch } from '$lib/db/schema.js';
import { figurine } from '$lib/utils/chess-notation.js';

export interface OpeningLine {
  moves: string[];
  gameCount: number;
  percentage: number; // 0-100
}

/**
 * Extract the most popular multi-move opening sequences from the branch tree.
 *
 * Walks the branch trie depth-first, following continuations that represent
 * a significant share of games. Stops when a line has no further branches
 * (all games converge) or when it reaches max depth.
 *
 * Returns lines sorted by gameCount descending, capped at `limit`.
 */
export function findPopularLines(
  branches: DbBranch[],
  totalGames: number,
  options: { minGames?: number; maxDepth?: number; limit?: number } = {},
): OpeningLine[] {
  const { minGames = 4, maxDepth = 6, limit = 10 } = options;

  // Index branches by their path string for O(1) lookup
  const branchByPath = new Map<string, DbBranch>();
  for (const branch of branches) {
    branchByPath.set(branch.path.join(' '), branch);
  }

  const lines: OpeningLine[] = [];

  function walk(path: string[], gameCount: number) {
    // Find branch at the current position
    const key = path.join(' ');
    const branch = branchByPath.get(key);

    if (!branch || path.length >= maxDepth) {
      // No more branching or hit depth limit — record this line
      if (path.length >= 2) {
        lines.push({
          moves: [...path],
          gameCount,
          percentage: Math.round((gameCount / totalGames) * 100),
        });
      }
      return;
    }

    // Count how many significant continuations exist
    const significantConts = branch.continuations.filter(
      (c) => c.gameCount >= minGames,
    );

    if (significantConts.length === 0) {
      // All continuations are tiny — record current line
      if (path.length >= 2) {
        lines.push({
          moves: [...path],
          gameCount,
          percentage: Math.round((gameCount / totalGames) * 100),
        });
      }
      return;
    }

    if (significantConts.length === 1) {
      // Only one significant path — extend the line
      walk([...path, significantConts[0].san], significantConts[0].gameCount);
      return;
    }

    // Multiple significant continuations — recurse into each
    for (const cont of significantConts) {
      walk([...path, cont.san], cont.gameCount);
    }
  }

  // Start from root (empty path)
  walk([], totalGames);

  // Sort by game count descending
  lines.sort((a, b) => b.gameCount - a.gameCount);
  return lines.slice(0, limit);
}

/**
 * Format a move sequence as standard chess notation.
 * e.g. ["e4", "e5", "Nf3", "Nc6"] → "1. e4 e5 2. Nf3 Nc6"
 */
export function formatLine(moves: string[]): string {
  const parts: string[] = [];
  for (let i = 0; i < moves.length; i++) {
    if (i % 2 === 0) {
      parts.push(`${Math.floor(i / 2) + 1}.`);
    }
    parts.push(figurine(moves[i]));
  }
  return parts.join(' ');
}
