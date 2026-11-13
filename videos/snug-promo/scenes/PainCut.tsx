import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, outExpo, shake } from "../../../engine/motion";
import { TitleBar } from "../components/mac";
import { Phone } from "../components/phone";
import { DISPLAY_H, DISPLAY_TOP, SW, UUToolbar } from "../components/phone";
import { Hero, Tag } from "../components/stage";
import { CC, SESSION, Terminal, type Line } from "../components/terminal";
import { C, local, MONO, SF, ZH } from "../theme";

// 痛点三：UU远程 自带的终端跑在它自己的 tmux 里，和 Mac 上开着的终端互不相通。
// 上面是 Mac 上进行到一半的 Claude Code，下面是手机上另起的空终端，中间的线断开。
const at = local(16);
const SPIN = ["✢", "✳", "✶", "✻", "✽", "✻", "✶", "✳"];

export const PainCut: React.FC = () => {
  const f = useCurrentFrame();
  const working: Line[] = [
    ...SESSION.slice(16, 21),
    "",
    [
      { t: `${SPIN[Math.floor(f / 6) % SPIN.length]} `, c: CC.orange },
      { t: "Refactoring… ", c: CC.orange },
      { t: `(${Math.floor(133 + f / 60)}s · esc to interrupt)`, c: CC.dim },
    ],
  ];
  const win = interpolate(f, [2, 16], [0, 1], { ...clamp, easing: outExpo });
  const ph = interpolate(f, [at(1.5), at(1.5) + 16], [0, 1], { ...clamp, easing: outExpo });
  const line = interpolate(f, [at(3), at(4)], [0, 1], { ...clamp, easing: outExpo });
  const cut = interpolate(f, [at(5), at(5) + 10], [0, 1], { ...clamp, easing: outExpo });
  const sh = shake(f, at(5), 12, 9, "cut");
  const blink = Math.floor(f / 18) % 2 === 0;
  return (
    <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px)` }}>
      {/* Mac 上的 Ghostty */}
      <div style={{ position: "absolute", left: 90, top: 600, opacity: win, transform: `translateY(${(1 - win) * 70}px)` }}>
        <div style={{ fontFamily: SF, fontSize: 34, fontWeight: 600, color: C.ink2, marginBottom: 16, marginLeft: 6 }}>Mac · Ghostty</div>
        <div style={{ position: "relative", width: 900, height: 400, borderRadius: 16, overflow: "hidden", boxShadow: "0 30px 80px rgba(20,40,90,0.25), 0 0 0 1px rgba(20,40,90,0.08)" }}>
          <div style={{ position: "absolute", inset: 0, transform: "scale(1.5)", transformOrigin: "0 0", width: 600, height: 267 }}>
            <TitleBar title="✳ 项目目录结构" top={0} width={600} folder={false} />
            <div style={{ position: "absolute", top: 33, left: 0, width: 600, height: 234 }}>
              <Terminal lines={working} size={13} />
            </div>
          </div>
        </div>
      </div>
      {/* 中间的连线，断开 */}
      <svg style={{ position: "absolute", left: 0, top: 0 }} width={1080} height={1920}>
        <path
          d="M 560 1030 C 560 1110, 700 1130, 700 1210"
          fill="none"
          stroke={cut > 0 ? C.red : C.blue}
          strokeWidth="5"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={`${line} 1`}
          opacity={0.9}
        />
      </svg>
      {cut > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 630 - 44,
            top: 1120 - 44,
            width: 88,
            height: 88,
            borderRadius: 44,
            background: C.red,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${0.3 + 0.7 * cut})`,
            boxShadow: "0 0 40px rgba(255,90,95,0.6)",
          }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40">
            <path d="M10 10l20 20M30 10L10 30" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
          </svg>
        </div>
      ) : null}
      {/* 手机上 UU 自带的终端：另起一个 tmux 会话，什么都没有 */}
      <div style={{ opacity: ph, transform: `translateY(${(1 - ph) * 120}px)` }}>
        <div style={{ position: "absolute", left: 110, top: 1500, width: 360, fontFamily: ZH, fontSize: 40, fontWeight: 600, color: C.ink2, lineHeight: 1.5 }}>
          UU远程
          <br />
          自带终端
        </div>
        <Phone x={760} y={1580} scale={0.7}>
          <div style={{ position: "absolute", left: 0, top: DISPLAY_TOP, width: SW, height: DISPLAY_H, background: "#0c0c0c", fontFamily: MONO, fontSize: 15, color: "#e6e6e6", padding: 12, lineHeight: 1.5 }}>
            <div style={{ color: "#8a8a8a" }}>Last login: Fri Nov 13 09:41</div>
            <div>
              ~ % <span style={{ background: blink ? "#e6e6e6" : "transparent" }}>&nbsp;</span>
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 24, background: "#2f9e57", color: "#06140b", fontSize: 14, padding: "2px 10px" }}>[0] 0:zsh*</div>
          </div>
          <UUToolbar />
        </Phone>
      </div>
      <Tag at={0} until={at(8) - 6} text="PROBLEM 03" y={150} />
      <Hero at={2} until={at(8) - 6} title="CUT OFF" sub="另起一个终端 手头的工作接不上" />
    </AbsoluteFill>
  );
};
