import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outExpo } from "../../../engine/motion";
import { GhosttyApp } from "../components/apps";
import { HOLD, holdRing } from "../components/gesture";
import { MH, toPhone } from "../components/mac";
import { aim, Phone, Touch } from "../components/phone";
import { Hero, HOME } from "../components/stage";
import { UUSnug } from "../components/uu";
import { local, SF } from "../theme";
import { FROM, pos, selection, SEL_LINES, SIZE, TO } from "./Select";

// 长按松开：按住 0.5 秒直接松手，弹出的是 Mac 上这个 App 自己的右键菜单（Ghostty 的，照实机截图），
// 弹在手指的位置，选区不丢。
const at = local(80);
const ITEMS = [
  "Copy",
  "Paste",
  "-",
  "Split Right",
  "Split Left",
  "Split Down",
  "Split Up",
  "-",
  "Close Split",
  "-",
  "Reset Terminal",
  "Toggle Terminal Inspector",
  "Terminal Read-only",
  "-",
  "Change Tab Title…",
  "Change Terminal Title…",
  "-",
  "AutoFill",
  "Services",
];
const ITEM_H = 22;
const MENU_H = ITEMS.reduce((h, it) => h + (it === "-" ? 11 : ITEM_H), 10);

const ContextMenu: React.FC<{ x: number; y: number; p: number; hover: number }> = ({ x, y, p, hover }) => {
  let top = 5;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 228,
        height: MENU_H,
        borderRadius: 11,
        background: "rgba(242,242,244,0.96)",
        boxShadow: "0 12px 34px rgba(0,0,0,0.28), 0 0 0 0.5px rgba(0,0,0,0.18)",
        opacity: p,
        transform: `scale(${0.96 + 0.04 * p})`,
        transformOrigin: "0 0",
        fontFamily: SF,
        fontSize: 13.5,
        color: "#1d1d1f",
      }}
    >
      {ITEMS.map((it, i) => {
        if (it === "-") {
          const el = <div key={i} style={{ position: "absolute", left: 12, right: 12, top: top + 5, height: 1, background: "rgba(0,0,0,0.1)" }} />;
          top += 11;
          return el;
        }
        const el = (
          <div key={i} style={{ position: "absolute", left: 5, right: 5, top, height: ITEM_H, borderRadius: 6, padding: "0 10px", display: "flex", alignItems: "center", background: i === hover ? "#0a64d8" : undefined, color: i === hover ? "#fff" : undefined }}>
            {it}
            {it === "AutoFill" || it === "Services" ? <span style={{ marginLeft: "auto" }}>›</span> : null}
          </div>
        );
        top += ITEM_H;
        return el;
      })}
    </div>
  );
};

export const Menu: React.FC = () => {
  const f = useCurrentFrame();
  const down = at(1);
  const up = down + HOLD + 2;
  const fp = pos(TO.line, TO.col - 1);
  const finger = toPhone(fp.x, fp.y);
  const menu = interpolate(f, [up, up + 8], [0, 1], { ...clamp, easing: outExpo });
  const my = Math.min(fp.y, MH - 28 - MENU_H - 8);
  const show = interpolate(f, [down - 6, down, up, up + 6], [0, 1, 1, 0], clamp);
  const zoom = interpolate(f, [up - 4, up + 18], [0, 1], { ...clamp, easing: inOutQuint });
  const s = HOME.s + 0.55 + 0.1 * zoom;
  // 开头和 Select 收尾的机位一样（对着第 18 行左边），菜单弹出后移到菜单中间
  const y0 = pos(FROM.line, FROM.col).y + 30;
  const focus = toPhone(270 + (fp.x + 80 - 270) * zoom, y0 + (my + MENU_H / 2 - y0) * zoom);
  const pose = aim(focus.x, focus.y, s, 540, HOME.y - 60);
  return (
    <AbsoluteFill>
      <Phone x={pose.x} y={pose.y} scale={s}>
        <UUSnug>
          <GhosttyApp lines={SEL_LINES} size={SIZE} sel={selection(TO.col)}>
            {menu > 0 ? <ContextMenu x={Math.min(fp.x, 540 - 236)} y={my - 62} p={menu} hover={-1} /> : null}
          </GhosttyApp>
        </UUSnug>
        <Touch x={finger.x} y={finger.y} press={1} show={show} ring={holdRing(f, down)} />
      </Phone>
      <Hero at={2} until={at(8) - 6} title="RIGHT CLICK" sub="长按松开 · 右键菜单" />
    </AbsoluteFill>
  );
};
