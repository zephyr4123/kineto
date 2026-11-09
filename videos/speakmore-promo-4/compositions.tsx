import { AbsoluteFill, Composition } from "remotion";
import { Grain } from "./components/kit";
import { FPS, H, VIDEO_FRAMES, W } from "./theme";
import { SPANS, Video } from "./Video";

// 成片 + 每张卡各一个 composition（卡片在 Studio 里可单独预览，时长和成片里一样）
const staged = (Scene: React.FC) => {
  const Staged: React.FC = () => (
    <AbsoluteFill>
      <Scene />
      <Grain />
    </AbsoluteFill>
  );
  return Staged;
};
const [views, repo, brand, dictate, translate, lookup, cost, issues, code, thanks, outro] = SPANS;
const ViewsStaged = staged(views.Scene);
const RepoStaged = staged(repo.Scene);
const BrandStaged = staged(brand.Scene);
const DictateStaged = staged(dictate.Scene);
const TranslateStaged = staged(translate.Scene);
const LookupStaged = staged(lookup.Scene);
const CostStaged = staged(cost.Scene);
const IssuesStaged = staged(issues.Scene);
const CodeStaged = staged(code.Scene);
const ThanksStaged = staged(thanks.Scene);
const OutroStaged = staged(outro.Scene);

export const Compositions: React.FC = () => {
  return (
    <>
      <Composition id="speakmore-promo-4" component={Video} durationInFrames={VIDEO_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-4-views" component={ViewsStaged} durationInFrames={views.frames} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-4-repo" component={RepoStaged} durationInFrames={repo.frames} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-4-brand" component={BrandStaged} durationInFrames={brand.frames} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-4-dictate" component={DictateStaged} durationInFrames={dictate.frames} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-4-translate" component={TranslateStaged} durationInFrames={translate.frames} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-4-lookup" component={LookupStaged} durationInFrames={lookup.frames} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-4-cost" component={CostStaged} durationInFrames={cost.frames} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-4-issues" component={IssuesStaged} durationInFrames={issues.frames} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-4-code" component={CodeStaged} durationInFrames={code.frames} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-4-thanks" component={ThanksStaged} durationInFrames={thanks.frames} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-4-outro" component={OutroStaged} durationInFrames={outro.frames} fps={FPS} width={W} height={H} />
    </>
  );
};
