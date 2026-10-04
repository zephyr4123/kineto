// 全片的「稿子」：章节、每句旁白、每句属于哪个插画场景。画面跟着旁白走：
// 事实已逐句核查（2026-10-04，出处见 sources.md），改字时注意别改丢限定词（「大多」「大约」「通常」）。
// 每句旁白一段音频，时长由 timeline.ts 从音频文件量出来，这里只管内容。

export const CHAPTERS = {
  prologue: { no: "", title: "" },
  origin: { no: "01", title: "产地" },
  fruit: { no: "02", title: "果实" },
  harvest: { no: "03", title: "采摘" },
  drying: { no: "04", title: "晾晒" },
  voyage: { no: "05", title: "远行" },
  roast: { no: "06", title: "烘焙" },
  brew: { no: "07", title: "冲煮" },
  epilogue: { no: "", title: "尾声" },
} as const;
export type ChapterId = keyof typeof CHAPTERS;

// 插画场景：每个场景是一幅会动的插画，跨一句或几句旁白；场景里的动画按这几句旁白的起点卡时间
export const SCENES = ["cup", "climate", "belt", "anatomy", "harvest", "drying", "hulling", "shipping", "roast", "brew", "journey"] as const;
export type SceneId = (typeof SCENES)[number];

export type Line = {
  readonly chapter: ChapterId;
  readonly scene: SceneId;
  readonly text: string;
};

export const LINES: readonly Line[] = [
  { chapter: "prologue", scene: "cup", text: "你手里的这杯咖啡，最早是一颗红色的果子。" },
  { chapter: "origin", scene: "climate", text: "咖啡树怕霜冻，也怕酷热，喜欢温和湿润的地方。" },
  { chapter: "origin", scene: "belt", text: "世界上的咖啡，大多种在南北回归线之间，人们把这一圈叫作「咖啡带」。" },
  { chapter: "fruit", scene: "anatomy", text: "这种果子叫咖啡樱桃。" },
  { chapter: "fruit", scene: "anatomy", text: "剥开果皮和果肉，里面通常是两粒种子，也就是咖啡豆。" },
  { chapter: "harvest", scene: "harvest", text: "同一根枝条上的果子，不会同时成熟。" },
  { chapter: "harvest", scene: "harvest", text: "讲究的庄园，每隔一周多就回到同一棵树前，只摘熟透的那几颗。" },
  { chapter: "drying", scene: "drying", text: "摘下的果子要尽快处理。有的整颗晒干，有的先去掉果肉再晒。" },
  { chapter: "drying", scene: "drying", text: "人们在阳光下不停翻动，直到豆子里的水分只剩百分之十一左右。" },
  { chapter: "voyage", scene: "hulling", text: "脱去外壳，就是淡绿色的生豆。闻起来像青草和干草，还没有一点咖啡香。" },
  { chapter: "voyage", scene: "shipping", text: "它们被装进麻袋，一袋大约六十公斤，大多坐上货轮，去往世界各地。" },
  { chapter: "roast", scene: "roast", text: "真正的变化，发生在烘焙机里。" },
  { chapter: "roast", scene: "roast", text: "生豆在两百度左右的高温里翻滚十来分钟，从绿变黄，再一点点变成褐色。" },
  { chapter: "roast", scene: "roast", text: "烘到一定火候，豆子会噼啪作响，像爆米花一样，烘焙师管这叫「一爆」。" },
  { chapter: "roast", scene: "roast", text: "咖啡里上千种香味物质，大多是在这十来分钟里生成的。" },
  { chapter: "brew", scene: "brew", text: "最后，豆子被磨成粉，热水流过咖啡粉，把这些香气和味道带进杯子。" },
  { chapter: "epilogue", scene: "journey", text: "从枝头到杯中，一颗种子要走上好几个月。" },
  { chapter: "epilogue", scene: "journey", text: "下次端起咖啡的时候，不妨喝慢一点。" },
];
