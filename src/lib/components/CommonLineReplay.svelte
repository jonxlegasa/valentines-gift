<script lang="ts">
  import { Chess as ChessEngine } from 'chess.js';
  import { onMount, onDestroy, untrack } from 'svelte';
  import { browser } from '$app/environment';
  import type { DbGame, DbBranch } from '$lib/db/schema.js';
  import type { AnnotatedMove } from '$lib/db/schema.js';
  import { findCommonLine } from '$lib/utils/common-line.js';
  import { figurine } from '$lib/utils/chess-notation.js';

  let {
    games = [] as DbGame[],
    branches = [] as DbBranch[],
    label = 'Our Opening Moves',
  }: {
    games?: DbGame[];
    branches?: DbBranch[];
    label?: string;
  } = $props();

  // Board component (dynamically imported for SSR safety)
  let BoardComponent: any = $state(null);
  let board: any = $state(null);

  // Common line data
  let commonMoves: AnnotatedMove[] = $state([]);
  let positions: string[] = $state([]);

  // Replay state
  let currentMoveIndex: number = $state(-1);
  let timer: ReturnType<typeof setTimeout> | null = $state(null);
  let isRunning: boolean = $state(false);

  const MOVE_INTERVAL_MS = 800;
  const END_PAUSE_MS = 2000;
  const START_PAUSE_MS = 800;

  // Current FEN — index 0 is starting position, index N is after move N-1
  let currentFen = $derived(positions[currentMoveIndex + 1] ?? '');

  // Current move annotation
  let currentAnnotation = $derived(
    currentMoveIndex >= 0 ? commonMoves[currentMoveIndex] ?? null : null
  );

  // The game count at the end of the common line (how many games play this full sequence)
  let lineGameCount = $derived(
    commonMoves.length > 0 ? commonMoves[commonMoves.length - 1].gameCount : 0
  );

  // Format move number from ply: ply 1 → "1.", ply 2 → "1...", ply 3 → "2."
  function moveLabel(move: AnnotatedMove): string {
    const num = Math.ceil(move.ply / 2);
    return move.ply % 2 === 1 ? `${num}. ${figurine(move.san)}` : `${num}... ${figurine(move.san)}`;
  }

  onMount(async () => {
    const mod = await import('svelte-chess');
    BoardComponent = mod.Chess;

    // Extract common line and pre-compute FEN positions
    const line = findCommonLine(games, branches);
    if (line.length > 0) {
      commonMoves = line;

      const replay = new ChessEngine();
      const fens: string[] = [replay.fen()];
      for (const move of line) {
        replay.move(move.san);
        fens.push(replay.fen());
      }
      positions = fens;

      setTimeout(() => startReplay(), START_PAUSE_MS);
    }
  });

  // Sync board when FEN changes
  $effect(() => {
    const fen = currentFen;
    const b = board;
    if (b && fen) {
      untrack(() => b.load(fen));
    }
  });

  function startReplay() {
    if (isRunning || commonMoves.length === 0) return;
    isRunning = true;
    scheduleNextTick();
  }

  function scheduleNextTick() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(tick, MOVE_INTERVAL_MS);
  }

  function tick() {
    if (!isRunning) return;

    if (currentMoveIndex < commonMoves.length - 1) {
      currentMoveIndex = currentMoveIndex + 1;
      scheduleNextTick();
    } else {
      // Reached end — pause, then loop back
      timer = setTimeout(() => {
        if (isRunning) {
          currentMoveIndex = -1;
          timer = setTimeout(() => {
            if (isRunning) {
              currentMoveIndex = 0;
              scheduleNextTick();
            }
          }, START_PAUSE_MS);
        }
      }, END_PAUSE_MS);
    }
  }

  function stopReplay() {
    isRunning = false;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  onDestroy(() => {
    stopReplay();
  });
</script>

{#if commonMoves.length > 0}
  <div class="flex flex-col items-center gap-5">
    <h2 class="text-5xl sm:text-6xl font-bold text-white drop-shadow-md text-center">{label}</h2>
    <p class="text-lg text-white/80 text-center max-w-md leading-relaxed">
      We have played this sequence of moves <span class="font-bold text-white">{lineGameCount}</span> times out of {games.length} games.
    </p>

    <!-- Board -->
    <div class="w-64 h-64 sm:w-80 sm:h-80 relative neo-board-frame-sm">
      {#if browser && BoardComponent}
        <BoardComponent bind:this={board} />
      {:else}
        <div class="w-full h-full flex items-center justify-center bg-pink-100 border-[3px] border-black">
          <p class="text-gray-500 text-xs">Loading...</p>
        </div>
      {/if}
    </div>

    <!-- Move annotation -->
    <div class="text-center space-y-1.5">
      {#if currentAnnotation}
        <p class="text-white font-mono text-sm font-semibold">
          {moveLabel(currentAnnotation)}
        </p>
        <p class="text-white/60 text-xs">
          Played in {currentAnnotation.gameCount}/{games.length} games
        </p>
      {:else}
        <p class="text-white/40 text-xs font-mono">Starting position</p>
      {/if}
      <p class="text-white/30 text-[0.6rem]">
        Move {Math.max(0, currentMoveIndex + 1)} of {commonMoves.length}
      </p>
    </div>
  </div>
{/if}
