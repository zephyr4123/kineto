import type { Pose } from "./devices";
import type { Cam, Shot } from "./stage";

// 版式：三台设备各放哪、多大（世界坐标 = 1080×1920 画面，镜头不推时一比一）。
// 显示器、MacBook 的 x、y 是屏幕中心，w 是屏幕宽；手机的 x、y 是机身中心，w 是机身宽（高约 2.13 倍）。
// 画面顶上 150–380 留给字幕（镜头不推时），设备都排在这条带子下面；需要字幕贴着设备时，用竖排两行的字幕放在设备旁的空处。

const off = (p: Pose, dx: number, dy: number): Pose => ({ ...p, x: p.x + dx, y: p.y + dy });
export const cam = (x: number, y: number, z: number): Cam => ({ x, y, z });

/** 开场的桌面：显示器在上，MacBook 左下，手机右下 */
export const DESK: Shot = {
  mon: { x: 540, y: 650, w: 900 },
  mac: { x: 300, y: 1320, w: 500 },
  phone: { x: 795, y: 1370, w: 330 },
};

/** 开场之前三台设备都在画外：显示器在上，MacBook 在左，手机在下 */
export const DESK_OUT: Shot = {
  mon: off(DESK.mon, 0, -1100),
  mac: off(DESK.mac, -900, 0),
  phone: off(DESK.phone, 0, 1300),
};

/** 手机居中做主角，两块 Mac 屏缩小排在字幕带下面一行 */
export const TOP_ROW: Shot = {
  mon: { x: 290, y: 545, w: 450 },
  mac: { x: 800, y: 555, w: 380 },
  phone: { x: 540, y: 1340, w: 480 },
};

/** 外接屏做主角（新窗口在大屏上出生的那几秒）：显示器放大占满上半，手机缩到右下，左下留给竖排字幕 */
export const MON_HERO: Shot = {
  mon: { x: 540, y: 600, w: 1000 },
  mac: { x: 250, y: 1360, w: 380, op: 0 },
  phone: { x: 840, y: 1430, w: 340 },
};

/** 手机放大做主角（Claude 开工、读回复）：两块 Mac 屏退到画外 */
export const PHONE_MAX: Shot = {
  mon: { x: 300, y: -500, w: 470, op: 0 },
  mac: { x: 790, y: -500, w: 400, op: 0 },
  phone: { x: 540, y: 1180, w: 680 },
};

/** 两屏联动：显示器在上、MacBook 在中，手机缩到右下角，左下留给竖排字幕 */
export const DUAL: Shot = {
  mon: { x: 470, y: 470, w: 840 },
  mac: { x: 430, y: 1065, w: 740 },
  phone: { x: 880, y: 1500, w: 320 },
};

/** MacBook 做主角（还原）：MacBook 放大在上，手机在右下，左下留给竖排字幕 */
export const MAC_HERO: Shot = {
  mon: { x: -500, y: 400, w: 470, op: 0 },
  mac: { x: 540, y: 660, w: 960 },
  phone: { x: 820, y: 1440, w: 350 },
};

/** 手机靠左做主角，MacBook 在右边露出一大半（搜索、冷启动） */
export const PHONE_LEFT: Shot = {
  mon: { x: 1500, y: 300, w: 470, op: 0 },
  mac: { x: 870, y: 640, w: 600 },
  phone: { x: 380, y: 1250, w: 540 },
};

/** 手机居中特写（网页、ChatGPT、机型列表） */
export const PHONE_CENTER: Shot = {
  mon: { x: 300, y: -500, w: 470, op: 0 },
  mac: { x: 790, y: -500, w: 400, op: 0 },
  phone: { x: 540, y: 1150, w: 630 },
};

/** 退出：手机左边、MacBook 右下，右上留给竖排字幕 */
export const QUIT: Shot = {
  mon: { x: -500, y: 400, w: 470, op: 0 },
  mac: { x: 600, y: 1440, w: 820 },
  phone: { x: 290, y: 830, w: 400 },
};

/** 落版：桌面缩小放在下半，上半留给标语 */
export const OUTRO: Shot = {
  mon: { x: 540, y: 1030, w: 680 },
  mac: { x: 330, y: 1540, w: 400 },
  phone: { x: 790, y: 1590, w: 260 },
};

export const withCam = (s: Shot, c: Cam): Shot => ({ ...s, cam: c });
export const tilt = (s: Shot, ry: number, rx = 0): Shot => ({ ...s, phone: { ...s.phone, ry, rx } });
