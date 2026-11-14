import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, inOutQuint, outExpo, punch } from "../../../engine/motion";
import { ChatgptApp, GPT_LEN, SAFARI_TILE, SafariApp } from "../components/apps";
import { Flash, Shock, Sweep } from "../components/fx";
import { flick } from "../components/gesture";
import { toPhone } from "../components/mac";
import { Phone, Touch } from "../components/phone";
import { press01, switching, SWITCH, WIN } from "../components/snug";
import { Headline } from "../components/stage";
import { UUSnug } from "../components/uu";
import { local } from "../theme";

// 任意窗口 · 浏览器（第二次砸下）：横条 → 列表 → Safari，起始页上点「个人收藏」里 Snug 仓库的书签，页面载入；
// 单指甩两下，带惯性滑到 README 的对比表；手机侧过来转一圈亮个相。（UU 弹出键盘时整个画面往上推，Safari 的地址栏在最上面会被推出屏幕，
// 照实演就看不到输入的字，所以这一段不打字，写字放在终端和 ChatGPT 两段。）最后手机缩到下一场的位置。
const START = 120;
const at = local(START);
const HOME = { x: 540, y: 1228, s: 1.27 };
export const PLUGIN_PHONE = { x: 540, y: 1590, s: 0.58 };

const TAP = at(3.6);
const LOAD = TAP + 6;
const F1 = at(6.4);
const F2 = at(8.8);
const MAX = 700;

export const Browser: React.FC = () => {
  const f = useCurrentFrame();
  const load = interpolate(f, [LOAD, LOAD + 40], [0, 1], clamp);
  const repo = load >= 0.45;
  const scroll = Math.min(MAX, flick(f, F1, 8, 170) + flick(f, F2, 8, 130));
  const safari = <SafariApp page={repo ? "repo" : "start"} load={load} scroll={scroll} tilePress={press01(f, TAP)} />;
  const sw = switching(f, { prevScreen: <ChatgptApp asked="regex for a semver tag" reveal={GPT_LEN} />, current: WIN.chatgpt, others: [WIN.safari, WIN.ghostty, WIN.shell, WIN.vscode, WIN.claude, WIN.finder], target: WIN.safari });
  const fill = interpolate(f, [SWITCH.ENTER, SWITCH.ENTER + 8], [0, 1], { ...clamp, easing: outExpo });
  const screen = sw ? sw.screen : <div style={{ position: "absolute", inset: 0, opacity: fill, transform: `scale(${0.97 + 0.03 * fill})` }}>{safari}</div>;

  // 镜头：砸下那一拍往前一冲；换窗口时侧过去；甩动时跟着往下沉一点；最后缩到下面给 Mac 让位
  const list = interpolate(f, [0, 10, SWITCH.ENTER, SWITCH.ENTER + 16], [0, 1, 1, 0], { ...clamp, easing: inOutQuint });
  const follow = interpolate(f, [F1 - 10, F1 + 20, at(11), at(12.5)], [0, 1, 1, 0], { ...clamp, easing: inOutQuint });
  // 甩完以后亮相：手机侧过去再转回来，往前推一点
  const show = interpolate(f, [at(11), at(12.5), at(16), at(17.2)], [0, 1, 1, 0], { ...clamp, easing: inOutQuint });
  const swing = Math.sin(((f - at(11)) / (at(17) - at(11))) * Math.PI * 2) * 16 * show;
  const away = interpolate(f, [at(17), at(19.6)], [0, 1], { ...clamp, easing: inOutQuint });
  let s = HOME.s * punch(f, 0, 0.08, 24) * (1 - 0.08 * list) + 0.1 * follow + 0.08 * show;
  s = s + (PLUGIN_PHONE.s - s) * away;
  const x = HOME.x + (PLUGIN_PHONE.x - HOME.x) * away;
  const y = HOME.y + 70 * follow + (PLUGIN_PHONE.y - HOME.y) * away;
  const tile = toPhone(SAFARI_TILE.x, SAFARI_TILE.y);
  const finger = (t: number, from: number, to: number) => ({
    ...toPhone(320, interpolate(f, [t, t + 8], [from, to], clamp)),
    show: interpolate(f, [t - 6, t, t + 8, t + 14], [0, 1, 1, 0], clamp),
  });
  const g1 = finger(F1, 680, 510);
  const g2 = finger(F2, 650, 520);
  return (
    <AbsoluteFill>
      <Phone x={x} y={y} scale={s} tiltY={-14 * list + swing} tiltX={4 * show} glow={0.3 + 0.4 * (1 - away)}>
        <UUSnug>{screen}</UUSnug>
        {sw?.finger ? <Touch x={sw.finger.x} y={sw.finger.y} press={sw.finger.press} show={sw.finger.show} /> : null}
        <Touch x={tile.x} y={tile.y} press={press01(f, TAP)} show={interpolate(f, [TAP - 10, TAP - 2, TAP + 8, TAP + 14], [0, 1, 1, 0], clamp)} />
        <Touch x={g1.x} y={g1.y} press={1} show={g1.show} />
        <Touch x={g2.x} y={g2.y} press={1} show={g2.show} />
      </Phone>
      <Flash at={0} dur={16} max={0.8} />
      <Shock at={0} x={540} y={HOME.y} size={1600} dur={30} />
      <Sweep at={4} />
      <Headline at={2} until={at(17)} y={110} kicker="ANY WINDOW · 03" title="浏览器" sub="Safari · GitHub" />
    </AbsoluteFill>
  );
};
