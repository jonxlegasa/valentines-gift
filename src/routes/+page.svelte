<script lang="ts">
  import { onMount } from 'svelte';
  import ChessPgnViewer from '$lib/components/ChessPgnViewer.svelte';
  import OpeningExplorer from '$lib/components/OpeningExplorer.svelte';
  import ParallaxHearts from '$lib/components/ParallaxHearts.svelte';
  import RapidReplay from '$lib/components/RapidReplay.svelte';
  import TopOpenings from '$lib/components/TopOpenings.svelte';
  import type { DbGame, DbNovelty, DbBranch } from '$lib/db/schema.js';
  import type { DbSchema } from '$lib/db/schema.js';
  import { nameOf } from '$lib/utils/personalize.js';
  let scrollY = $state(0);

  // LowDB data — loaded from static/data/db.json
  let dbGames: DbGame[] = $state([]);
  let dbNovelties: DbNovelty[] = $state([]);
  let dbBranches: DbBranch[] = $state([]);
  let hasDbData = $derived(dbGames.length > 0);

  // The very first game (earliest by date — games are roughly chronological, index 0 is earliest)
  let firstGame = $derived(dbGames.length > 0 ? [dbGames[0]] : []);

  // Aggregate game stats
  let stats = $derived.by(() => {
    if (dbGames.length === 0) return null;
    const totalMoves = dbGames.reduce((sum, g) => sum + g.moves.length, 0);
    const lengths = dbGames.map((g) => g.moves.length);
    const longest = dbGames[lengths.indexOf(Math.max(...lengths))];
    const shortest = dbGames[lengths.indexOf(Math.min(...lengths))];

    // Determine the two players from the first game
    const players = [dbGames[0].white, dbGames[0].black].sort();
    const wins: Record<string, number> = { [players[0]]: 0, [players[1]]: 0 };
    let draws = 0;
    for (const g of dbGames) {
      if (g.result === '1-0') wins[g.white] = (wins[g.white] ?? 0) + 1;
      else if (g.result === '0-1') wins[g.black] = (wins[g.black] ?? 0) + 1;
      else draws++;
    }

    // Who's leading?
    const leader = wins[players[0]] > wins[players[1]] ? players[0] : players[1];

    return {
      totalMoves,
      avgMoves: Math.round(totalMoves / dbGames.length),
      longest,
      shortest,
      players,
      wins,
      draws,
      leader,
    };
  });

  onMount(async () => {
    try {
      const res = await fetch('/data/db.json');
      if (res.ok) {
        const data: DbSchema = await res.json();
        dbGames = data.games;
        dbNovelties = data.novelties;
        dbBranches = data.branches;
      }
    } catch {
      // No db.json available — fall back to sample PGN
    }
  });

  function onScroll(e: Event) {
    scrollY = (e.target as HTMLElement).scrollTop;
  }


</script>

<div class="h-svh w-full overflow-y-scroll overflow-x-hidden scroll-smooth bg-[#db2777] space-y-24 sm:space-y-48" onscroll={onScroll}>
  <!-- Section 0: Will you be my Valentine? -->
  <section class="min-h-svh w-full flex items-center justify-center relative">
    <ParallaxHearts {scrollY} sectionIndex={0} density={3.5} />
    <div class="text-center text-white max-w-2xl px-8 relative z-30 flex flex-col items-center gap-6">
      <p class="text-lg tracking-[0.3em] uppercase text-rose-200 animate-pulse">Happy Valentine's Day</p>
      <h1 class="text-4xl sm:text-6xl font-bold drop-shadow-lg leading-tight">Will you be my<br/>Valentine? &#9829;</h1>
      <div class="max-w-md mx-auto">
        <div class="bg-white border-[3px] border-black shadow-[5px_5px_0_#be185d] rounded-lg p-5">
          <p class="text-gray-800 text-base leading-relaxed">I see our games as some of my fondest memories. I thought I'd make you a lil something my love...</p>
        </div>
      </div>
      <div class="mt-2 animate-bounce text-rose-300 text-3xl">&#9661;</div>
    </div>
  </section>

  <!-- Section 1: Chess & Love hero -->
  <section class="min-h-svh w-full flex items-center justify-center relative">
    <ParallaxHearts {scrollY} sectionIndex={1} density={2.0} />
    <div class="relative z-30 flex flex-col items-center gap-6 text-center text-white">
      {#if hasDbData}
        <h2 class="text-6xl md:text-8xl font-bold drop-shadow-lg">Chess & Love</h2>
        <RapidReplay games={dbGames} />
        <div class="max-w-md mx-auto">
          <div class="bg-white border-[3px] border-black shadow-[5px_5px_0_#be185d] rounded-lg p-5">
            <p class="text-gray-800 text-base leading-relaxed">This is our own chess database or as I like to call it our "journal". Here we can see our favorite moves, new moves, & moves we have played many times before.</p>
          </div>
        </div>
        <div class="mt-4 animate-bounce text-rose-300 text-3xl">&#9661;</div>
      {:else}
        <h2 class="text-6xl md:text-8xl font-bold drop-shadow-lg">Chess & Love</h2>
        <div class="mt-8 animate-bounce text-rose-300 text-3xl"></div>
      {/if}
    </div>
  </section>

  <!-- Section 2: Our First Game -->
  <section class="min-h-svh w-full flex flex-col items-center justify-center relative">
    <ParallaxHearts {scrollY} sectionIndex={1} density={1.5} />
    {#if hasDbData}
      <div class="relative z-30 w-full max-w-4xl mx-auto px-8 pt-4 pb-2 shrink-0">
        <h2 class="text-4xl sm:text-5xl font-bold text-white text-center drop-shadow-md">Our Very First Game</h2>
        <p class="text-pink-100/70 text-center text-sm mt-2">{dbGames[0].date} — where it all began</p>
        <div class="max-w-md mx-auto mt-2">
          <div class="bg-white border-[3px] border-black shadow-[5px_5px_0_#be185d] rounded-lg p-5">
            <p class="text-gray-800 text-base leading-relaxed">I remember playing chess with you for the first time at the package room. We were nowhere near as good as we are and as in sync as we are now. Ever since then I am so happy we play together to this day.</p>
          </div>
        </div>
      </div>
      <div class="relative z-30 w-full min-h-0 flex-1 overflow-hidden">
        <ChessPgnViewer games={firstGame} />
      </div>
    {:else}
      <div class="text-center text-white max-w-2xl px-8 relative z-30">
        <h2 class="text-5xl font-bold mb-8 drop-shadow-md">Our Very First Game</h2>
        <p class="text-xl leading-relaxed text-pink-100">Loading...</p>
      </div>
    {/if}
  </section>

  <!-- Section 3: By The Numbers -->
  <section class="min-h-svh w-full flex items-center justify-center relative">
    <ParallaxHearts {scrollY} sectionIndex={2} density={1.3} />
    <div class="text-center text-white max-w-3xl px-8 relative z-30">
      {#if stats}
        <h2 class="text-5xl sm:text-6xl font-bold mb-6 drop-shadow-md">By The Numbers</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div class="bg-white border-[3px] border-black shadow-[4px_4px_0_#be185d] rounded-lg p-4">
            <p class="text-3xl font-bold text-pink-600">{dbGames.length}</p>
            <p class="text-gray-600 text-sm">Games Played</p>
          </div>
          <div class="bg-white border-[3px] border-black shadow-[4px_4px_0_#be185d] rounded-lg p-5">
            <p class="text-3xl font-bold text-pink-600">{stats.totalMoves.toLocaleString()}</p>
            <p class="text-gray-600 text-sm">Total Moves</p>
          </div>
          <div class="bg-white border-[3px] border-black shadow-[4px_4px_0_#be185d] rounded-lg p-4">
            <p class="text-3xl font-bold text-pink-600">{stats.avgMoves}</p>
            <p class="text-gray-600 text-sm">Avg Moves / Game</p>
          </div>
          {#each stats.players as player}
            <div class="bg-white border-[3px] border-black shadow-[4px_4px_0_#be185d] rounded-lg p-4">
              <p class="text-3xl font-bold text-pink-600">{stats.wins[player]}</p>
              <p class="text-gray-600 text-sm">{nameOf(player)} Wins</p>
            </div>
          {/each}
          <div class="bg-white border-[3px] border-black shadow-[4px_4px_0_#be185d] rounded-lg p-4">
            <p class="text-3xl font-bold text-pink-600">{stats.draws}</p>
            <p class="text-gray-600 text-sm">Draws</p>
          </div>
          <div class="bg-white border-[3px] border-black shadow-[4px_4px_0_#be185d] rounded-lg p-4">
            <p class="text-3xl font-bold text-pink-600">{stats.longest.moves.length}</p>
            <p class="text-gray-600 text-sm">Longest Game</p>
          </div>
          <div class="bg-white border-[3px] border-black shadow-[4px_4px_0_#be185d] rounded-lg p-4">
            <p class="text-3xl font-bold text-pink-600">{stats.shortest.moves.length}</p>
            <p class="text-gray-600 text-sm">Shortest Game</p>
          </div>
          <div class="bg-white border-[3px] border-black shadow-[4px_4px_0_#be185d] rounded-lg p-4">
            <p class="text-3xl font-bold text-pink-600">{dbNovelties.length}</p>
            <p class="text-gray-600 text-sm">Unique Moves</p>
          </div>
        </div>
        <div class="mt-4 max-w-sm mx-auto">
          <div class="bg-white border-[3px] border-black shadow-[4px_4px_0_#be185d] rounded-lg px-4 py-3">
            <p class="text-gray-800 text-base leading-relaxed">
              {#if stats.wins[stats.players[0]] === stats.wins[stats.players[1]]}
                We're tied at {stats.wins[stats.players[0]]} each. Perfectly balanced, just like us. &#9829;
              {:else if nameOf(stats.leader) === 'you'}
                Looks like you've been kicking my ass... {stats.wins[stats.leader]} to {stats.wins[stats.leader === stats.players[0] ? stats.players[1] : stats.players[0]]}. But who's counting? &#9829;
              {:else}
                Oh looks like I've been winning... {stats.wins[stats.leader]} to {stats.wins[stats.leader === stats.players[0] ? stats.players[1] : stats.players[0]]}. But every game with you is a win. &#9829;
              {/if}
            </p>
          </div>
        </div>
      {:else}
        <h2 class="text-5xl font-bold mb-8 drop-shadow-md">By The Numbers</h2>
        <p class="text-xl leading-relaxed text-pink-100">Loading...</p>
      {/if}
    </div>
  </section>

  <!-- Section 4: How We Start — top opening lines side by side -->
  {#if hasDbData && dbBranches.length > 0}
    <section class="min-h-svh w-full flex flex-col items-center justify-center relative">
      <ParallaxHearts {scrollY} sectionIndex={3} density={1.1} />
      <div class="relative z-30 w-full max-w-3xl mx-auto px-6 flex flex-col items-center gap-5">
        <h2 class="text-5xl sm:text-6xl font-bold text-white text-center drop-shadow-md">How We Start</h2>
        <TopOpenings branches={dbBranches} totalGames={dbGames.length} limit={4} />
        <div class="max-w-md mx-auto">
          <div class="bg-white border-[3px] border-black shadow-[5px_5px_0_#be185d] rounded-lg p-5">
            <p class="text-gray-800 text-base leading-relaxed">These are some of the frequent moves you and I do together.</p>
          </div>
        </div>
      </div>
    </section>
  {/if}

  <!-- Section 7: Our Opening Book (shows when branches or novelties exist) -->
  {#if dbBranches.length > 0 || dbNovelties.length > 0}
    <section class="min-h-svh w-full flex flex-col relative">
      <ParallaxHearts {scrollY} sectionIndex={8} density={0.7} />
      <div class="relative z-30 w-full max-w-2xl mx-auto px-8 pt-10 pb-3 shrink-0">
        <h2 class="text-5xl sm:text-6xl font-bold text-white text-center drop-shadow-md">Our Opening Book</h2>
        <div class="max-w-md mx-auto mt-2">
          <div class="bg-white border-[3px] border-black shadow-[5px_5px_0_#be185d] rounded-lg p-5">
            <p class="text-gray-800 text-base leading-relaxed">I found a way to compare our games together to look for common patterns & best of all novel moves between us.</p>
          </div>
        </div>
      </div>
      <div class="relative z-30 w-full pb-6 overflow-hidden min-h-0 flex-1">
        <OpeningExplorer games={dbGames} novelties={dbNovelties} branches={dbBranches} />
      </div>
    </section>
  {/if}

  <!-- Section 8: Browse All Games -->
  <section class="min-h-svh w-full flex flex-col items-center justify-center relative">
    <ParallaxHearts {scrollY} sectionIndex={9} density={0.5} />
    <div class="relative z-30 w-full max-w-4xl mx-auto px-8 pt-6 pb-2 shrink-0">
      <h2 class="text-4xl sm:text-5xl font-bold text-white text-center drop-shadow-md">Want to look through all our games?</h2>
      <div class="max-w-md mx-auto mt-2">
      </div>
    </div>
    <div class="relative z-30 w-full min-h-0 flex-1 overflow-hidden">
      {#if hasDbData}
        <ChessPgnViewer games={dbGames} novelties={dbNovelties} branches={dbBranches} />
      {/if}
    </div>
  </section>

  <!-- Section 9: Forever -->
  <section class="min-h-svh w-full flex items-center justify-center relative">
    <ParallaxHearts {scrollY} sectionIndex={10} density={0.6} />
    <div class="text-center text-white max-w-2xl px-8 relative z-30">
      <h2 class="text-6xl font-bold mb-8 drop-shadow-md">Forever Yours</h2>
      <p class="text-4xl mb-6">&#9829;</p>
      <div class="max-w-md mx-auto">
        <div class="bg-white border-[3px] border-black shadow-[5px_5px_0_#be185d] rounded-lg p-5">
          <p class="text-gray-800 text-base leading-relaxed">It means the world to me that you play chess with me. I remember we first talked about playing chess &amp; it lit a fire in me. When we play, I get to peek into how your mind works. When we play, I fall in love with you more &amp; more with each exciting &amp; interesting move you make.</p>
        </div>
      </div>
    </div>
  </section>
</div>
