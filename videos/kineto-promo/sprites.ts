import type { Palette } from "./components/Sprite";

// 小物件的像素画。"." 透明，其余字符查对应调色板。

export const HEART = [
  ".RR.RR.",
  "RwRRRRR",
  "RRRRRRR",
  ".RRRRR.",
  "..RRR..",
  "...R...",
] as const;
export const HEART_FULL: Palette = { R: "#ff4f5e", w: "#ffd9dd" };
export const HEART_EMPTY: Palette = { R: "#3b3450", w: "#3b3450" };

export const COIN = [
  "..gggg..",
  ".gyyyyg.",
  "gywyyyyg",
  "gyyGyyyg",
  "gyyGyyyg",
  "gyyyyyyg",
  ".gyyyyg.",
  "..gggg..",
] as const;
export const COIN_GOLD: Palette = { g: "#b86e00", y: "#ffd24a", w: "#fff7c2", G: "#e09a10" };
export const COIN_GRAY: Palette = { g: "#5a5568", y: "#9a94ab", w: "#d8d3e6", G: "#7d778f" };

export const QBLOCK = [
  "bbbbbbbbbbbb",
  "bdyyyyyyyydb",
  "byyywwwwyyyb",
  "byywwyywwyyb",
  "byyyyyywwyyb",
  "byyyyywwyyyb",
  "byyyywwyyyyb",
  "byyyywwyyyyb",
  "byyyyyyyyyyb",
  "byyyywwyyyyb",
  "bdyyyyyyyydb",
  "bbbbbbbbbbbb",
] as const;
export const QBLOCK_SWAMP: Palette = { b: "#211b30", y: "#6b5f8a", w: "#d6cdf0", d: "#211b30" };
export const QBLOCK_GOLD: Palette = { b: "#6b2f08", y: "#f5a524", w: "#fff3e0", d: "#6b2f08" };

export const STAR = [
  ".....y.....",
  ".....y.....",
  "....yyy....",
  "....ywy....",
  "yyyyyyyyyyy",
  ".yyyyyyyyy.",
  "..yyyyyyy..",
  "...yyyyy...",
  "...yy.yy...",
  "..yy...yy..",
  ".y.......y.",
] as const;
export const STAR_GOLD: Palette = { y: "#ffd24a", w: "#ffffff" };

export const PAPER = [
  "..wwww...",
  ".wwgwwww.",
  "wwwwwgww.",
  "wgwwwwwww",
  "wwwwgwwww",
  ".wwwwwwg.",
  "..wwgwww.",
  "...www...",
] as const;
export const PAPER_PAL: Palette = { w: "#ddd8ea", g: "#8e88a6" };

export const SWEAT = [".b.", ".b.", "bbb", "bbw", ".b."] as const;
export const SWEAT_PAL: Palette = { b: "#7fd3ff", w: "#ffffff" };

export const SOCK = [
  "..rrrr",
  "..wwww",
  "..rrrr",
  "..wwww",
  ".rrrrr",
  "rrrrrr",
  "rrrr..",
] as const;
export const SOCK_PAL: Palette = { r: "#a14b6b", w: "#e8d8e0" };

export const CHECK = [
  ".......gg",
  "......ggg",
  "g....ggg.",
  "gg..ggg..",
  "gggggg...",
  ".gggg....",
  "..gg.....",
] as const;
export const CHECK_GREEN: Palette = { g: "#5dffa0" };
export const CHECK_INK: Palette = { g: "#141019" };

export const CROSS = [
  "rr...rr",
  "rrr.rrr",
  ".rrrrr.",
  "..rrr..",
  ".rrrrr.",
  "rrr.rrr",
  "rr...rr",
] as const;
export const CROSS_RED: Palette = { r: "#ff4f5e" };
