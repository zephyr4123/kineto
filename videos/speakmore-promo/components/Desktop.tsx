import { staticFile } from "remotion";
import { MacDesktop, fromShot, shotLayout } from "../../../engine/speakmore/MacDesktop";
import { assets } from "../assets.gen";
import { SANS } from "../theme";

// 一台 Mac 的桌面（画法在 engine/speakmore/MacDesktop.tsx）：底图是 10-15 的真屏幕截图。
// 程序坞里抠掉了 Typeless 和三个最小化的窗口；真菜单栏有私人的状态图标和真时间，换成画的。

/** 程序坞的外框（截图像素） */
const DOCK = { left: 272, top: 1822, right: 2751, bottom: 1955 };
const H16x9 = shotLayout(1920, 1080);
const [SM_X, SM_Y] = fromShot(H16x9, 2040, 1887);
/** 横版画面里程序坞上 SpeakMore 图标的中心和边长，App 那章从这里把窗口打开 */
export const DOCK_SPEAKMORE = { x: SM_X, y: SM_Y, size: 74 * H16x9.k };

// 菜单栏的时间：周一早上 9:41，口述里"后天的会改到周五"在这一天说得通
const CLOCK = "10月12日 周一  09:41";

/** focus：字幕出来时桌面退后（虚一点、暗一点），0 是原样，1 是退到底；zoom：整块桌面连菜单栏、程序坞一起推近 */
export const Desktop: React.FC<{ focus: number; zoom?: number }> = ({ focus, zoom }) => (
  <MacDesktop src={staticFile(assets.desktop)} dock={DOCK} clock={CLOCK} fontFamily={SANS} focus={focus} zoom={zoom} />
);
