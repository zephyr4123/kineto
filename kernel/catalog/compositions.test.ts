import { test } from "node:test";
import assert from "node:assert/strict";
import { compositionOwner, registersComposition, scanRegistrations } from "./compositions.ts";

const ids = (src: string, file = "compositions.tsx") => scanRegistrations(src, file).map((r) => r.id);

test("compositionOwner 取最长匹配的视频 id：w-x-intro 属于 w-x 而不是 w", () => {
  assert.equal(compositionOwner("w-x-intro", ["w", "w-x"]), "w-x");
  assert.equal(compositionOwner("w-intro", ["w", "w-x"]), "w");
  assert.equal(compositionOwner("w", ["w", "w-x"]), "w");
  assert.equal(compositionOwner("other", ["w"]), undefined);
});

test("按语法树识别：注释里的提及不算，字符串里的 /* 也吞不掉真实登记", () => {
  const src = `import { Composition } from "remotion";
// 每条视频手写自己的 <Composition id="comment-only">
export const C = () => (
  <>
    <Composition id="a" defaultProps={{ frames: "frames/*.png" }} />
    <Composition id="zzz-other" />
    {/* 说明 */}
  </>
);`;
  assert.deepEqual(ids(src), ["a", "zzz-other"]);
  assert.equal(registersComposition("// see <Composition>\nexport const A = 1;", "a.tsx"), false);
});

test("展开属性、非字面量、缺 id 都判为 null 并说明原因；import 别名与命名空间写法都能识别", () => {
  const src = `import { Composition as C, Still } from "remotion";
import * as R from "remotion";
const p = { id: "x" };
export const X = () => (
  <>
    <C {...p} />
    <C id={name} />
    <Still />
    <R.Composition id="ns" />
    <R.Still id='single' />
  </>
);`;
  assert.deepEqual(
    scanRegistrations(src, "compositions.tsx").map((r) => [r.id, r.problem ?? null]),
    [
      [null, "spread"],
      [null, "non-literal"],
      [null, "missing"],
      ["ns", null],
      ["single", null],
    ],
  );
  assert.equal(registersComposition('export const Y = () => <Composition id="z" />;', "Extra.js"), true);
});
