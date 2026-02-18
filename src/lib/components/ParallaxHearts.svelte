<script lang="ts">
  // Seeded PRNG — Park-Miller LCG for deterministic icon positions
  function seededRandom(seed: number) {
    let s = seed;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  // Candy conversation hearts color palette (used for heart shapes)
  const CANDY_COLORS = [
    '#FF6B9D', // Candy Pink
    '#E8334A', // Hot Red
    '#C9A0DC', // Lavender
    '#FDFD96', // Lemon
    '#AAF0D1', // Mint
    '#FFFFFF', // White
  ];

  // Deep red rose petal colors — main fill + lighter edge for gradient
  const PETAL_COLORS = [
    { main: '#9B111E', light: '#D4364A' },  // crimson
    { main: '#8B0000', light: '#C42020' },  // dark red
    { main: '#C41E3A', light: '#E85A70' },  // rich red
    { main: '#722F37', light: '#A85060' },  // burgundy
    { main: '#BE123C', light: '#E84868' },  // deep rose
  ];

  // Shape definitions with SVG paths + vein paths (all in 40×40 viewBox)
  const SHAPES = [
    { path: 'M20 10c-2-6-10-6-10 1s10 13 10 13 10-6 10-13-8-7-10-1z', isPetal: false, vein: '' },
    { path: 'M20 4 C28 12 28 28 20 36 C12 28 12 12 20 4Z', isPetal: true, vein: 'M20 8 C22 16 18 24 20 34' },
    { path: 'M20 2 C32 10 34 28 20 38 C6 28 8 10 20 2Z', isPetal: true, vein: 'M20 6 C23 16 17 26 20 36' },
  ];

  // Layer definitions
  const LAYERS = [
    { speed: 0.05, minSize: 20, maxSize: 32, minOpacity: 0.08, maxOpacity: 0.15, baseCount: 80, blur: 0, z: 0, strokeWidth: 1.5, shadowOffset: 1 },
    { speed: 0.25, minSize: 32, maxSize: 52, minOpacity: 0.12, maxOpacity: 0.22, baseCount: 50, blur: 0, z: 1, strokeWidth: 2, shadowOffset: 2 },
    { speed: 0.8, minSize: 56, maxSize: 90, minOpacity: 0.4, maxOpacity: 0.7, baseCount: 28, blur: 0, z: 20, strokeWidth: 2.5, shadowOffset: 3 },
  ];

  interface FloralIcon {
    x: number;
    y: number;
    rotation: number;
    size: number;
    opacity: number;
    color: string;         // main fill color (or flat fill for hearts)
    gradientLight: string; // lighter gradient stop (petals only)
    shapePath: string;     // SVG path d
    veinPath: string;      // vein line d (empty for hearts)
    isPetal: boolean;
    fallDuration: number;  // seconds for the descending animation
    fallDelay: number;     // negative delay so icons start at different points
  }

  interface LayerData {
    speed: number;
    blur: number;
    z: number;
    strokeWidth: number;
    shadowOffset: number;
    icons: FloralIcon[];
  }

  interface Props {
    scrollY: number;
    sectionIndex: number;
    density?: number;
  }

  let { scrollY, sectionIndex, density = 1.0 }: Props = $props();

  function generateLayers(sectionIdx: number, mult: number): LayerData[] {
    const rng = seededRandom(sectionIdx * 1000 + 42);

    return LAYERS.map((layer) => {
      const count = Math.round(layer.baseCount * mult);
      const icons: FloralIcon[] = [];

      for (let i = 0; i < count; i++) {
        const shape = SHAPES[Math.floor(rng() * SHAPES.length)];
        let color: string;
        let gradientLight = '';

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
          isPetal: shape.isPetal,
          fallDuration: 8 + rng() * 14,
          fallDelay: -(rng() * 20),
        });
      }

      return {
        speed: layer.speed,
        blur: layer.blur,
        z: layer.z,
        strokeWidth: layer.strokeWidth,
        shadowOffset: layer.shadowOffset,
        icons,
      };
    });
  }

  const layers = $derived(generateLayers(sectionIndex, density));

  function layerOffset(speed: number): number {
    return scrollY * speed;
  }
</script>

{#each layers as layer, layerIdx}
  <div
    class="absolute inset-0 pointer-events-none"
    style="z-index: {layer.z}; transform: translateY({-layerOffset(layer.speed)}px); will-change: transform;{layer.blur ? ` filter: blur(${layer.blur}px);` : ''}"
  >
    {#each layer.icons as icon, iconIdx}
      <svg
        class="absolute"
        style="left: {icon.x}%; top: {icon.y}%; width: {icon.size}px; height: {icon.size}px; opacity: {icon.opacity}; transform: rotate({icon.rotation}deg); filter: drop-shadow({layer.shadowOffset}px {layer.shadowOffset}px 0 rgba(0,0,0,0.6)); animation: descend {icon.fallDuration}s linear {icon.fallDelay}s infinite;"
        viewBox="0 0 40 40"
        xmlns="http://www.w3.org/2000/svg"
      >
        {#if icon.isPetal}
          <defs>
            <linearGradient id="pg-{sectionIndex}-{layerIdx}-{iconIdx}" x1="0" y1="0" x2="0.3" y2="1">
              <stop offset="0%" stop-color={icon.gradientLight} />
              <stop offset="100%" stop-color={icon.color} />
            </linearGradient>
          </defs>
          <path d={icon.shapePath} fill="url(#pg-{sectionIndex}-{layerIdx}-{iconIdx})" stroke="#000" stroke-width={layer.strokeWidth} stroke-linejoin="round" />
          <path d={icon.veinPath} fill="none" stroke={icon.color} stroke-width="0.8" opacity="0.5" stroke-linecap="round" />
        {:else}
          <path d={icon.shapePath} fill={icon.color} stroke="#000" stroke-width={layer.strokeWidth} stroke-linejoin="round" />
        {/if}
      </svg>
    {/each}
  </div>
{/each}

<style>
  @keyframes descend {
    from {
      translate: 0 -20%;
    }
    to {
      translate: 0 120%;
    }
  }
</style>
