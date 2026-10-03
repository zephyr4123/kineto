import { test } from "node:test";
import assert from "node:assert/strict";
import { checkSize, generateImage } from "./tokenhub.ts";

const reply = (body: unknown, status = 200) => new Response(typeof body === "string" ? body : JSON.stringify(body), { status });

test("请求按 Hy-Image-3.0 的格式发：Bearer 鉴权、模型、尺寸、种子；返回图片链接与扩写后的提示词", async () => {
  let seen: { url: string; init: RequestInit } | undefined;
  const fetchImpl = (async (url: string, init: RequestInit) => {
    seen = { url, init };
    return reply({ id: "x", data: [{ url: "https://aigc-image.cos.myqcloud.com/r.png", revised_prompt: "扩写" }], request_id: "r1" });
  }) as unknown as typeof fetch;
  const out = await generateImage({ apiKey: "sk-test", prompt: "小猫", size: "1280x720", revise: true, seed: 7 }, fetchImpl);
  assert.deepEqual(out, { url: "https://aigc-image.cos.myqcloud.com/r.png", revisedPrompt: "扩写", requestId: "r1" });
  assert.equal(seen!.url, "https://tokenhub.tencentmaas.com/v1/wand/hunyuan-image/v3-generation");
  assert.equal((seen!.init.headers as Record<string, string>).Authorization, "Bearer sk-test");
  assert.deepEqual(JSON.parse(String(seen!.init.body)), { model: "hy-image-v3", prompt: "小猫", size: "1280x720", revise: true, seed: 7 });
});

test("HTTP 错误按下一步该做什么归类，消息里带服务商原话，不带密钥", async () => {
  const fail = (status: number, body: unknown) =>
    generateImage({ apiKey: "sk-secret", prompt: "p", size: "1024x1024", revise: false }, (async () => reply(body, status)) as unknown as typeof fetch);
  await assert.rejects(fail(401, { error: { message: "invalid api key" } }), (err: Error & { code?: string }) => {
    assert.equal(err.code, "TOOL_AUTH_FAILED");
    assert.match(err.message, /invalid api key/);
    assert.doesNotMatch(err.message, /sk-secret/);
    return true;
  });
  await assert.rejects(fail(403, { error: { message: "quota exhausted" } }), { code: "TOOL_SERVICE_UNAVAILABLE" });
  await assert.rejects(fail(429, "too many requests"), { code: "TOOL_SERVICE_UNAVAILABLE" });
  await assert.rejects(fail(422, { error: { message: "content moderation" } }), { code: "TOOL_FAILED", message: /content moderation/ });
  await assert.rejects(fail(200, { data: [] }), { code: "TOOL_FAILED" });
});

test("尺寸校验：宽高各在 512 到 2048 之间、面积不超过 1024×1024", () => {
  assert.equal(checkSize("1280x720"), "1280x720");
  assert.equal(checkSize("1024x1024"), "1024x1024");
  assert.throws(() => checkSize("1920x1080"), { code: "INVALID_ARGUMENT" });
  assert.throws(() => checkSize("400x400"), { code: "INVALID_ARGUMENT" });
  assert.throws(() => checkSize("1280:720"), { code: "INVALID_ARGUMENT" });
});
