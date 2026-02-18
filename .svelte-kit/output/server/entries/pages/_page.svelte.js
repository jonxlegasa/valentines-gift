import { m as ssr_context, l as escape_html } from "../../chunks/context.js";
import "clsx";
import { y as ensure_array_like, z as attr_class, F as stringify, x as attr, G as bind_props, J as attr_style } from "../../chunks/index.js";
import { Chess } from "chess.js";
function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
}
const ME = "papi962";
const YOU = "aralys17";
function nameOf(username) {
  if (username.toLowerCase() === ME) return "me";
  if (username.toLowerCase() === YOU) return "you";
  return username;
}
function subjectOf(username) {
  if (username.toLowerCase() === ME) return "I";
  if (username.toLowerCase() === YOU) return "you";
  return username;
}
function ChessPgnViewer($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { pgn = "", games = [], novelties = [], branches = [] } = $$props;
    let selectedGameIndex = 0;
    let isPlaying = false;
    let moves = [];
    let positions = [];
    let currentMoveIndex = -1;
    let headers = {};
    let currentAnnotatedMoves = [];
    games.length > 0 ? games[selectedGameIndex] : null;
    let sortedGameIndices = games.length > 0 ? [...games.keys()].sort((a, b) => games[b].date.localeCompare(games[a].date)) : [];
    let branchAtPly = (() => {
      const map = /* @__PURE__ */ new Map();
      if (currentAnnotatedMoves.length === 0 || branches.length === 0) return map;
      for (const branch of branches) {
        const nextPly = branch.ply + 1;
        const ourMove = currentAnnotatedMoves[nextPly - 1]?.san;
        const alts = branch.continuations.filter((c) => c.san !== ourMove);
        if (alts.length > 0) {
          map.set(nextPly, alts);
        }
      }
      return map;
    })();
    positions[currentMoveIndex + 1] ?? "";
    let atStart = currentMoveIndex <= -1;
    let atEnd = currentMoveIndex >= moves.length - 1;
    let moveCounterText = `${currentMoveIndex + 1} / ${moves.length}`;
    function goToMove(index) {
      if (index < -1 || index >= moves.length) return;
      stopPlay();
      currentMoveIndex = index;
    }
    function nextMove() {
      goToMove(currentMoveIndex + 1);
    }
    function prevMove() {
      goToMove(currentMoveIndex - 1);
    }
    function goToStart() {
      goToMove(-1);
    }
    function goToEnd() {
      goToMove(moves.length - 1);
    }
    function stopPlay() {
      isPlaying = false;
    }
    onDestroy(() => {
      stopPlay();
    });
    $$renderer2.push(`<div class="w-full max-w-4xl mx-auto px-4 py-4">`);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (games.length > 1) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="mb-3">`);
      $$renderer2.select(
        {
          class: "w-full px-3 py-2 rounded-lg bg-white border-2 border-black shadow-[3px_3px_0_#000] text-gray-900 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-400/50",
          value: selectedGameIndex
        },
        ($$renderer3) => {
          $$renderer3.push(`<!--[-->`);
          const each_array = ensure_array_like(sortedGameIndices);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let i = each_array[$$index];
            const game = games[i];
            $$renderer3.option({ value: i }, ($$renderer4) => {
              $$renderer4.push(`${escape_html(nameOf(game.white))} (White) vs ${escape_html(nameOf(game.black))} (Black) — ${escape_html(game.date)} — ${escape_html(game.result)}`);
            });
          }
          $$renderer3.push(`<!--]-->`);
        }
      );
      $$renderer2.push(`</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (headers.White || headers.Black) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="flex flex-wrap items-center justify-center gap-3 mb-3"><span class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white text-gray-900 text-sm font-bold border-2 border-black shadow-[2px_2px_0_#000]"><span class="text-pink-400">♥</span> ♔ ${escape_html(nameOf(headers.White ?? "?"))} <span class="text-[0.6rem] font-semibold uppercase tracking-widest text-pink-400">white</span></span> <span class="text-white/80 text-sm font-bold">vs</span> <span class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gray-900 text-white text-sm font-bold border-2 border-black shadow-[2px_2px_0_#000]"><span class="text-pink-400">♥</span> ♚ ${escape_html(nameOf(headers.Black ?? "?"))} <span class="text-[0.6rem] font-semibold uppercase tracking-widest text-pink-300">black</span></span> `);
      if (headers.Date) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="text-white/60 text-sm">(${escape_html(headers.Date)})</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (headers.Result) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="px-2.5 py-0.5 bg-yellow-300 border-2 border-black shadow-[2px_2px_0_#000] rounded-lg text-sm text-gray-900 font-mono font-bold">${escape_html(headers.Result)}</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="grid grid-cols-1 md:grid-cols-[1fr_minmax(200px,280px)] gap-4"><div class="aspect-square max-w-lg mx-auto w-full neo-board-frame">`);
    {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="w-full h-full flex items-center justify-center bg-pink-100 border-[3px] border-black"><p class="text-gray-500">Loading...</p></div>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="max-h-64 md:max-h-96 overflow-y-auto bg-white border-[3px] border-black shadow-[4px_4px_0_#000] rounded-lg p-3"><div class="grid grid-cols-[2.5rem_1fr_1fr] gap-y-0.5 items-center"><!--[-->`);
    const each_array_1 = ensure_array_like({ length: Math.ceil(moves.length / 2) });
    for (let row = 0, $$length = each_array_1.length; row < $$length; row++) {
      each_array_1[row];
      const whiteIdx = row * 2;
      const blackIdx = row * 2 + 1;
      const whiteAnn = currentAnnotatedMoves[whiteIdx];
      const blackAnn = currentAnnotatedMoves[blackIdx];
      const whiteBranch = branchAtPly.get(whiteIdx + 1);
      const blackBranch = branchAtPly.get(blackIdx + 1);
      $$renderer2.push(`<span class="text-gray-400 text-sm font-mono text-right pr-1 tabular-nums">${escape_html(row + 1)}.</span>  <button${attr_class(`text-sm font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors text-left flex items-center gap-1 ${stringify(whiteAnn?.isNovelty ? whiteIdx === currentMoveIndex ? "bg-pink-400 text-white border border-black shadow-[2px_2px_0_#000]" : "text-pink-600 bg-pink-50 border border-pink-300 hover:bg-pink-100" : whiteIdx === currentMoveIndex ? "bg-yellow-300 text-gray-900 border border-black shadow-[2px_2px_0_#000]" : "text-gray-700 hover:bg-gray-100")}`)}${attr("title", whiteAnn?.isNovelty ? "First time!" : whiteBranch ? `Also played: ${whiteBranch.map((b) => `${b.san} (${b.gameCount})`).join(", ")}` : "")}>`);
      if (whiteAnn?.isNovelty) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="text-pink-500 text-xs">♥</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (whiteAnn?.isBranchPoint) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="text-gray-400 text-xs" title="Branch point">⋔</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <span>${escape_html(moves[whiteIdx])}</span> `);
      if (whiteAnn && currentAnnotatedMoves.length > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="text-[0.6rem] opacity-50 ml-auto">${escape_html(whiteAnn.gameCount)}</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></button> `);
      if (blackIdx < moves.length) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<button${attr_class(`text-sm font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors text-left flex items-center gap-1 ${stringify(blackAnn?.isNovelty ? blackIdx === currentMoveIndex ? "bg-pink-400 text-white border border-black shadow-[2px_2px_0_#000]" : "text-pink-600 bg-pink-50 border border-pink-300 hover:bg-pink-100" : blackIdx === currentMoveIndex ? "bg-yellow-300 text-gray-900 border border-black shadow-[2px_2px_0_#000]" : "text-gray-700 hover:bg-gray-100")}`)}${attr("title", blackAnn?.isNovelty ? "First time!" : blackBranch ? `Also played: ${blackBranch.map((b) => `${b.san} (${b.gameCount})`).join(", ")}` : "")}>`);
        if (blackAnn?.isNovelty) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<span class="text-pink-500 text-xs">♥</span>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (blackAnn?.isBranchPoint) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<span class="text-gray-400 text-xs" title="Branch point">⋔</span>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> <span>${escape_html(moves[blackIdx])}</span> `);
        if (blackAnn && currentAnnotatedMoves.length > 0) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<span class="text-[0.6rem] opacity-50 ml-auto">${escape_html(blackAnn.gameCount)}</span>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></button>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<span></span>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></div></div> <div class="flex items-center justify-center gap-2 mt-3"><button class="px-3 py-1.5 rounded-md bg-white border-2 border-black shadow-[2px_2px_0_#000] text-gray-900 hover:shadow-[1px_1px_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-30 disabled:cursor-not-allowed transition-all"${attr("disabled", atStart, true)} aria-label="Go to start">⏮</button> <button class="px-3 py-1.5 rounded-md bg-white border-2 border-black shadow-[2px_2px_0_#000] text-gray-900 hover:shadow-[1px_1px_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-30 disabled:cursor-not-allowed transition-all"${attr("disabled", atStart, true)} aria-label="Previous move">◀</button> <span class="text-white/80 text-sm font-mono min-w-[5rem] text-center">${escape_html(moveCounterText)}</span> <button${attr_class(`px-4 py-1.5 rounded-lg transition-all ${stringify(isPlaying ? "bg-pink-500 border-2 border-black shadow-[2px_2px_0_#000] text-white" : "bg-yellow-300 border-2 border-black shadow-[3px_3px_0_#000] text-gray-900 hover:shadow-[1px_1px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px]")} disabled:opacity-30 disabled:cursor-not-allowed`)}${attr("disabled", moves.length === 0, true)}${attr("aria-label", isPlaying ? "Pause auto-play" : "Play all moves")}>${escape_html(isPlaying ? "⏸" : "&#9829;▶")}</button> <button class="px-3 py-1.5 rounded-md bg-white border-2 border-black shadow-[2px_2px_0_#000] text-gray-900 hover:shadow-[1px_1px_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-30 disabled:cursor-not-allowed transition-all"${attr("disabled", atEnd, true)} aria-label="Next move">⏩</button> <button class="px-3 py-1.5 rounded-md bg-white border-2 border-black shadow-[2px_2px_0_#000] text-gray-900 hover:shadow-[1px_1px_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-30 disabled:cursor-not-allowed transition-all"${attr("disabled", atEnd, true)} aria-label="Go to end">⏭</button></div></div>`);
    bind_props($$props, { goToMove, nextMove, prevMove, goToStart, goToEnd });
  });
}
function CommonLineReplay($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { games = [], label = "How We Always Begin" } = $$props;
    let commonMoves = [];
    let currentMoveIndex = -1;
    let lineGameCount = commonMoves.length > 0 ? commonMoves[commonMoves.length - 1].gameCount : 0;
    onDestroy(() => {
    });
    if (commonMoves.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="flex flex-col items-center gap-5"><h2 class="text-5xl sm:text-6xl font-bold text-white drop-shadow-md text-center">${escape_html(label)}</h2> <p class="text-lg text-white/80 text-center max-w-md leading-relaxed">We have played this sequence of moves <span class="font-bold text-white">${escape_html(lineGameCount)}</span> times out of ${escape_html(games.length)} games.</p> <div class="w-64 h-64 sm:w-80 sm:h-80 relative neo-board-frame-sm">`);
      {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div class="w-full h-full flex items-center justify-center bg-pink-100 border-[3px] border-black"><p class="text-gray-500 text-xs">Loading...</p></div>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="text-center space-y-1.5">`);
      {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<p class="text-white/40 text-xs font-mono">Starting position</p>`);
      }
      $$renderer2.push(`<!--]--> <p class="text-white/30 text-[0.6rem]">Move ${escape_html(Math.max(0, currentMoveIndex + 1))} of ${escape_html(commonMoves.length)}</p></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function findPopularLines(branches, totalGames, options = {}) {
  const { minGames = 4, maxDepth = 6, limit = 10 } = options;
  const branchByPath = /* @__PURE__ */ new Map();
  for (const branch of branches) {
    branchByPath.set(branch.path.join(" "), branch);
  }
  const lines = [];
  function walk(path, gameCount) {
    const key = path.join(" ");
    const branch = branchByPath.get(key);
    if (!branch || path.length >= maxDepth) {
      if (path.length >= 2) {
        lines.push({
          moves: [...path],
          gameCount,
          percentage: Math.round(gameCount / totalGames * 100)
        });
      }
      return;
    }
    const significantConts = branch.continuations.filter(
      (c) => c.gameCount >= minGames
    );
    if (significantConts.length === 0) {
      if (path.length >= 2) {
        lines.push({
          moves: [...path],
          gameCount,
          percentage: Math.round(gameCount / totalGames * 100)
        });
      }
      return;
    }
    if (significantConts.length === 1) {
      walk([...path, significantConts[0].san], significantConts[0].gameCount);
      return;
    }
    for (const cont of significantConts) {
      walk([...path, cont.san], cont.gameCount);
    }
  }
  walk([], totalGames);
  lines.sort((a, b) => b.gameCount - a.gameCount);
  return lines.slice(0, limit);
}
function formatLine(moves) {
  const parts = [];
  for (let i = 0; i < moves.length; i++) {
    if (i % 2 === 0) {
      parts.push(`${Math.floor(i / 2) + 1}.`);
    }
    parts.push(moves[i]);
  }
  return parts.join(" ");
}
function OpeningExplorer($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { games = [], novelties = [], branches = [] } = $$props;
    let selectedIndex = 0;
    let popularLines = branches.length > 0 ? findPopularLines(branches, games.length) : [];
    function fenForMoves(moves) {
      const engine = new Chess();
      for (const san of moves) {
        try {
          engine.move(san);
        } catch {
          break;
        }
      }
      return engine.fen();
    }
    (() => {
      if (popularLines[selectedIndex]) {
        return fenForMoves(popularLines[selectedIndex].moves);
      }
      if (popularLines.length > 0) {
        return fenForMoves(popularLines[0].moves);
      }
      return new Chess().fen();
    })();
    function noveltyLabel(n) {
      const moveNum = Math.ceil(n.ply / 2);
      const dots = n.ply % 2 === 0 ? "..." : "";
      return `${moveNum}.${dots}${n.san}`;
    }
    function noveltyDetail(n) {
      const who = subjectOf(n.playedBy);
      const alts = n.alternativesAtParent.join(", ");
      return `${who === "I" ? "I" : "You"} played this — ${n.gamesAtParent} games reached this position${alts ? `, others played ${alts}` : ""}`;
    }
    $$renderer2.push(`<div class="w-full max-w-5xl mx-auto px-4"><div class="grid grid-cols-1 md:grid-cols-[1fr_minmax(240px,320px)] gap-6 items-start"><div class="max-h-[70vh] overflow-y-auto space-y-6 pr-2">`);
    if (popularLines.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div><h3 class="text-lg font-bold text-yellow-300 mb-3">Most Played Lines</h3> <div class="space-y-2"><!--[-->`);
      const each_array = ensure_array_like(popularLines);
      for (let i = 0, $$length = each_array.length; i < $$length; i++) {
        let line = each_array[i];
        $$renderer2.push(`<button${attr_class(`w-full text-left px-4 py-3 rounded-lg transition-all cursor-pointer ${stringify(selectedIndex === i ? "bg-yellow-300 border-[3px] border-black shadow-[4px_4px_0_#000] text-gray-900" : "bg-white border-[3px] border-black shadow-[3px_3px_0_#000] hover:shadow-[1px_1px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px]")}`)}><div class="flex items-center justify-between gap-3"><span class="font-mono text-sm text-gray-900">${escape_html(formatLine(line.moves))}</span> <span class="shrink-0 text-xs font-mono px-2 py-0.5 rounded-md bg-pink-200 text-gray-900 border border-black">${escape_html(line.gameCount)} games (${escape_html(line.percentage)}%)</span></div></button>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (novelties.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div><h3 class="text-lg font-bold text-yellow-300 mb-3">Novel Moves</h3> <div class="space-y-2"><!--[-->`);
      const each_array_1 = ensure_array_like(novelties);
      for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
        let novelty = each_array_1[i];
        $$renderer2.push(`<button${attr_class(`w-full text-left px-4 py-3 rounded-lg transition-all cursor-pointer ${stringify("bg-white border-[3px] border-black shadow-[3px_3px_0_#000] hover:shadow-[1px_1px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px]")}`)}><div class="flex items-start gap-3"><span class="text-yellow-500 text-lg mt-0.5">★</span> <div class="min-w-0"><p class="font-mono text-sm text-gray-900 font-bold">${escape_html(noveltyLabel(novelty))}</p> <p class="text-gray-500 text-xs mt-0.5 leading-relaxed">${escape_html(noveltyDetail(novelty))}</p> <p class="text-gray-400 text-xs mt-1">Game ${escape_html(novelty.gameId + 1)}</p></div></div></button>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="sticky top-4"><div class="w-full aspect-square max-w-xs mx-auto neo-board-frame-sm">`);
    {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="w-full h-full flex items-center justify-center bg-pink-100 border-[3px] border-black"><p class="text-gray-500 text-xs">Loading...</p></div>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="text-center mt-3">`);
    if (popularLines[selectedIndex]) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p class="text-white/80 text-sm font-mono">${escape_html(formatLine(popularLines[selectedIndex].moves))}</p> <p class="text-white/60 text-xs mt-1">Played in ${escape_html(popularLines[selectedIndex].gameCount)} of ${escape_html(games.length)} games</p>`);
    } else {
      $$renderer2.push("<!--[!-->");
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></div></div></div>`);
  });
}
function ParallaxHearts($$renderer, $$props) {
  function seededRandom(seed) {
    let s = seed;
    return () => {
      s = s * 16807 % 2147483647;
      return (s - 1) / 2147483646;
    };
  }
  const CANDY_COLORS = [
    "#FF6B9D",
    // Candy Pink
    "#E8334A",
    // Hot Red
    "#C9A0DC",
    // Lavender
    "#FDFD96",
    // Lemon
    "#AAF0D1",
    // Mint
    "#FFFFFF"
    // White
  ];
  const PETAL_COLORS = [
    { main: "#9B111E", light: "#D4364A" },
    // crimson
    { main: "#8B0000", light: "#C42020" },
    // dark red
    { main: "#C41E3A", light: "#E85A70" },
    // rich red
    { main: "#722F37", light: "#A85060" },
    // burgundy
    { main: "#BE123C", light: "#E84868" }
    // deep rose
  ];
  const SHAPES = [
    {
      path: "M20 10c-2-6-10-6-10 1s10 13 10 13 10-6 10-13-8-7-10-1z",
      isPetal: false,
      vein: ""
    },
    {
      path: "M20 4 C28 12 28 28 20 36 C12 28 12 12 20 4Z",
      isPetal: true,
      vein: "M20 8 C22 16 18 24 20 34"
    },
    {
      path: "M20 2 C32 10 34 28 20 38 C6 28 8 10 20 2Z",
      isPetal: true,
      vein: "M20 6 C23 16 17 26 20 36"
    }
  ];
  const LAYERS = [
    {
      speed: 0.05,
      minSize: 20,
      maxSize: 32,
      minOpacity: 0.08,
      maxOpacity: 0.15,
      baseCount: 50,
      blur: 0,
      z: 0,
      strokeWidth: 1.5,
      shadowOffset: 1
    },
    {
      speed: 0.25,
      minSize: 32,
      maxSize: 52,
      minOpacity: 0.12,
      maxOpacity: 0.22,
      baseCount: 30,
      blur: 0,
      z: 1,
      strokeWidth: 2,
      shadowOffset: 2
    },
    {
      speed: 0.8,
      minSize: 56,
      maxSize: 90,
      minOpacity: 0.4,
      maxOpacity: 0.7,
      baseCount: 16,
      blur: 0,
      z: 20,
      strokeWidth: 2.5,
      shadowOffset: 3
    }
  ];
  let { scrollY, sectionIndex, density = 1 } = $$props;
  function generateLayers(sectionIdx, mult) {
    const rng = seededRandom(sectionIdx * 1e3 + 42);
    return LAYERS.map((layer) => {
      const count = Math.round(layer.baseCount * mult);
      const icons = [];
      for (let i = 0; i < count; i++) {
        const shape = SHAPES[Math.floor(rng() * SHAPES.length)];
        let color;
        let gradientLight = "";
        if (shape.isPetal) {
          const pc = PETAL_COLORS[Math.floor(rng() * PETAL_COLORS.length)];
          color = pc.main;
          gradientLight = pc.light;
        } else {
          color = CANDY_COLORS[Math.floor(rng() * CANDY_COLORS.length)];
        }
        icons.push({
          x: rng() * 100,
          y: rng() * 140 - 20,
          rotation: rng() * 360,
          size: layer.minSize + rng() * (layer.maxSize - layer.minSize),
          opacity: layer.minOpacity + rng() * (layer.maxOpacity - layer.minOpacity),
          color,
          gradientLight,
          shapePath: shape.path,
          veinPath: shape.vein,
          isPetal: shape.isPetal
        });
      }
      return {
        speed: layer.speed,
        blur: layer.blur,
        z: layer.z,
        strokeWidth: layer.strokeWidth,
        shadowOffset: layer.shadowOffset,
        icons
      };
    });
  }
  const layers = generateLayers(sectionIndex, density);
  function layerOffset(speed) {
    return scrollY * speed;
  }
  $$renderer.push(`<!--[-->`);
  const each_array = ensure_array_like(layers);
  for (let layerIdx = 0, $$length = each_array.length; layerIdx < $$length; layerIdx++) {
    let layer = each_array[layerIdx];
    $$renderer.push(`<div class="absolute inset-0 pointer-events-none"${attr_style(`z-index: ${stringify(layer.z)}; transform: translateY(${stringify(-layerOffset(layer.speed))}px); will-change: transform;${stringify(layer.blur ? ` filter: blur(${layer.blur}px);` : "")}`)}><!--[-->`);
    const each_array_1 = ensure_array_like(layer.icons);
    for (let iconIdx = 0, $$length2 = each_array_1.length; iconIdx < $$length2; iconIdx++) {
      let icon = each_array_1[iconIdx];
      $$renderer.push(`<svg class="absolute"${attr_style(`left: ${stringify(icon.x)}%; top: ${stringify(icon.y)}%; width: ${stringify(icon.size)}px; height: ${stringify(icon.size)}px; opacity: ${stringify(icon.opacity)}; transform: rotate(${stringify(icon.rotation)}deg); filter: drop-shadow(${stringify(layer.shadowOffset)}px ${stringify(layer.shadowOffset)}px 0 rgba(0,0,0,0.6));`)} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">`);
      if (icon.isPetal) {
        $$renderer.push("<!--[-->");
        $$renderer.push(`<defs><linearGradient${attr("id", `pg-${stringify(sectionIndex)}-${stringify(layerIdx)}-${stringify(iconIdx)}`)} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%"${attr("stop-color", icon.gradientLight)}></stop><stop offset="100%"${attr("stop-color", icon.color)}></stop></linearGradient></defs><path${attr("d", icon.shapePath)}${attr("fill", `url(#pg-${stringify(sectionIndex)}-${stringify(layerIdx)}-${stringify(iconIdx)})`)} stroke="#000"${attr("stroke-width", layer.strokeWidth)} stroke-linejoin="round"></path><path${attr("d", icon.veinPath)} fill="none"${attr("stroke", icon.color)} stroke-width="0.8" opacity="0.5" stroke-linecap="round"></path>`);
      } else {
        $$renderer.push("<!--[!-->");
        $$renderer.push(`<path${attr("d", icon.shapePath)}${attr("fill", icon.color)} stroke="#000"${attr("stroke-width", layer.strokeWidth)} stroke-linejoin="round"></path>`);
      }
      $$renderer.push(`<!--]--></svg>`);
    }
    $$renderer.push(`<!--]--></div>`);
  }
  $$renderer.push(`<!--]-->`);
}
function RapidReplay($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { games = [] } = $$props;
    let currentGameIndex = 0;
    games.length > 0 ? games[currentGameIndex]?.moves.map((m) => m.san) ?? [] : [];
    let currentGame = games[currentGameIndex] ?? null;
    games.reduce((sum, g) => sum + g.moves.length, 0);
    let gameCountText = games.length > 0 ? `Game ${currentGameIndex + 1} / ${games.length}` : "";
    onDestroy(() => {
    });
    $$renderer2.push(`<div class="flex flex-col items-center gap-3"><div class="w-64 h-64 sm:w-80 sm:h-80 relative neo-board-frame-sm">`);
    {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="w-full h-full flex items-center justify-center bg-pink-100 border-[3px] border-black"><p class="text-gray-500 text-xs">Loading...</p></div>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    if (games.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="text-center space-y-1"><p class="text-white/70 text-xs font-mono">${escape_html(gameCountText)}</p> `);
      if (currentGame) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="flex items-center justify-center gap-1.5 text-[0.65rem]"><span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white text-gray-800 font-semibold border border-black shadow-[1px_1px_0_#000]">♔ ${escape_html(nameOf(currentGame.white))}</span> <span class="text-white/60">vs</span> <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-800 text-white font-semibold border border-black shadow-[1px_1px_0_#000]">♚ ${escape_html(nameOf(currentGame.black))}</span></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let scrollY = 0;
    let dbGames = [];
    let dbNovelties = [];
    let dbBranches = [];
    let hasDbData = dbGames.length > 0;
    let firstGame = dbGames.length > 0 ? [dbGames[0]] : [];
    const loveNotes = {
      intro: "I built this little site to hold all our chess games — every move, every blunder, every beautiful checkmate. It's my love letter to us, one square at a time.",
      firstGame: "This is where it started. Our very first game. I didn't know then that every game after would mean so much more.",
      story: "Every great love begins with a single move. Like chess, each moment is a careful choice that brings two hearts closer together.",
      commonLine: "We've developed our own opening language — moves only we play, patterns only we share.",
      moments: "The quiet mornings, the shared laughter, the gentle glances across the board. Every moment is a piece of our story.",
      openingBook: "These are the lines we come back to again and again — our opening book, written together over every game.",
      browseAll: "Every single game we've ever played, right here. Scroll through them whenever you want to remember.",
      forever: "Checkmate. You captured my heart, and I never want it back."
    };
    const samplePgn = `[Event "Casual Game"]
[Site "Berlin GER"]
[Date "1852.??.??"]
[White "Adolf Anderssen"]
[Black "Jean Dufresne"]
[Result "1-0"]

1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.b4 Bxb4 5.c3 Ba5 6.d4 exd4 7.O-O
d3 8.Qb3 Qf6 9.e5 Qg6 10.Re1 Nge7 11.Ba3 b5 12.Qxb5 Rb8 13.Qa4
Bb6 14.Nbd2 Bb7 15.Ne4 Qf5 16.Bxd3 Qh5 17.Nf6+ gxf6 18.exf6
Rg8 19.Rad1 Qxf3 20.Rxe7+ Nxe7 21.Qxd7+ Kxd7 22.Bf5+ Ke8
23.Bd7+ Kf8 24.Bxe7# 1-0`;
    $$renderer2.push(`<div class="h-screen w-full overflow-y-scroll snap-y snap-mandatory"><section class="h-screen w-full snap-start flex items-center justify-center bg-[#db2777] relative overflow-hidden">`);
    ParallaxHearts($$renderer2, { scrollY, sectionIndex: 0, density: 1.8 });
    $$renderer2.push(`<!----> <div class="text-center text-white max-w-2xl px-8 relative z-10"><h2 class="text-6xl font-bold mb-8 drop-shadow-md">What is this?</h2> <p class="text-xl leading-relaxed text-pink-100">I look back at our games frequently. I thought it would be nice to collect our games and look at it together.</p> <div class="mt-6 max-w-md mx-auto"><div class="bg-white border-[3px] border-black shadow-[5px_5px_0_#be185d] rounded-lg p-5"><p class="text-gray-800 text-base leading-relaxed italic">"${escape_html(loveNotes.intro)}"</p></div></div></div></section> <section class="h-screen w-full snap-start flex flex-col items-center justify-center bg-[#db2777] relative overflow-hidden">`);
    ParallaxHearts($$renderer2, { scrollY, sectionIndex: 1, density: 1.5 });
    $$renderer2.push(`<!----> `);
    if (hasDbData) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="relative z-10 w-full max-w-4xl mx-auto px-8 pt-4 pb-2 shrink-0"><h2 class="text-4xl sm:text-5xl font-bold text-white text-center drop-shadow-md">Our Very First Game</h2> <p class="text-pink-100/70 text-center text-sm mt-2">${escape_html(dbGames[0].date)} — where it all began</p> <div class="mt-2 max-w-sm mx-auto"><div class="bg-white border-2 border-black shadow-[3px_3px_0_#be185d] rounded-lg px-4 py-2"><p class="text-gray-800 text-sm leading-relaxed italic">"${escape_html(loveNotes.firstGame)}"</p></div></div></div> <div class="relative z-10 w-full min-h-0 flex-1 overflow-hidden">`);
      ChessPgnViewer($$renderer2, { games: firstGame });
      $$renderer2.push(`<!----></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="text-center text-white max-w-2xl px-8 relative z-10"><h2 class="text-5xl font-bold mb-8 drop-shadow-md">Our Very First Game</h2> <p class="text-xl leading-relaxed text-pink-100">Loading...</p></div>`);
    }
    $$renderer2.push(`<!--]--></section> <section class="h-screen w-full snap-start flex items-center justify-center bg-[#db2777] relative overflow-hidden">`);
    ParallaxHearts($$renderer2, { scrollY, sectionIndex: 2, density: 1.3 });
    $$renderer2.push(`<!----> <div class="text-center text-white max-w-2xl px-8 relative z-10"><h2 class="text-6xl font-bold mb-8 drop-shadow-md"></h2> <p class="text-xl leading-relaxed text-pink-100"></p> <div class="mt-6 max-w-md mx-auto"><div class="bg-white border-[3px] border-black shadow-[5px_5px_0_#be185d] rounded-lg p-5"><p class="text-gray-800 text-base leading-relaxed italic">"${escape_html(loveNotes.story)}"</p></div></div></div></section> <section class="h-screen w-full snap-start flex items-center justify-center bg-[#db2777] relative overflow-hidden">`);
    ParallaxHearts($$renderer2, { scrollY, sectionIndex: 3, density: 1.2 });
    $$renderer2.push(`<!----> <div class="relative z-10 flex flex-col items-center gap-6 text-center text-white">`);
    if (hasDbData) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p class="text-lg tracking-[0.3em] uppercase text-rose-200">A love story in every move</p> <h1 class="text-6xl md:text-8xl font-bold drop-shadow-lg">Chess &amp; Love</h1> `);
      RapidReplay($$renderer2, { games: dbGames });
      $$renderer2.push(`<!----> <p class="text-xl md:text-2xl font-light text-pink-100">${escape_html(dbGames.length)} games. Every move remembered.</p> <div class="mt-4 animate-bounce text-rose-300 text-3xl">▽</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<p class="text-lg tracking-[0.3em] uppercase text-rose-200">A love story in every move</p> <h1 class="text-8xl font-bold drop-shadow-lg">Chess &amp; Love</h1> <p class="text-2xl font-light text-pink-100">Scroll to begin</p> <div class="mt-8 animate-bounce text-rose-300 text-3xl">▽</div>`);
    }
    $$renderer2.push(`<!--]--></div></section> <section class="h-screen w-full snap-start flex items-center justify-center bg-[#db2777] relative overflow-hidden">`);
    ParallaxHearts($$renderer2, { scrollY, sectionIndex: 4, density: 1 });
    $$renderer2.push(`<!----> <div class="text-center text-white max-w-2xl px-8 relative z-10"><h2 class="text-6xl font-bold mb-8 drop-shadow-md">Our Story</h2> <p class="text-xl leading-relaxed text-pink-100">Every great love begins with a single move. Like a game of chess, each moment is a careful choice that brings two hearts closer together.</p> <div class="mt-6 max-w-md mx-auto"><div class="bg-white border-[3px] border-black shadow-[5px_5px_0_#be185d] rounded-lg p-5"><p class="text-gray-800 text-base leading-relaxed italic">"${escape_html(loveNotes.story)}"</p></div></div></div></section> `);
    if (hasDbData && dbBranches.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<section class="h-screen w-full snap-start flex items-center justify-center bg-[#db2777] relative overflow-hidden">`);
      ParallaxHearts($$renderer2, { scrollY, sectionIndex: 5, density: 0.9 });
      $$renderer2.push(`<!----> <div class="relative z-10 flex flex-col items-center gap-6 px-8">`);
      CommonLineReplay($$renderer2, { games: dbGames });
      $$renderer2.push(`<!----> <div class="max-w-sm mx-auto"><div class="bg-white border-2 border-black shadow-[3px_3px_0_#be185d] rounded-lg px-4 py-2"><p class="text-gray-800 text-sm leading-relaxed italic">"${escape_html(loveNotes.commonLine)}"</p></div></div></div></section>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <section class="h-screen w-full snap-start flex items-center justify-center bg-[#db2777] relative overflow-hidden">`);
    ParallaxHearts($$renderer2, { scrollY, sectionIndex: hasDbData ? 6 : 5, density: 0.8 });
    $$renderer2.push(`<!----> <div class="text-center text-white max-w-2xl px-8 relative z-10"><h2 class="text-6xl font-bold mb-8 drop-shadow-md">Cherished Moments</h2> <p class="text-xl leading-relaxed text-pink-100">The quiet mornings, the shared laughter, the gentle glances across the board. Every moment is a piece of our story.</p> <div class="mt-6 max-w-md mx-auto"><div class="bg-white border-[3px] border-black shadow-[5px_5px_0_#be185d] rounded-lg p-5"><p class="text-gray-800 text-base leading-relaxed italic">"${escape_html(loveNotes.moments)}"</p></div></div></div></section> `);
    if (dbBranches.length > 0 || dbNovelties.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<section class="h-screen w-full snap-start flex flex-col bg-[#db2777] relative overflow-hidden">`);
      ParallaxHearts($$renderer2, { scrollY, sectionIndex: hasDbData ? 7 : 6, density: 0.7 });
      $$renderer2.push(`<!----> <div class="relative z-10 w-full max-w-2xl mx-auto px-8 pt-10 pb-3 shrink-0"><h2 class="text-5xl sm:text-6xl font-bold text-white text-center drop-shadow-md">Our Opening Book</h2> <p class="text-pink-100/60 text-center text-sm mt-2">The lines we play most and the moves only we have made</p> <div class="mt-2 max-w-sm mx-auto"><div class="bg-white border-2 border-black shadow-[3px_3px_0_#be185d] rounded-lg px-4 py-2"><p class="text-gray-800 text-sm leading-relaxed italic">"${escape_html(loveNotes.openingBook)}"</p></div></div></div> <div class="relative z-10 w-full pb-6 overflow-hidden min-h-0 flex-1">`);
      OpeningExplorer($$renderer2, { games: dbGames, novelties: dbNovelties, branches: dbBranches });
      $$renderer2.push(`<!----></div></section>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <section class="h-screen w-full snap-start flex flex-col items-center justify-center bg-[#db2777] relative overflow-hidden">`);
    ParallaxHearts($$renderer2, {
      scrollY,
      sectionIndex: (hasDbData ? 1 : 0) + (dbBranches.length > 0 || dbNovelties.length > 0 ? 1 : 0) + 6,
      density: 0.5
    });
    $$renderer2.push(`<!----> <div class="relative z-10 w-full max-w-4xl mx-auto px-8 pt-6 pb-2 shrink-0"><h2 class="text-4xl sm:text-5xl font-bold text-white text-center drop-shadow-md">Want to look through all our games?</h2> <div class="mt-2 max-w-sm mx-auto"><div class="bg-white border-2 border-black shadow-[3px_3px_0_#be185d] rounded-lg px-4 py-2"><p class="text-gray-800 text-sm leading-relaxed italic">"${escape_html(loveNotes.browseAll)}"</p></div></div></div> <div class="relative z-10 w-full min-h-0 flex-1 overflow-hidden">`);
    if (hasDbData) {
      $$renderer2.push("<!--[-->");
      ChessPgnViewer($$renderer2, { games: dbGames, novelties: dbNovelties, branches: dbBranches });
    } else {
      $$renderer2.push("<!--[!-->");
      ChessPgnViewer($$renderer2, { pgn: samplePgn });
    }
    $$renderer2.push(`<!--]--></div></section> <section class="h-screen w-full snap-start flex items-center justify-center bg-[#db2777] relative overflow-hidden">`);
    ParallaxHearts($$renderer2, {
      scrollY,
      sectionIndex: (hasDbData ? 1 : 0) + (dbBranches.length > 0 || dbNovelties.length > 0 ? 1 : 0) + 7,
      density: 0.6
    });
    $$renderer2.push(`<!----> <div class="text-center text-white max-w-2xl px-8 relative z-10"><h2 class="text-6xl font-bold mb-8 drop-shadow-md">Forever Yours</h2> <p class="text-xl leading-relaxed text-pink-100 mb-6">Checkmate. You captured my heart, and I never want it back.</p> <p class="text-4xl">♥</p> <div class="mt-6 max-w-md mx-auto"><div class="bg-white border-[3px] border-black shadow-[5px_5px_0_#be185d] rounded-lg p-5"><p class="text-gray-800 text-base leading-relaxed italic">"${escape_html(loveNotes.forever)}"</p></div></div></div></section></div>`);
  });
}
export {
  _page as default
};
