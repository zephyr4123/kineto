import { Composition } from "remotion";
import { staged } from "./components/Stage";
import { COST_CAMERA, COST_FRAMES, Cost } from "./scenes/Cost";
import { CUSTOM_CAMERA, CUSTOM_FRAMES, Custom } from "./scenes/Custom";
import { DEV_CAMERA, DEV_FRAMES, Dev } from "./scenes/Dev";
import { DOWNLOAD_CAMERA, DOWNLOAD_FRAMES, Download } from "./scenes/Download";
import { HARDWARE_CAMERA, HARDWARE_FRAMES, Hardware } from "./scenes/Hardware";
import { HERO_CAMERA, HERO_FRAMES, Hero } from "./scenes/Hero";
import { LONG_CAMERA, LONG_FRAMES, Long } from "./scenes/Long";
import { MODELS_CAMERA, MODELS_FRAMES, Models } from "./scenes/Models";
import { MODES_CAMERA, MODES_FRAMES, Modes } from "./scenes/Modes";
import { OUTRO_CAMERA, OUTRO_FRAMES, Outro } from "./scenes/Outro";
import { PRIVACY_CAMERA, PRIVACY_FRAMES, Privacy } from "./scenes/Privacy";
import { SPEED_CAMERA, SPEED_FRAMES, Speed } from "./scenes/Speed";
import { SYSTEMS_CAMERA, SYSTEMS_FRAMES, Systems } from "./scenes/Systems";
import { VIDEO_FRAMES, Video } from "./Video";
import { FPS, H, W } from "./theme";

const HeroStaged = staged(Hero, HERO_CAMERA);
const SystemsStaged = staged(Systems, SYSTEMS_CAMERA);
const HardwareStaged = staged(Hardware, HARDWARE_CAMERA);
const SpeedStaged = staged(Speed, SPEED_CAMERA);
const ModesStaged = staged(Modes, MODES_CAMERA);
const ModelsStaged = staged(Models, MODELS_CAMERA);
const CustomStaged = staged(Custom, CUSTOM_CAMERA);
const LongStaged = staged(Long, LONG_CAMERA);
const CostStaged = staged(Cost, COST_CAMERA);
const PrivacyStaged = staged(Privacy, PRIVACY_CAMERA);
const DownloadStaged = staged(Download, DOWNLOAD_CAMERA);
const DevStaged = staged(Dev, DEV_CAMERA);
const OutroStaged = staged(Outro, OUTRO_CAMERA);

// 成片 + 每个场景各一个 composition，场景可在 Studio 里单独预览
export const Compositions: React.FC = () => {
  return (
    <>
      <Composition id="speakmore-promo-2" component={Video} durationInFrames={VIDEO_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-2-hero" component={HeroStaged} durationInFrames={HERO_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-2-systems" component={SystemsStaged} durationInFrames={SYSTEMS_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-2-hardware" component={HardwareStaged} durationInFrames={HARDWARE_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-2-speed" component={SpeedStaged} durationInFrames={SPEED_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-2-modes" component={ModesStaged} durationInFrames={MODES_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-2-models" component={ModelsStaged} durationInFrames={MODELS_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-2-custom" component={CustomStaged} durationInFrames={CUSTOM_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-2-long" component={LongStaged} durationInFrames={LONG_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-2-cost" component={CostStaged} durationInFrames={COST_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-2-privacy" component={PrivacyStaged} durationInFrames={PRIVACY_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-2-download" component={DownloadStaged} durationInFrames={DOWNLOAD_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-2-dev" component={DevStaged} durationInFrames={DEV_FRAMES} fps={FPS} width={W} height={H} />
      <Composition id="speakmore-promo-2-outro" component={OutroStaged} durationInFrames={OUTRO_FRAMES} fps={FPS} width={W} height={H} />
    </>
  );
};
