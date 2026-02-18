<script lang="ts">
  import { Chess as ChessEngine } from 'chess.js';
  import { onMount, onDestroy, untrack } from 'svelte';
  import { browser } from '$app/environment';
  import type { DbGame } from '$lib/db/schema.js';
  import { nameOf } from '$lib/utils/personalize.js';
  import { figurine } from '$lib/utils/chess-notation.js';

  let { games = [] as DbGame[] }: { games?: DbGame[] } = $props();

  // Board component (dynamically imported for SSR safety)
  let BoardComponent: any = $state(null);
  let board: any = $state(null);

  // Replay state
  let currentGameIndex: number = $state(0);
  let currentMoveIndex: number = $state(-1);
  let timer: ReturnType<typeof setInterval> | null = $state(null);
  let isRunning: boolean = $state(false);

  // Pre-computed positions for all games
  let allPositions: string[][] = $state([]);

  // Current game's moves (SAN strings)
  let currentMoves = $derived(
    games.length > 0 ? games[currentGameIndex]?.moves.map((m) => m.san) ?? [] : []
  );

  // Current FEN
  let currentFen = $derived(
    allPositions[currentGameIndex]?.[currentMoveIndex + 1] ?? ''
  );

  // Current game metadata
  let currentGame = $derived(games[currentGameIndex] ?? null);

  // Speed ramps up: starts at 600ms, gets faster each game, minimum 100ms
  let intervalMs = $derived(Math.max(100, 600 - currentGameIndex * 40));

  // Progress through all games (0 to 1)
  let totalMoves = $derived(games.reduce((sum, g) => sum + g.moves.length, 0));
  let completedMoves = $derived(() => {
    let count = 0;
    for (let i = 0; i < currentGameIndex; i++) {
      count += games[i].moves.length;
    }
    count += Math.max(0, currentMoveIndex + 1);
    return count;
  });

  // Game count display
  let gameCountText = $derived(
    games.length > 0 ? `Game ${currentGameIndex + 1} / ${games.length}` : ''
  );

  // Current move's gameCount (how many games share this move)
  let currentMoveAnnotation = $derived(
    currentGame && currentMoveIndex >= 0
      ? currentGame.moves[currentMoveIndex] ?? null
      : null
  );

  onMount(async () => {
    const mod = await import('svelte-chess');
    BoardComponent = mod.Chess;

    // Pre-compute all positions for every game
    if (games.length > 0) {
      const positions: string[][] = [];
      for (const game of games) {
        const replay = new ChessEngine();
        const fens: string[] = [replay.fen()];
        for (const move of game.moves) {
          replay.move(move.san);
          fens.push(replay.fen());
        }
        positions.push(fens);
      }
      allPositions = positions;

      // Auto-start after a brief delay
      setTimeout(() => startReplay(), 800);
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
    if (isRunning || games.length === 0) return;
    isRunning = true;
    scheduleNextTick();
  }

  function scheduleNextTick() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(tick, intervalMs);
  }

  function tick() {
    if (!isRunning) return;

    if (currentMoveIndex < currentMoves.length - 1) {
      // Advance within current game
      currentMoveIndex = currentMoveIndex + 1;
      scheduleNextTick();
    } else if (currentGameIndex < games.length - 1) {
      // Move to next game — brief pause then reset
      currentGameIndex = currentGameIndex + 1;
      currentMoveIndex = -1;
      // Slightly longer pause between games
      timer = setTimeout(() => {
        if (isRunning) {
          currentMoveIndex = 0;
          scheduleNextTick();
        }
      }, 400);
    } else {
      // All games done — loop back after a pause
      timer = setTimeout(() => {
        if (isRunning) {
          currentGameIndex = 0;
          currentMoveIndex = -1;
          timer = setTimeout(() => {
            if (isRunning) {
              currentMoveIndex = 0;
              scheduleNextTick();
            }
          }, 600);
        }
      }, 1500);
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

<div class="flex flex-col items-center gap-3">
  <!-- Small board, no controls -->
  <div class="w-64 h-64 sm:w-80 sm:h-80 relative neo-board-frame-sm">
    {#if browser && BoardComponent}
      <BoardComponent bind:this={board} />
    {:else}
      <div class="w-full h-full flex items-center justify-center bg-pink-100 border-[3px] border-black">
        <p class="text-gray-500 text-xs">Loading...</p>
      </div>
    {/if}
  </div>

  <!-- Game counter + move annotation -->
  {#if games.length > 0}
    <div class="text-center space-y-1">
      <p class="text-white/70 text-xs font-mono">{gameCountText}</p>
      {#if currentGame}
        <div class="flex items-center justify-center gap-1.5 text-[0.65rem]">
          <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white text-gray-800 font-semibold border border-black shadow-[1px_1px_0_#000]">&#9812; {nameOf(currentGame.white)}</span>
          <span class="text-white/60">vs</span>
          <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-800 text-white font-semibold border border-black shadow-[1px_1px_0_#000]">&#9818; {nameOf(currentGame.black)}</span>
        </div>
      {/if}
      {#if currentMoveAnnotation}
        <span class="inline-block px-2 py-0.5 rounded-md text-[0.6rem] font-mono
          {currentMoveAnnotation.isNovelty
            ? 'bg-yellow-300 text-gray-900 border border-black'
            : 'bg-white/90 text-gray-700 border border-black'}">
          {figurine(currentMoveAnnotation.san)}
          {#if currentMoveAnnotation.gameCount > 1}
            ({currentMoveAnnotation.gameCount} games)
          {:else if currentMoveAnnotation.isNovelty}
            &#9733; novel
          {/if}
        </span>
      {/if}
    </div>
  {/if}
</div>
