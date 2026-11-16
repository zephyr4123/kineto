import type { Pose } from "./devices";
import type { Cam, Shot } from "./stage";

// 版式：三台设备各放哪、多大（世界坐标 = 1080×1920 画面，镜头不推时一比一）。
// 显示器、MacBook 的 x、y 是屏幕中心，w 是屏幕宽；手机的 x、y 是机身中心，w 是机身宽（高 2.13 倍）。
// 每个版式都给字留了一块空处（注释里写了在哪），字放在那里，不压设备。

const off = (p: Pose, dx: number, dy: number): Pose => ({ ...p, x: p.x + dx, y: p.y + dy });
const hide = (p: Pose): Pose => ({ ...p, op: 0 });
export const cam = (x: number, y: number, z: number): Cam => ({ x, y, z });

/**
 * 开场的桌面：显示器在上，MacBook 左下，手机右下。顶上 100–300 是缩小的字标（之后换成「屏幕数量不限」），
 * 每台设备旁边留一块写它是哪块屏：显示器上方 360–440、MacBook 下方 1520–1600、手机左下 1630–1720
 */
export const DESK: Shot = {
  mon: { x: 540, y: 700, w: 860 },
  mac: { x: 300, y: 1290, w: 460 },
  phone: { x: 815, y: 1310, w: 270 },
};

/** 开场之前三台设备都在画外：显示器在右，MacBook 在左，手机在下（顶上是字标，显示器不从那里穿过） */
export const DESK_OUT: Shot = {
  mon: off(DESK.mon, 1150, 0),
  mac: off(DESK.mac, -900, 0),
  phone: off(DESK.phone, 0, 1300),
};

/** 手机居中做主角，两块 Mac 屏缩小排成一行；顶上 150–380 空着 */
export const TOP_ROW: Shot = {
  mon: { x: 290, y: 520, w: 460 },
  mac: { x: 800, y: 530, w: 390 },
  phone: { x: 540, y: 1330, w: 470 },
};

/** 外接屏做主角（新窗口在大屏上出生的那几秒）：手机缩到右下，左下 60–650 × 1150–1800 空着 */
export const MON_HERO: Shot = {
  mon: { x: 540, y: 640, w: 1000 },
  mac: hide({ x: 250, y: 1400, w: 380 }),
  phone: { x: 850, y: 1450, w: 330 },
};

/** 手机放大做主角（Claude 开工）：两块 Mac 屏退到画外；顶上 150–480 空着 */
export const PHONE_MAX: Shot = {
  mon: hide({ x: 300, y: -500, w: 470 }),
  mac: hide({ x: 790, y: -500, w: 400 }),
  phone: { x: 540, y: 1210, w: 660 },
};

/** 读回复：手机偏右、侧过来一点；顶上 150–470 空着 */
export const READ: Shot = {
  mon: hide({ x: 300, y: -500, w: 470 }),
  mac: hide({ x: 790, y: -500, w: 400 }),
  phone: { x: 660, y: 1150, w: 620, ry: -10, rx: 3 },
};

/** 两屏联动：显示器在上、MacBook 在中，手机缩到右下；左下 70–740 × 1380–1800 空着 */
export const DUAL: Shot = {
  mon: { x: 470, y: 470, w: 840 },
  mac: { x: 410, y: 1070, w: 680 },
  phone: { x: 905, y: 1560, w: 290 },
};

/** 手机居中特写（网页、ChatGPT）：顶上 150–500 空着 */
export const PHONE_CENTER: Shot = {
  mon: hide({ x: 300, y: -500, w: 470 }),
  mac: hide({ x: 790, y: -500, w: 400 }),
  phone: { x: 540, y: 1185, w: 620 },
};

/** MacBook 做主角（还原）：手机在右下，左下 60–640 × 1120–1800 空着 */
export const MAC_HERO: Shot = {
  mon: hide({ x: -500, y: 400, w: 470 }),
  mac: { x: 540, y: 700, w: 940 },
  phone: { x: 830, y: 1460, w: 320 },
};

/** 手机靠左做主角，MacBook 在右上（搜索、冷启动）；右下 640–1040 × 820–1800 空着 */
export const PHONE_LEFT: Shot = {
  mon: hide({ x: 1500, y: 300, w: 470 }),
  mac: { x: 820, y: 560, w: 480 },
  phone: { x: 340, y: 1240, w: 520 },
};

/** 退出：手机在左上、MacBook 在下；右上 560–1040 × 400–1100 空着 */
export const QUIT: Shot = {
  mon: hide({ x: -500, y: 400, w: 470 }),
  mac: { x: 610, y: 1480, w: 800 },
  phone: { x: 290, y: 860, w: 400 },
};

/** 机型列表：手机居中偏下、侧过来；顶上 150–600 空着 */
export const MODEL: Shot = {
  mon: hide({ x: 300, y: -500, w: 470 }),
  mac: hide({ x: 790, y: -500, w: 400 }),
  phone: { x: 540, y: 1240, w: 580, ry: 12, rx: 2 },
};

/** 落版：桌面缩小放在下半，上半留给 slogan 和 GitHub 卡片 */
export const OUTRO: Shot = {
  mon: { x: 540, y: 1400, w: 520 },
  mac: { x: 300, y: 1690, w: 300 },
  phone: { x: 790, y: 1650, w: 190 },
};

export const withCam = (s: Shot, c: Cam): Shot => ({ ...s, cam: c });
export const tilt = (s: Shot, ry: number, rx = 0): Shot => ({ ...s, phone: { ...s.phone, ry, rx } });
