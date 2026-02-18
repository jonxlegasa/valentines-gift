<script lang="ts">
  import { Chess as ChessEngine } from 'chess.js';
  import { onMount, onDestroy, untrack } from 'svelte';
  import { browser } from '$app/environment';
  import type { DbGame, DbNovelty, DbBranch } from '$lib/db/schema.js';
  import { nameOf } from '$lib/utils/personalize.js';
  import { figurine } from '$lib/utils/chess-notation.js';

  let {
    pgn = '',
    games = [] as DbGame[],
    novelties = [] as DbNovelty[],
    branches = [] as DbBranch[],
  }: {
    pgn?: string;
    games?: DbGame[];
    novelties?: DbNovelty[];
    branches?: DbBranch[];
  } = $props();

  // Which game is selected (index into games array)
  let selectedGameIndex: number = $state(0);

  // Auto-play state
  let isPlaying: boolean = $state(false);
  let playTimer: ReturnType<typeof setInterval> | null = $state(null);

  // Board component (dynamically imported for SSR safety)
  let BoardComponent: any = $state(null);
  let board: any = $state(null);

  // Game state
  let moves: string[] = $state([]);
  let positions: string[] = $state([]);
  let currentMoveIndex: number = $state(-1);
  let errorMessage: string = $state('');
  let headers: Record<string, string> = $state({});

  // Annotated moves from DbGame (null when using raw PGN mode)
  import type { AnnotatedMove } from '$lib/db/schema.js';
  let currentAnnotatedMoves: AnnotatedMove[] = $state([]);

  // The currently selected game (when using games[] mode)
  let currentGame = $derived(games.length > 0 ? games[selectedGameIndex] : null);

  // Games sorted by date (newest first) for the dropdown
  let sortedGameIndices = $derived(
    games.length > 0
      ? [...games.keys()].sort((a, b) => games[b].date.localeCompare(games[a].date))
      : []
  );

  // Build a lookup map from ply → branch data for the current game's moves
  let branchAtPly = $derived.by(() => {
    const map = new Map<number, { san: string; gameCount: number }[]>();
    if (currentAnnotatedMoves.length === 0 || branches.length === 0) return map;
    for (const branch of branches) {
      // Find continuations excluding the move our game played at this branch
      const nextPly = branch.ply + 1;
      const ourMove = currentAnnotatedMoves[nextPly - 1]?.san;
      const alts = branch.continuations.filter((c) => c.san !== ourMove);
      if (alts.length > 0) {
        map.set(nextPly, alts);
      }
    }
    return map;
  });

  // Derived values
  let currentFen = $derived(positions[currentMoveIndex + 1] ?? '');
  let atStart = $derived(currentMoveIndex <= -1);
  let atEnd = $derived(currentMoveIndex >= moves.length - 1);
  let moveCounterText = $derived(`${currentMoveIndex + 1} / ${moves.length}`);

  // Dynamic import of svelte-chess to avoid SSR crash (chessground needs DOM)
  onMount(async () => {
    const mod = await import('svelte-chess');
    BoardComponent = mod.Chess;
  });

  // Load from games[] when selectedGameIndex changes
  $effect(() => {
    const game = currentGame;
    if (game) {
      untrack(() => loadDbGame(game));
    }
  });

  // Parse PGN when it changes (only used when games[] is empty)
  $effect(() => {
    if (pgn && games.length === 0) {
      untrack(() => loadGame(pgn));
    }
  });

  // Sync board position when currentMoveIndex changes
  $effect(() => {
    const fen = currentFen;
    const b = board;
    if (b && fen) {
      untrack(() => b.load(fen));
    }
  });

  function loadDbGame(game: DbGame) {
    try {
      const sanMoves = game.moves.map((m) => m.san);
      currentAnnotatedMoves = game.moves;

      headers = {
        White: game.white,
        Black: game.black,
        Result: game.result,
        Date: game.date,
      };
      moves = sanMoves;

      // Build position array from SAN moves
      const replay = new ChessEngine();
      const fens: string[] = [replay.fen()];
      for (const san of sanMoves) {
        replay.move(san);
        fens.push(replay.fen());
      }
      positions = fens;

      currentMoveIndex = -1;
      errorMessage = '';
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errorMessage = `Failed to load game: ${msg}`;
      moves = [];
      positions = [];
      headers = {};
      currentAnnotatedMoves = [];
    }
  }

  function loadGame(pgnString: string) {
    try {
      const engine = new ChessEngine();
      engine.loadPgn(pgnString);

      headers = engine.header() as Record<string, string>;
      moves = engine.history();

      // Build position array: one FEN per move, starting from initial position
      const replay = new ChessEngine();
      const fens: string[] = [replay.fen()];
      for (const move of moves) {
        replay.move(move);
        fens.push(replay.fen());
      }
      positions = fens;

      currentMoveIndex = -1;
      errorMessage = '';
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errorMessage = `Failed to parse PGN: ${msg}`;
      moves = [];
      positions = [];
      headers = {};
    }
  }

  export function goToMove(index: number) {
    if (index < -1 || index >= moves.length) return;
    stopPlay();
    currentMoveIndex = index;
  }

  export function nextMove() {
    goToMove(currentMoveIndex + 1);
  }

  export function prevMove() {
    goToMove(currentMoveIndex - 1);
  }

  export function goToStart() {
    goToMove(-1);
  }

  export function goToEnd() {
    goToMove(moves.length - 1);
  }

  function stopPlay() {
    if (playTimer) {
      clearInterval(playTimer);
      playTimer = null;
    }
    isPlaying = false;
  }

  function togglePlay() {
    if (isPlaying) {
      stopPlay();
      return;
    }
    // If at the end, restart from beginning
    if (atEnd) {
      currentMoveIndex = -1;
    }
    isPlaying = true;
    playTimer = setInterval(() => {
      if (currentMoveIndex >= moves.length - 1) {
        stopPlay();
        return;
      }
      currentMoveIndex = currentMoveIndex + 1;
    }, 800);
  }

  onDestroy(() => {
    stopPlay();
  });

  function handleKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowRight':
        nextMove();
        event.preventDefault();
        break;
      case 'ArrowLeft':
        prevMove();
        event.preventDefault();
        break;
      case 'Home':
        goToStart();
        event.preventDefault();
        break;
      case 'End':
        goToEnd();
        event.preventDefault();
        break;
      case ' ':
        togglePlay();
        event.preventDefault();
        break;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="w-full max-w-4xl mx-auto px-4 py-4">
  {#if errorMessage}
    <p class="text-rose-300 text-sm mb-2">{errorMessage}</p>
  {/if}

  <!-- Game selector (when multiple games loaded) -->
  {#if games.length > 1}
    <div class="mb-3">
      <select
        class="w-full px-3 py-2 rounded-lg bg-white border-2 border-black shadow-[3px_3px_0_#000] text-gray-900 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-400/50"
        bind:value={selectedGameIndex}
      >
        {#each sortedGameIndices as i}
          {@const game = games[i]}
          <option value={i}>
            {nameOf(game.white)} (White) vs {nameOf(game.black)} (Black) — {game.date} — {game.result}
          </option>
        {/each}
      </select>
    </div>
  {/if}

  <!-- Player indicator: always visible, Valentine-themed -->
  {#if headers.White || headers.Black}
    <div class="flex flex-wrap items-center justify-center gap-3 mb-3">
      <span class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white text-gray-900 text-sm font-bold border-2 border-black shadow-[2px_2px_0_#000] leading-none">
        <span>&#9812;</span>
        <span>{nameOf(headers.White ?? '?')}</span>
        <span class="text-[0.6rem] font-semibold uppercase tracking-widest text-pink-400 leading-none">white</span>
      </span>
      <span class="text-white/80 text-sm font-bold">vs</span>
      <span class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gray-900 text-white text-sm font-bold border-2 border-black shadow-[2px_2px_0_#000] leading-none">
        <span>&#9818;</span>
        <span>{nameOf(headers.Black ?? '?')}</span>
        <span class="text-[0.6rem] font-semibold uppercase tracking-widest text-pink-300 leading-none">black</span>
      </span>
      {#if headers.Date}
        <span class="text-white/60 text-sm">({headers.Date})</span>
      {/if}
      {#if headers.Result}
        <span class="px-2.5 py-0.5 bg-yellow-300 border-2 border-black shadow-[2px_2px_0_#000] rounded-lg text-sm text-gray-900 font-mono font-bold">{headers.Result}</span>
      {/if}
    </div>
  {/if}

  <!-- Board + Move List grid -->
  <div class="grid grid-cols-1 md:grid-cols-[1fr_minmax(200px,280px)] gap-4">
    <!-- Board area -->
    <div class="aspect-square max-w-lg mx-auto w-full neo-board-frame">
      {#if browser && BoardComponent}
        <BoardComponent bind:this={board} />
      {:else}
        <div class="w-full h-full flex items-center justify-center bg-pink-100 border-[3px] border-black">
          <p class="text-gray-500">Loading...</p>
        </div>
      {/if}
    </div>

    <!-- Move list sidebar -->
    <div class="max-h-64 md:max-h-96 overflow-y-auto bg-white border-[3px] border-black shadow-[4px_4px_0_#000] rounded-lg p-3">
      <div class="grid grid-cols-[2.5rem_1fr_1fr] gap-y-0.5 items-center">
        {#each { length: Math.ceil(moves.length / 2) } as _, row}
          {@const whiteIdx = row * 2}
          {@const blackIdx = row * 2 + 1}
          {@const whiteAnn = currentAnnotatedMoves[whiteIdx]}
          {@const blackAnn = currentAnnotatedMoves[blackIdx]}
          <span class="text-gray-400 text-sm font-mono text-right pr-1 tabular-nums">{row + 1}.</span>
          {@const whiteBranch = branchAtPly.get(whiteIdx + 1)}
          {@const blackBranch = branchAtPly.get(blackIdx + 1)}
          <button
            class="text-sm font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors text-left flex items-center gap-1
                   {whiteAnn?.isNovelty
                     ? (whiteIdx === currentMoveIndex
                       ? 'bg-pink-400 text-white border border-black shadow-[2px_2px_0_#000]'
                       : 'text-pink-600 bg-pink-50 border border-pink-300 hover:bg-pink-100')
                     : (whiteIdx === currentMoveIndex
                       ? 'bg-yellow-300 text-gray-900 border border-black shadow-[2px_2px_0_#000]'
                       : 'text-gray-700 hover:bg-gray-100')}"
            onclick={() => goToMove(whiteIdx)}
            title={whiteAnn?.isNovelty
              ? 'First time!'
              : whiteBranch
                ? `Also played: ${whiteBranch.map((b) => `${b.san} (${b.gameCount})`).join(', ')}`
                : ''}
          >
            {#if whiteAnn?.isNovelty}<span class="text-pink-500 text-xs">&#9829;</span>{/if}
            {#if whiteAnn?.isBranchPoint}<span class="text-gray-400 text-xs" title="Branch point">&#8916;</span>{/if}
            <span>{figurine(moves[whiteIdx])}</span>
            {#if whiteAnn && currentAnnotatedMoves.length > 0}
              <span class="text-[0.6rem] opacity-50 ml-auto">{whiteAnn.gameCount}</span>
            {/if}
          </button>
          {#if blackIdx < moves.length}
            <button
              class="text-sm font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors text-left flex items-center gap-1
                     {blackAnn?.isNovelty
                       ? (blackIdx === currentMoveIndex
                         ? 'bg-pink-400 text-white border border-black shadow-[2px_2px_0_#000]'
                         : 'text-pink-600 bg-pink-50 border border-pink-300 hover:bg-pink-100')
                       : (blackIdx === currentMoveIndex
                         ? 'bg-yellow-300 text-gray-900 border border-black shadow-[2px_2px_0_#000]'
                         : 'text-gray-700 hover:bg-gray-100')}"
              onclick={() => goToMove(blackIdx)}
              title={blackAnn?.isNovelty
                ? 'First time!'
                : blackBranch
                  ? `Also played: ${blackBranch.map((b) => `${b.san} (${b.gameCount})`).join(', ')}`
                  : ''}
            >
              {#if blackAnn?.isNovelty}<span class="text-pink-500 text-xs">&#9829;</span>{/if}
              {#if blackAnn?.isBranchPoint}<span class="text-gray-400 text-xs" title="Branch point">&#8916;</span>{/if}
              <span>{figurine(moves[blackIdx])}</span>
              {#if blackAnn && currentAnnotatedMoves.length > 0}
                <span class="text-[0.6rem] opacity-50 ml-auto">{blackAnn.gameCount}</span>
              {/if}
            </button>
          {:else}
            <span></span>
          {/if}
        {/each}
      </div>
    </div>
  </div>

  <!-- Navigation controls -->
  <div class="flex items-center justify-center gap-2 mt-3">
    <button
      class="px-3 py-1.5 rounded-md bg-white border-2 border-black shadow-[2px_2px_0_#000] text-gray-900 hover:shadow-[1px_1px_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      onclick={goToStart}
      disabled={atStart}
      aria-label="Go to start"
    >⏮</button>
    <button
      class="px-3 py-1.5 rounded-md bg-white border-2 border-black shadow-[2px_2px_0_#000] text-gray-900 hover:shadow-[1px_1px_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      onclick={prevMove}
      disabled={atStart}
      aria-label="Previous move"
    >◀</button>
    <span class="text-white/80 text-sm font-mono min-w-[5rem] text-center">{moveCounterText}</span>
    <button
      class="px-4 py-1.5 rounded-lg transition-all
             {isPlaying
               ? 'bg-pink-500 border-2 border-black shadow-[2px_2px_0_#000] text-white'
               : 'bg-yellow-300 border-2 border-black shadow-[3px_3px_0_#000] text-gray-900 hover:shadow-[1px_1px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px]'}
             disabled:opacity-30 disabled:cursor-not-allowed"
      onclick={togglePlay}
      disabled={moves.length === 0}
      aria-label={isPlaying ? 'Pause auto-play' : 'Play all moves'}
    >{isPlaying ? '⏸' : '▶'}</button>
    <button
      class="px-3 py-1.5 rounded-md bg-white border-2 border-black shadow-[2px_2px_0_#000] text-gray-900 hover:shadow-[1px_1px_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      onclick={nextMove}
      disabled={atEnd}
      aria-label="Next move"
    >⏩</button>
    <button
      class="px-3 py-1.5 rounded-md bg-white border-2 border-black shadow-[2px_2px_0_#000] text-gray-900 hover:shadow-[1px_1px_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      onclick={goToEnd}
      disabled={atEnd}
      aria-label="Go to end"
    >⏭</button>
  </div>
</div>
