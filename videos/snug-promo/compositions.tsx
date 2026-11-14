import { AbsoluteFill, Composition } from "remotion";
import { Backdrop, Grain } from "./components/stage";
import { FPS, H, VIDEO_FRAMES, W } from "./theme";
import { SPANS, Video } from "./Video";

// 成片 + 每个场景各一个 composition（场景在 Studio 里可单独预览，时长和成片里一样，带上全片共用的底）
const staged = (Scene: React.FC) => {
  const Staged: React.FC = () => (
    <AbsoluteFill style={{ background: "#f4f8ff" }}>
      <Backdrop />
      <Scene />
      <Grain />
    </AbsoluteFill>
  );
  return Staged;
};
const [title, portrait, landscape, native, duo, shell, chat, browser, plugin, outro] = SPANS;
const TitleStaged = staged(title.Scene);
const PortraitStaged = staged(portrait.Scene);
const LandscapeStaged = staged(landscape.Scene);
const NativeStaged = staged(native.Scene);
const DuoStaged = staged(duo.Scene);
const ShellStaged = staged(shell.Scene);
const ChatStaged = staged(chat.Scene);
const BrowserStaged = staged(browser.Scene);
const PluginStaged = staged(plugin.Scene);
const OutroStaged = staged(outro.Scene);

export const Compositions: React.FC = () => {
  return (
    <>
      <Composition id="snug-promo" component={Video} durationInFrames={VIDEO_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="snug-promo-title" component={TitleStaged} durationInFrames={title.frames} fps={FPS} width={W} height={H} />
      <Composition id="snug-promo-portrait" component={PortraitStaged} durationInFrames={portrait.frames} fps={FPS} width={W} height={H} />
      <Composition id="snug-promo-landscape" component={LandscapeStaged} durationInFrames={landscape.frames} fps={FPS} width={W} height={H} />
      <Composition id="snug-promo-native" component={NativeStaged} durationInFrames={native.frames} fps={FPS} width={W} height={H} />
      <Composition id="snug-promo-duo" component={DuoStaged} durationInFrames={duo.frames} fps={FPS} width={W} height={H} />
      <Composition id="snug-promo-shell" component={ShellStaged} durationInFrames={shell.frames} fps={FPS} width={W} height={H} />
      <Composition id="snug-promo-chat" component={ChatStaged} durationInFrames={chat.frames} fps={FPS} width={W} height={H} />
      <Composition id="snug-promo-browser" component={BrowserStaged} durationInFrames={browser.frames} fps={FPS} width={W} height={H} />
      <Composition id="snug-promo-plugin" component={PluginStaged} durationInFrames={plugin.frames} fps={FPS} width={W} height={H} />
      <Composition id="snug-promo-outro" component={OutroStaged} durationInFrames={outro.frames} fps={FPS} width={W} height={H} />
    </>
  );
};
