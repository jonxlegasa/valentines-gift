const browser = false;
let base = "";
let assets = base;
const app_dir = "_app";
const relative = true;
const initial = { base, assets };
function override(paths) {
  base = paths.base;
  assets = paths.assets;
}
function reset() {
  base = initial.base;
  assets = initial.assets;
}
function set_assets(path) {
  assets = initial.assets = path;
}
let prerendering = false;
function set_building() {
}
function set_prerendering() {
  prerendering = true;
}
export {
  assets as a,
  browser as b,
  base as c,
  app_dir as d,
  reset as e,
  set_building as f,
  set_prerendering as g,
  override as o,
  prerendering as p,
  relative as r,
  set_assets as s
};
