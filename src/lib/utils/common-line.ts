import type { AnnotatedMove, DbGame, DbBranch } from '$lib/db/schema.js';

/**
 * Extract the most popular opening line — the longest move sequence from
 * the start that stays above a minimum game-count threshold.
 *
 * Explores all significant continuations at each branch point and returns
 * the deepest path. Ties broken by game count.
 *
 * Falls back to walking games[0].moves when branches aren't available.
 */
export function findCommonLine(
  games: DbGame[],
  branches: DbBranch[] = [],
  minRatio: number = 0.2,
): AnnotatedMove[] {
  if (games.length === 0) return [];

  const totalGames = games.length;
  const minGames = Math.max(2, Math.floor(totalGames * minRatio));

  if (branches.length > 0) {
    return walkBranches(games, branches, minGames);
  }

  // Fallback: walk games[0].moves while gameCount stays high
  const moves = games[0].moves;
  const commonLine: AnnotatedMove[] = [];
  for (const move of moves) {
    if (move.gameCount >= minGames) {
      commonLine.push(move);
    } else {
      break;
    }
  }
  return commonLine;
}

interface LineCandidate {
  sans: string[];
  gameCounts: number[];
}

function walkBranches(
  games: DbGame[],
  branches: DbBranch[],
  minGames: number,
): AnnotatedMove[] {
  // Index branches by path string for fast lookup
  const branchByPath = new Map<string, DbBranch>();
  for (const branch of branches) {
    branchByPath.set(branch.path.join(' '), branch);
  }

  // DFS to find the longest qualifying path
  function dfs(path: string[]): LineCandidate {
    const key = path.join(' ');
    const branch = branchByPath.get(key);

    if (!branch) {
      return { sans: [...path], gameCounts: [] };
    }

    let best: LineCandidate = { sans: [...path], gameCounts: [] };

    for (const cont of branch.continuations) {
      if (cont.gameCount < minGames) continue;

      const child = dfs([...path, cont.san]);
      // Prefer longer lines; break ties by gameCount of the last move
      if (
        child.sans.length > best.sans.length ||
        (child.sans.length === best.sans.length &&
          cont.gameCount > (best.gameCounts[0] ?? 0))
      ) {
        best = child;
        best.gameCounts = [cont.gameCount, ...child.gameCounts.slice(1)];
      }
    }

    return best;
  }

  const longest = dfs([]);

  // Convert to AnnotatedMove[]
  return longest.sans.map((san, i): AnnotatedMove => {
    const ply = i + 1;
    const gameCount = longest.gameCounts[i] ?? 0;

    // Try to use the real AnnotatedMove from a game that plays this line
    // by finding a game whose moves match this path
    const gameMove = findMatchingGameMove(games, longest.sans, ply);

    return gameMove ?? {
      san,
      ply,
      gameCount,
      isNovelty: false,
      isBranchPoint: true,
    };
  });
}

/** Find the AnnotatedMove at `ply` from a game whose opening matches `path`. */
function findMatchingGameMove(
  games: DbGame[],
  path: string[],
  ply: number,
): AnnotatedMove | null {
  for (const game of games) {
    let matches = true;
    for (let i = 0; i < ply && i < path.length; i++) {
      if (game.moves[i]?.san !== path[i]) {
        matches = false;
        break;
      }
    }
    if (matches && game.moves[ply - 1]) {
      return game.moves[ply - 1];
    }
  }
  return null;
}
