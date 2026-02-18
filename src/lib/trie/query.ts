/**
 * Trie query functions — extract novelties, branches, and common sequences.
 *
 * Port of Python sections 5.3–5.8 (unplayedMoves dropped per architect).
 */

import { Chess } from "chess.js";
import type { MoveTrie, TrieNode } from "./types.js";
import {
  gameCount,
  isBranchPoint,
  isNovelty,
  isRoot,
  pathSan,
} from "./types.js";

// ---------------------------------------------------------------------------
// Traversal helper
// ---------------------------------------------------------------------------

/** BFS over the entire trie, yielding every node (including root). */
function* walkTrie(root: TrieNode): Generator<TrieNode> {
  const queue: TrieNode[] = [root];
  while (queue.length > 0) {
    const node = queue.shift()!;
    yield node;
    for (const child of node.children.values()) {
      queue.push(child);
    }
  }
}

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

/** Nodes where gameCount === 1 and parent.gameCount > 1. */
export function findNovelties(trie: MoveTrie): TrieNode[] {
  const results: TrieNode[] = [];
  for (const node of walkTrie(trie.root)) {
    if (isNovelty(node)) {
      results.push(node);
    }
  }
  return results;
}

/** Nodes with more than one child (different moves played). */
export function findBranchPoints(trie: MoveTrie): TrieNode[] {
  const results: TrieNode[] = [];
  for (const node of walkTrie(trie.root)) {
    if (isBranchPoint(node)) {
      results.push(node);
    }
  }
  return results;
}

/** Non-root nodes where gameCount >= minGames. */
export function findCommonSequences(
  trie: MoveTrie,
  minGames: number,
): TrieNode[] {
  const results: TrieNode[] = [];
  for (const node of walkTrie(trie.root)) {
    if (!isRoot(node) && gameCount(node) >= minGames) {
      results.push(node);
    }
  }
  return results;
}

/** Walk the trie along a sequence of SAN moves, returning the final node or null. */
export function subtreeAt(
  trie: MoveTrie,
  moveSequence: string[],
): TrieNode | null {
  let current: TrieNode = trie.root;
  for (const san of moveSequence) {
    const child = current.children.get(san);
    if (!child) return null;
    current = child;
  }
  return current;
}

/** Replay the path to a node on a fresh Chess instance, returning the board state. */
export function boardAt(node: TrieNode): Chess {
  const chess = new Chess();
  for (const san of pathSan(node)) {
    chess.move(san);
  }
  return chess;
}
