/**
 * Trie construction — single pass, O(N * M) where N = games, M = avg moves.
 *
 * Port of Python build_trie().
 */

import type { GameInfo, MoveTrie, TrieNode } from "./types.js";
import { createTrieNode } from "./types.js";

/**
 * Build a move trie from an array of parsed games.
 *
 * Each game's move sequence is inserted into the trie. Nodes track which
 * games passed through them via `gameIndices`.
 */
export function buildTrie(games: GameInfo[]): MoveTrie {
  const root: TrieNode = createTrieNode(null, 0, null);

  for (const game of games) {
    let current = root;
    root.gameIndices.push(game.id);

    for (let i = 0; i < game.moves.length; i++) {
      const san = game.moves[i];
      const ply = i + 1; // 1-indexed

      if (!current.children.has(san)) {
        current.children.set(san, createTrieNode(san, ply, current));
      }

      current = current.children.get(san)!;
      current.gameIndices.push(game.id);
    }
  }

  return { root, games };
}
