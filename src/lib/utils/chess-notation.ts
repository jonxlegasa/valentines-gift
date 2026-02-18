/** Unicode chess piece symbols for figurine algebraic notation. */
const PIECE_SYMBOLS: Record<string, string> = {
  K: '\u265A', // ♚
  Q: '\u265B', // ♛
  R: '\u265C', // ♜
  B: '\u265D', // ♝
  N: '\u265E', // ♞
};

/**
 * Convert a SAN move string to figurine notation by replacing the leading
 * piece letter (K, Q, R, B, N) with its unicode chess symbol.
 * Pawn moves (e.g. "e4") and castling ("O-O") are returned unchanged.
 */
export function figurine(san: string): string {
  if (san.length > 1 && PIECE_SYMBOLS[san[0]]) {
    return PIECE_SYMBOLS[san[0]] + san.slice(1);
  }
  return san;
}
