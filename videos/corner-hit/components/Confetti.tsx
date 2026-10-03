import { random, useCurrentFrame } from "remotion";
import { PALETTE } from "../theme";

const COUNT = 140;
const GRAVITY = 1.1;

// 从 (originX, originY) 向左上方喷射的纸屑；random(seed) 保证每次渲染完全一致
export const Confetti: React.FC<{ originX: number; originY: number }> = ({ originX, originY }) => {
  const frame = useCurrentFrame();

  return (
    <>
      {new Array(COUNT).fill(true).map((_, i) => {
        const angle = Math.PI * (1.05 + 0.4 * random(`angle-${i}`));
        const speed = 18 + 30 * random(`speed-${i}`);
        const x = originX + Math.cos(angle) * speed * frame;
        const y = originY + Math.sin(angle) * speed * frame + 0.5 * GRAVITY * frame * frame;
        const spin = (random(`spin-${i}`) - 0.5) * 30 * frame;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 14,
              height: 26,
              borderRadius: 3,
              backgroundColor: PALETTE[i % PALETTE.length],
              rotate: `${spin}deg`,
            }}
          />
        );
      })}
    </>
  );
};
