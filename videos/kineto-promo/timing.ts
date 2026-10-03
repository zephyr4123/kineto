// 每个场景的时长（60fps 下的帧数）。Video.tsx 与 compositions.tsx 都从这里取，改一处即可。
export const SCENES = {
  prompt: 240,
  chaos: 870,
  cont: 270,
  speedrun: 1080,
  logo: 450,
  github: 420,
} as const;

export const TOTAL = Object.values(SCENES).reduce((a, b) => a + b, 0);

// 第一幕与开场共用的地面高度：开场的输入框最后压成这条地平线
export const GROUND_Y = 820;
