/**
 * Map Chess.com usernames to personal pronouns.
 *
 * papi962  → "me" / "I"   (the page owner)
 * aralys17 → "you"        (the Valentine)
 */
const ME = 'papi962';
const YOU = 'aralys17';

/** Object form — for labels, "X vs Y", "played by X". */
export function nameOf(username: string): string {
  if (username.toLowerCase() === ME) return 'me';
  if (username.toLowerCase() === YOU) return 'you';
  return username;
}

/** Subject form — for sentences: "I played", "you played". */
export function subjectOf(username: string): string {
  if (username.toLowerCase() === ME) return 'I';
  if (username.toLowerCase() === YOU) return 'you';
  return username;
}
