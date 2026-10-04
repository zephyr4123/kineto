// 由 `./kineto sync` 生成，勿手改。新增视频请用 `./kineto new`。
import { Folder } from "remotion";
import { Compositions as V_coffee_life } from "../videos/coffee-life/compositions";
import { Compositions as V_corner_hit } from "../videos/corner-hit/compositions";
import { Compositions as V_kineto_promo } from "../videos/kineto-promo/compositions";

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
    </>
  );
};
