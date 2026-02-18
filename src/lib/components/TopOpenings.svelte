<script lang="ts">
  import { Chess as ChessEngine } from 'chess.js';
  import { onMount, onDestroy, untrack } from 'svelte';
  import { browser } from '$app/environment';
  import type { DbBranch } from '$lib/db/schema.js';
  import { findPopularLines, formatLine, type OpeningLine } from '$lib/utils/opening-lines.js';
  import { figurine } from '$lib/utils/chess-notation.js';

  let {
    branches = [] as DbBranch[],
    totalGames = 0,
    limit = 4,
  }: {
    branches?: DbBranch[];
    totalGames?: number;
    limit?: number;
  } = $props();

  const MOVE_INTERVAL_MS = 500;
  const END_PAUSE_MS = 1200;
  const START_PAUSE_MS = 600;

  // Board component (dynamically imported for SSR safety)
  let BoardComponent: any = $state(null);
  let boards: any[] = $state([]);

  let lines: OpeningLine[] = $derived(
    branches.length > 0
      ? findPopularLines(branches, totalGames, { limit })
      : [],
  );

  // Pre-computed FEN positions for each line (index 0 = starting pos, index N = after move N-1)
  let allPositions: string[][] = $state([]);

  // Per-board replay state
  let moveIndices: number[] = $state([]);
  let timers: (ReturnType<typeof setTimeout> | null)[] = $state([]);
  let running: boolean[] = $state([]);

  // Current move label for each board
  function currentMoveLabel(lineIndex: number): string {
    const idx = moveIndices[lineIndex] ?? -1;
    if (idx < 0) return 'Starting position';
    const line = lines[lineIndex];
    if (!line) return '';
    const san = line.moves[idx];
    if (!san) return '';
    const ply = idx + 1;
    const num = Math.ceil(ply / 2);
    return ply % 2 === 1 ? `${num}. ${figurine(san)}` : `${num}... ${figurine(san)}`;
  }

  onMount(async () => {
    const mod = await import('svelte-chess');
    BoardComponent = mod.Chess;

    // Pre-compute positions for each line
    if (lines.length > 0) {
      const positions: string[][] = [];
      for (const line of lines) {
        const engine = new ChessEngine();
        const fens: string[] = [engine.fen()];
        for (const san of line.moves) {
          try {
            engine.move(san);
            fens.push(engine.fen());
          } catch {
            break;
          }
        }
        positions.push(fens);
      }
      allPositions = positions;

      // Init per-board state
      moveIndices = lines.map(() => -1);
      timers = lines.map(() => null);
      running = lines.map(() => false);

      // Stagger start so boards don't all move in sync
      for (let i = 0; i < lines.length; i++) {
        setTimeout(() => startReplay(i), START_PAUSE_MS + i * 150);
      }
    }
  });

  // Sync boards when moveIndices change
  $effect(() => {
    const _indices = moveIndices;
    const _boards = boards;
    const _positions = allPositions;
    for (let i = 0; i < _boards.length; i++) {
      const fen = _positions[i]?.[(_indices[i] ?? -1) + 1];
      if (_boards[i] && fen) {
        untrack(() => _boards[i].load(fen));
      }
    }
  });

  function startReplay(i: number) {
    if (running[i] || !lines[i]) return;
    running[i] = true;
    scheduleNext(i);
  }

  function scheduleNext(i: number) {
    if (timers[i]) clearTimeout(timers[i]!);
    timers[i] = setTimeout(() => tick(i), MOVE_INTERVAL_MS);
  }

  function tick(i: number) {
    if (!running[i]) return;
    const line = lines[i];
    if (!line) return;

    if (moveIndices[i] < line.moves.length - 1) {
      moveIndices[i] = moveIndices[i] + 1;
      // Force reactivity by reassigning the array
      moveIndices = [...moveIndices];
      scheduleNext(i);
    } else {
      // End of line — pause, then loop
      timers[i] = setTimeout(() => {
        if (running[i]) {
          moveIndices[i] = -1;
          moveIndices = [...moveIndices];
          timers[i] = setTimeout(() => {
            if (running[i]) {
              moveIndices[i] = 0;
              moveIndices = [...moveIndices];
              scheduleNext(i);
            }
          }, START_PAUSE_MS);
        }
      }, END_PAUSE_MS);
    }
  }

  function stopAll() {
    for (let i = 0; i < timers.length; i++) {
      running[i] = false;
      if (timers[i]) {
        clearTimeout(timers[i]!);
        timers[i] = null;
      }
    }
  }

  onDestroy(() => {
    stopAll();
  });
</script>

{#if lines.length > 0}
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full max-w-3xl mx-auto">
    {#each lines.slice(0, limit) as line, i}
      <div class="bg-white border-[3px] border-black shadow-[4px_4px_0_#be185d] rounded-lg p-3 flex flex-col items-center gap-2">
        <!-- Mini board -->
        <div class="w-full aspect-square neo-board-frame-sm">
          {#if browser && BoardComponent}
            <BoardComponent bind:this={boards[i]} />
          {:else}
            <div class="w-full h-full flex items-center justify-center bg-pink-100 border-[3px] border-black">
              <p class="text-gray-500 text-xs">Loading...</p>
            </div>
          {/if}
        </div>
        <!-- Current move label -->
        <p class="font-mono text-xs sm:text-sm text-gray-900 text-center font-semibold h-5">{currentMoveLabel(i)}</p>
        <!-- Move notation -->
        <p class="font-mono text-[0.6rem] sm:text-xs text-gray-500 text-center leading-relaxed">{formatLine(line.moves)}</p>
        <!-- Game count badge -->
        <span class="text-xs font-mono px-2 py-0.5 rounded-md bg-pink-100 text-pink-700 border border-pink-300">
          {line.gameCount} games ({line.percentage}%)
        </span>
      </div>
    {/each}
  </div>
{/if}
