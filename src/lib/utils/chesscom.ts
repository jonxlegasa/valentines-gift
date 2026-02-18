/**
 * Chess.com PubAPI client — types and fetch helpers.
 *
 * Base URL: https://api.chess.com/pub
 * Docs: https://www.chess.com/announcements/view/published-data-api
 */

// ---------------------------------------------------------------------------
// API response types
// ---------------------------------------------------------------------------

export interface ChessComPlayer {
  username: string;
  rating: number;
  result: string;              // "win", "checkmated", "timeout", "resigned", etc.
  '@id': string;               // profile URL
  uuid: string;
}

export interface ChessComGame {
  url: string;                 // game URL on chess.com
  pgn: string;                 // full PGN with headers and moves
  time_control: string;        // e.g. "600" or "180+2"
  end_time: number;            // unix timestamp
  rated: boolean;
  white: ChessComPlayer;
  black: ChessComPlayer;
  time_class: string;          // "bullet", "blitz", "rapid", "daily"
  rules: string;               // "chess", "chess960", etc.
  eco?: string;                // opening ECO code
  accuracies?: {               // only present if analysis was run
    white: number;
    black: number;
  };
  fen: string;                 // final position
  uuid: string;
  tcn: string;                 // encoded move notation
  initial_setup: string;       // starting FEN
}

export interface MonthlyGamesResponse {
  games: ChessComGame[];
}

export interface ArchivesResponse {
  archives: string[];          // array of monthly endpoint URLs
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_URL = 'https://api.chess.com/pub';
const USER_AGENT = 'chess-and-love/1.0';

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

/**
 * Fetch all games for a user in a specific month.
 */
export async function fetchMonthlyGames(
  username: string,
  year: number,
  month: number
): Promise<ChessComGame[]> {
  const mm = String(month).padStart(2, '0');
  const url = `${BASE_URL}/player/${encodeURIComponent(username)}/games/${year}/${mm}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT }
  });

  if (!res.ok) {
    throw new Error(`Chess.com API error: ${res.status} ${res.statusText} — ${url}`);
  }

  const data: MonthlyGamesResponse = await res.json();
  return data.games;
}

/**
 * Fetch the list of available monthly archive URLs for a user.
 */
export async function fetchArchives(username: string): Promise<string[]> {
  const url = `${BASE_URL}/player/${encodeURIComponent(username)}/games/archives`;

  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT }
  });

  if (!res.ok) {
    throw new Error(`Chess.com API error: ${res.status} ${res.statusText} — ${url}`);
  }

  const data: ArchivesResponse = await res.json();
  return data.archives;
}

/**
 * Filter games to only those played against a specific opponent.
 * Comparison is case-insensitive.
 */
export function filterByOpponent(
  games: ChessComGame[],
  opponent: string
): ChessComGame[] {
  const lower = opponent.toLowerCase();
  return games.filter(
    (g) =>
      g.white.username.toLowerCase() === lower ||
      g.black.username.toLowerCase() === lower
  );
}
