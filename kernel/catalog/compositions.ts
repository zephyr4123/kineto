// 静态扫描 composition 登记（不执行代码，CI 里没有素材二进制时也能跑）。
// 用 TypeScript 的语法树而不是正则：注释交给词法分析器处理（字符串里的 /* 骗不过它），
// import 别名（Composition as C）与命名空间写法（R.Composition）都能认出；
// 展开属性、非字面量 id 无法静态确定归属，一律报出来——官方 skill 也要求 id 写成字符串字面量。
import { readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { videoDir, type KinetoPaths } from "../paths.ts";

export const COMPOSITIONS_FILE = "compositions.tsx";

const TAGS = new Set(["Composition", "Still"]);

export type RegistrationProblem = "spread" | "non-literal" | "missing";

export interface Registration {
  id: string | null;
  problem?: RegistrationProblem;
}

export function scanRegistrations(source: string, fileName: string): Registration[] {
  // 跟 Remotion 的打包器保持一致：它对 .ts 也按 tsx 解析、对 .js 也开了 JSX，
  // 所以 tsc 不认的 .ts 里的 JSX 照样能打包进 Studio，这里不能按 tsc 的规矩放过
  const kind = /\.(tsx|ts|mts|cts)$/.test(fileName) ? ts.ScriptKind.TSX : ts.ScriptKind.JSX;
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, false, kind);

  const names = new Set(TAGS);
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    if (statement.moduleSpecifier.text !== "remotion") continue;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const el of bindings.elements) {
        if (TAGS.has((el.propertyName ?? el.name).text)) names.add(el.name.text);
      }
    }
  }

  const isRegistrationTag = (tag: ts.JsxTagNameExpression) =>
    ts.isIdentifier(tag) ? names.has(tag.text) : ts.isPropertyAccessExpression(tag) && TAGS.has(tag.name.text);

  const found: Registration[] = [];
  const visit = (node: ts.Node): void => {
    if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) && isRegistrationTag(node.tagName)) {
      found.push(inspect(node.attributes));
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}

function inspect(attributes: ts.JsxAttributes): Registration {
  if (attributes.properties.some(ts.isJsxSpreadAttribute)) return { id: null, problem: "spread" };
  const idAttr = attributes.properties.find(
    (p): p is ts.JsxAttribute => ts.isJsxAttribute(p) && ts.isIdentifier(p.name) && p.name.text === "id",
  );
  if (!idAttr) return { id: null, problem: "missing" };
  if (idAttr.initializer && ts.isStringLiteral(idAttr.initializer)) return { id: idAttr.initializer.text };
  return { id: null, problem: "non-literal" };
}

export const registersComposition = (source: string, fileName: string): boolean =>
  scanRegistrations(source, fileName).length > 0;

// composition id 归属哪条视频：取最长的匹配视频 id。
// 视频 w 与 w-x 同时存在时，w-x-intro 属于 w-x——w 不能注册它，也不能渲染它。
export function compositionOwner(compositionId: string, videoIds: string[]): string | undefined {
  return videoIds
    .filter((v) => compositionId === v || compositionId.startsWith(`${v}-`))
    .sort((a, b) => b.length - a.length)[0];
}

export async function readCompositionIds(paths: KinetoPaths, id: string): Promise<(string | null)[]> {
  const file = path.join(videoDir(paths, id), COMPOSITIONS_FILE);
  return scanRegistrations(await readFile(file, "utf8"), file).map((r) => r.id);
}
