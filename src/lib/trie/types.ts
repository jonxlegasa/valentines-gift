/**
 * Trie data structures for multi-game PGN analysis.
 *
 * Ply convention (1-indexed):
 *   ply 1 = White's first move (1. e4)
 *   ply 2 = Black's response  (1... e5)
 *   ply 3 = White's second    (2. Nf3)
 *   Odd ply = White, even ply = Black.
 */

// ---------------------------------------------------------------------------
// Core interfaces
// ---------------------------------------------------------------------------

export interface TrieNode {
  move: string | null;          // SAN string, null for root
  ply: number;                  // half-move depth (1 = White's first)
  children: Map<string, TrieNode>;
  gameIndices: number[];        // which games passed through this node
  parent: TrieNode | null;
}

export interface GameInfo {
  id: number;
  white: string;
  black: string;
  result: string;
  date: string;
  url: string;
  moves: string[];              // SAN move list
}

export interface MoveTrie {
  root: TrieNode;
  games: GameInfo[];
}

// ---------------------------------------------------------------------------
// TrieNode factory
// ---------------------------------------------------------------------------

export function createTrieNode(
  move: string | null,
  ply: number,
  parent: TrieNode | null,
): TrieNode {
  return {
    move,
    ply,
    children: new Map(),
    gameIndices: [],
    parent,
  };
}

// ---------------------------------------------------------------------------
// Utility functions (port of Python @property methods)
// ---------------------------------------------------------------------------

export function isRoot(node: TrieNode): boolean {
  return node.parent === null;
}

export function isLeaf(node: TrieNode): boolean {
  return node.children.size === 0;
}

export function isBranchPoint(node: TrieNode): boolean {
  return node.children.size > 1;
}

export function isNovelty(node: TrieNode): boolean {
  return gameCount(node) === 1 && node.parent !== null && gameCount(node.parent) > 1;
}

export function gameCount(node: TrieNode): number {
  return node.gameIndices.length;
}

/** Convert ply to human move number (1-indexed). Ply 1,2 → move 1; ply 3,4 → move 2. */
export function moveNumber(node: TrieNode): number {
  return Math.ceil(node.ply / 2);
}

/** Walk from node to root, collecting all ancestors (root-first, excluding root). */
export function path(node: TrieNode): TrieNode[] {
  const nodes: TrieNode[] = [];
  let current: TrieNode | null = node;
  while (current !== null && current.parent !== null) {
    nodes.push(current);
    current = current.parent;
  }
  return nodes.reverse();
}

/** SAN move sequence from root to this node. */
export function pathSan(node: TrieNode): string[] {
  return path(node).map((n) => n.move!);
}

/** All child moves available at this node. */
export function continuations(node: TrieNode): string[] {
  return Array.from(node.children.keys());
}
