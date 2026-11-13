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
const [painSmall, painLocked, painCut, reveal, snap, list, anyApp, scroll, select, menu, back, resume, anywhere, restore, outro] = SPANS;
const PainSmallStaged = staged(painSmall.Scene);
const PainLockedStaged = staged(painLocked.Scene);
const PainCutStaged = staged(painCut.Scene);
const RevealStaged = staged(reveal.Scene);
const SnapStaged = staged(snap.Scene);
const ListStaged = staged(list.Scene);
const AnyAppStaged = staged(anyApp.Scene);
const ScrollStaged = staged(scroll.Scene);
const SelectStaged = staged(select.Scene);
const MenuStaged = staged(menu.Scene);
const BackStaged = staged(back.Scene);
const ResumeStaged = staged(resume.Scene);
const AnywhereStaged = staged(anywhere.Scene);
const RestoreStaged = staged(restore.Scene);
const OutroStaged = staged(outro.Scene);

export const Compositions: React.FC = () => {
  return (
    <>
      <Composition id="snug-promo" component={Video} durationInFrames={VIDEO_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="snug-promo-pain-small" component={PainSmallStaged} durationInFrames={painSmall.frames} fps={FPS} width={W} height={H} />
      <Composition id="snug-promo-pain-locked" component={PainLockedStaged} durationInFrames={painLocked.frames} fps={FPS} width={W} height={H} />
      <Composition id="snug-promo-pain-cut" component={PainCutStaged} durationInFrames={painCut.frames} fps={FPS} width={W} height={H} />
      <Composition id="snug-promo-reveal" component={RevealStaged} durationInFrames={reveal.frames} fps={FPS} width={W} height={H} />
      <Composition id="snug-promo-snap" component={SnapStaged} durationInFrames={snap.frames} fps={FPS} width={W} height={H} />
      <Composition id="snug-promo-list" component={ListStaged} durationInFrames={list.frames} fps={FPS} width={W} height={H} />
      <Composition id="snug-promo-any-app" component={AnyAppStaged} durationInFrames={anyApp.frames} fps={FPS} width={W} height={H} />
      <Composition id="snug-promo-scroll" component={ScrollStaged} durationInFrames={scroll.frames} fps={FPS} width={W} height={H} />
      <Composition id="snug-promo-select" component={SelectStaged} durationInFrames={select.frames} fps={FPS} width={W} height={H} />
      <Composition id="snug-promo-menu" component={MenuStaged} durationInFrames={menu.frames} fps={FPS} width={W} height={H} />
      <Composition id="snug-promo-back" component={BackStaged} durationInFrames={back.frames} fps={FPS} width={W} height={H} />
      <Composition id="snug-promo-resume" component={ResumeStaged} durationInFrames={resume.frames} fps={FPS} width={W} height={H} />
      <Composition id="snug-promo-anywhere" component={AnywhereStaged} durationInFrames={anywhere.frames} fps={FPS} width={W} height={H} />
      <Composition id="snug-promo-restore" component={RestoreStaged} durationInFrames={restore.frames} fps={FPS} width={W} height={H} />
      <Composition id="snug-promo-outro" component={OutroStaged} durationInFrames={outro.frames} fps={FPS} width={W} height={H} />
    </>
  );
};
