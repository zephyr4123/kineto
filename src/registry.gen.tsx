// 由 `./kineto sync` 生成，勿手改。新增视频请用 `./kineto new`。
import { Folder } from "remotion";
import { Compositions as V_coffee_life } from "../videos/coffee-life/compositions";
import { Compositions as V_corner_hit } from "../videos/corner-hit/compositions";
import { Compositions as V_kineto_promo } from "../videos/kineto-promo/compositions";
import { Compositions as V_speakmore_promo } from "../videos/speakmore-promo/compositions";
import { Compositions as V_speakmore_promo_2 } from "../videos/speakmore-promo-2/compositions";
import { Compositions as V_speakmore_promo_3 } from "../videos/speakmore-promo-3/compositions";

export const Registry: React.FC = () => {
  return (
    <>
      <Folder name="coffee-life">
        <V_coffee_life />
      </Folder>
      <Folder name="corner-hit">
        <V_corner_hit />
      </Folder>
      <Folder name="kineto-promo">
        <V_kineto_promo />
      </Folder>
      <Folder name="speakmore-promo">
        <V_speakmore_promo />
      </Folder>
      <Folder name="speakmore-promo-2">
        <V_speakmore_promo_2 />
      </Folder>
      <Folder name="speakmore-promo-3">
        <V_speakmore_promo_3 />
      </Folder>
    </>
  );
};
