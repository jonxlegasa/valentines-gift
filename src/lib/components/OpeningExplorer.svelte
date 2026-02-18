<script lang="ts">
  import { Chess as ChessEngine } from 'chess.js';
  import { onMount, untrack } from 'svelte';
  import { browser } from '$app/environment';
  import type { DbGame, DbNovelty, DbBranch } from '$lib/db/schema.js';
  import { subjectOf } from '$lib/utils/personalize.js';
  import { findPopularLines, formatLine, type OpeningLine } from '$lib/utils/opening-lines.js';
  import { figurine } from '$lib/utils/chess-notation.js';

  let {
    games = [] as DbGame[],
    novelties = [] as DbNovelty[],
    branches = [] as DbBranch[],
  }: {
    games?: DbGame[];
    novelties?: DbNovelty[];
    branches?: DbBranch[];
  } = $props();

  // Board component (dynamically imported for SSR safety)
  let BoardComponent: any = $state(null);
  let board: any = $state(null);

  // Selected item tracking
  let selectedType: 'line' | 'novelty' = $state('line');
  let selectedIndex: number = $state(0);

  // Derived data
  let popularLines: OpeningLine[] = $derived(
    branches.length > 0 ? findPopularLines(branches, games.length) : [],
  );

  // Compute FEN for a move sequence
  function fenForMoves(moves: string[]): string {
    const engine = new ChessEngine();
    for (const san of moves) {
      try {
        engine.move(san);
      } catch {
        break;
      }
    }
    return engine.fen();
  }

  // Current FEN based on selection
  let currentFen = $derived.by(() => {
    if (selectedType === 'line' && popularLines[selectedIndex]) {
      return fenForMoves(popularLines[selectedIndex].moves);
    }
    if (selectedType === 'novelty' && novelties[selectedIndex]) {
      return fenForMoves(novelties[selectedIndex].path);
    }
    if (popularLines.length > 0) {
      return fenForMoves(popularLines[0].moves);
    }
    return new ChessEngine().fen();
  });

  // Sync board position
  $effect(() => {
    const fen = currentFen;
    const b = board;
    if (b && fen) {
      untrack(() => b.load(fen));
    }
  });

  onMount(async () => {
    const mod = await import('svelte-chess');
    BoardComponent = mod.Chess;
  });

  function selectLine(index: number) {
    selectedType = 'line';
    selectedIndex = index;
  }

  function selectNovelty(index: number) {
    selectedType = 'novelty';
    selectedIndex = index;
  }

  function noveltyLabel(n: DbNovelty): string {
    const moveNum = Math.ceil(n.ply / 2);
    const dots = n.ply % 2 === 0 ? '...' : '';
    return `${moveNum}.${dots}${figurine(n.san)}`;
  }

  function noveltyDetail(n: DbNovelty): string {
    const who = subjectOf(n.playedBy);
    const alts = n.alternativesAtParent.map(figurine).join(', ');
    return `${who === 'I' ? 'I' : 'You'} played this — ${n.gamesAtParent} games reached this position${alts ? `, others played ${alts}` : ''}`;
  }
</script>

<div class="w-full max-w-5xl mx-auto px-4">
  <div class="grid grid-cols-1 md:grid-cols-[1fr_minmax(240px,320px)] gap-6 items-start">
    <!-- Left: Sequence list + Novelties -->
    <div class="max-h-[70vh] overflow-y-auto space-y-6 pr-2">
      <!-- Popular Opening Lines -->
      {#if popularLines.length > 0}
        <div>
          <h3 class="text-lg font-bold text-yellow-300 mb-3">Most Played Lines</h3>
          <div class="space-y-2">
            {#each popularLines as line, i}
              <button
                class="w-full text-left px-4 py-3 rounded-lg transition-all cursor-pointer
                       {selectedType === 'line' && selectedIndex === i
                         ? 'bg-yellow-300 border-[3px] border-black shadow-[4px_4px_0_#000] text-gray-900'
                         : 'bg-white border-[3px] border-black shadow-[3px_3px_0_#000] hover:shadow-[1px_1px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px]'}"
                onclick={() => selectLine(i)}
              >
                <div class="flex items-center justify-between gap-3">
                  <span class="font-mono text-sm text-gray-900">{formatLine(line.moves)}</span>
                  <span class="shrink-0 text-xs font-mono px-2 py-0.5 rounded-md bg-pink-200 text-gray-900 border border-black">
                    {line.gameCount} games ({line.percentage}%)
                  </span>
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Novelties -->
      {#if novelties.length > 0}
        <div>
          <h3 class="text-lg font-bold text-yellow-300 mb-3">Novel Moves</h3>
          <div class="space-y-2">
            {#each novelties as novelty, i}
              <button
                class="w-full text-left px-4 py-3 rounded-lg transition-all cursor-pointer
                       {selectedType === 'novelty' && selectedIndex === i
                         ? 'bg-yellow-300 border-[3px] border-black shadow-[4px_4px_0_#000] text-gray-900'
                         : 'bg-white border-[3px] border-black shadow-[3px_3px_0_#000] hover:shadow-[1px_1px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px]'}"
                onclick={() => selectNovelty(i)}
              >
                <div class="flex items-start gap-3">
                  <span class="text-yellow-500 text-lg mt-0.5">&#9733;</span>
                  <div class="min-w-0">
                    <p class="font-mono text-sm text-gray-900 font-bold">{noveltyLabel(novelty)}</p>
                    <p class="text-gray-500 text-xs mt-0.5 leading-relaxed">{noveltyDetail(novelty)}</p>
                    <p class="text-gray-400 text-xs mt-1">Game {novelty.gameId + 1}</p>
                  </div>
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Right: Chess board -->
    <div class="sticky top-4">
      <div class="w-full aspect-square max-w-xs mx-auto neo-board-frame-sm">
        {#if browser && BoardComponent}
          <BoardComponent bind:this={board} />
        {:else}
          <div class="w-full h-full flex items-center justify-center bg-pink-100 border-[3px] border-black">
            <p class="text-gray-500 text-xs">Loading...</p>
          </div>
        {/if}
      </div>
      <!-- Caption showing what's selected -->
      <div class="text-center mt-3">
        {#if selectedType === 'line' && popularLines[selectedIndex]}
          <p class="text-white/80 text-sm font-mono">{formatLine(popularLines[selectedIndex].moves)}</p>
          <p class="text-white/60 text-xs mt-1">Played in {popularLines[selectedIndex].gameCount} of {games.length} games</p>
        {:else if selectedType === 'novelty' && novelties[selectedIndex]}
          <p class="text-yellow-300 text-sm font-mono">{noveltyLabel(novelties[selectedIndex])}</p>
          <p class="text-white/60 text-xs mt-1">{noveltyDetail(novelties[selectedIndex])}</p>
        {/if}
      </div>
    </div>
  </div>
</div>
