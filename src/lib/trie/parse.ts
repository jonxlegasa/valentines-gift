/**
 * Single-game PGN parser using chess.js.
 *
 * Each file is one game. No multi-game splitter needed — the analysis
 * pipeline loops over files in a directory and calls parsePgn() once per file.
 */

import { Chess } from "chess.js";
import type { GameInfo } from "./types.js";

/**
 * Parse a single PGN string into a GameInfo.
 *
 * @param pgn  - Raw PGN text (one game)
 * @param id   - Numeric identifier for this game (assigned by caller)
 * @returns GameInfo with headers + SAN move list
 * @throws If chess.js cannot parse the PGN
 */
export function parsePgn(pgn: string, id: number): GameInfo {
  const chess = new Chess();
  chess.loadPgn(pgn);

  const headers = chess.getHeaders();

  return {
    id,
    white: headers.White ?? "Unknown",
    black: headers.Black ?? "Unknown",
    result: headers.Result ?? "*",
    date: headers.Date ?? "",
    url: headers.Link ?? headers.Site ?? "",
    moves: chess.history(),
  };
}

/**
 * Parse multiple PGN strings (one game each) into GameInfo[].
 *
 * @param pgnTexts - Array of raw PGN strings, one per game
 * @returns GameInfo[] with sequential IDs starting at 0
 */
export function parseMultiplePgns(pgnTexts: string[]): GameInfo[] {
  return pgnTexts.map((pgn, index) => parsePgn(pgn, index));
}
