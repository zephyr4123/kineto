import { Registry } from "./registry.gen";

// 只做装配：每条视频在 videos/<id>/compositions.tsx 里手写自己的 <Composition>，
// 注册表由 `kineto sync` 生成，按视频挂进各自的 <Folder>。
export const RemotionRoot: React.FC = () => {
  return <Registry />;
};
