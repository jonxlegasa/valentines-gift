/**
 * PGN file writer — saves Chess.com games to static/games/.
 *
 * Filename format: {white}_{black}_{end_time}.pgn
 * Deterministic: re-running produces the same filenames (idempotent).
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { ChessComGame } from './chesscom.js';

const DEFAULT_DIR = 'static/games';

/**
 * Generate a deterministic, filesystem-safe filename for a game.
 *
 * Format: {white}_{black}_{end_time}.pgn
 * Example: hikaru_magnuscarlsen_1708901234.pgn
 */
export function generateFilename(game: ChessComGame): string {
  const white = game.white.username.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const black = game.black.username.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return `${white}_${black}_${game.end_time}.pgn`;
}

/**
 * Save multiple games as individual PGN files.
 * Creates the output directory if it doesn't exist.
 *
 * @returns Array of absolute paths to written files.
 */
export async function saveGames(
  games: ChessComGame[],
  outputDir: string = DEFAULT_DIR
): Promise<string[]> {
  await mkdir(outputDir, { recursive: true });

  const paths: string[] = [];
  for (const game of games) {
    const filename = generateFilename(game);
    const filePath = join(outputDir, filename);
    await writeFile(filePath, game.pgn, 'utf-8');
    paths.push(filePath);
  }

  return paths;
}
