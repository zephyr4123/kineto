// 由 `./kineto sync` 生成，勿手改。新增视频请用 `./kineto new`。
import { Folder } from "remotion";
import { Compositions as V_corner_hit } from "../videos/corner-hit/compositions";

export const Registry: React.FC = () => {
  return (
    <>
      <Folder name="corner-hit">
        <V_corner_hit />
      </Folder>
    </>
  );
};
