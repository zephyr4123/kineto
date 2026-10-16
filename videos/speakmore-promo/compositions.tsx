import { Composition } from "remotion";
import { staged } from "./components/Stage";
import { VIDEO_FRAMES, Video } from "./Video";
import { COST_CAMERA, COST_FRAMES, Cost } from "./scenes/Cost";
import { HOOK_CAMERA, HOOK_FRAMES, Hook } from "./scenes/Hook";
import { INSTALL_CAMERA, INSTALL_FRAMES, Install } from "./scenes/Install";
import { ONEKEY_CAMERA, ONEKEY_FRAMES, OneKey } from "./scenes/OneKey";
import { ORIGIN_CAMERA, ORIGIN_FRAMES, Origin } from "./scenes/Origin";
import { OUTRO_CAMERA, OUTRO_FRAMES, Outro } from "./scenes/Outro";
import { PRIVACY_CAMERA, PRIVACY_FRAMES, Privacy } from "./scenes/Privacy";
import { USAGE_CAMERA, USAGE_FRAMES, Usage } from "./scenes/Usage";
import { WEB_CAMERA, WEB_FRAMES, Web } from "./scenes/Web";
import { FPS, H, W } from "./theme";

const HookStaged = staged(Hook, HOOK_CAMERA);
const OriginStaged = staged(Origin, ORIGIN_CAMERA);
const UsageStaged = staged(Usage, USAGE_CAMERA);
const OneKeyStaged = staged(OneKey, ONEKEY_CAMERA);
const CostStaged = staged(Cost, COST_CAMERA);
const InstallStaged = staged(Install, INSTALL_CAMERA);
const PrivacyStaged = staged(Privacy, PRIVACY_CAMERA);
const WebStaged = staged(Web, WEB_CAMERA);
const OutroStaged = staged(Outro, OUTRO_CAMERA);

// 成片 + 每个场景各一个 composition，场景可在 Studio 里单独预览
export const Compositions: React.FC = () => {
  return (
    <>
      <Composition id="speakmore-promo" component={Video} durationInFrames={VIDEO_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-hook" component={HookStaged} durationInFrames={HOOK_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-origin" component={OriginStaged} durationInFrames={ORIGIN_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-usage" component={UsageStaged} durationInFrames={USAGE_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-onekey" component={OneKeyStaged} durationInFrames={ONEKEY_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-cost" component={CostStaged} durationInFrames={COST_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-install" component={InstallStaged} durationInFrames={INSTALL_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-privacy" component={PrivacyStaged} durationInFrames={PRIVACY_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-web" component={WebStaged} durationInFrames={WEB_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-outro" component={OutroStaged} durationInFrames={OUTRO_FRAMES} fps={FPS} width={W} height={H} />
    </>
  );
};
