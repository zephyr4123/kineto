import { test } from "node:test";
import assert from "node:assert/strict";
import { callTencentCloud, signTc3 } from "./tencentcloud.ts";

test("TC3-HMAC-SHA256 签名与腾讯云官方 Python SDK 逐字节一致", () => {
  // 参考值由 tencentcloud-sdk-python 3.1.163 的 _build_req_with_tc3_signature 在固定时间戳下生成
  const headers = signTc3({
    credentials: { secretId: "AKIDEXAMPLEKEYID", secretKey: "EXAMPLESECRETKEY" },
    service: "tts",
    host: "tts.tencentcloudapi.com",
    action: "TextToVoice",
    version: "2019-08-23",
    region: "ap-guangzhou",
    timestamp: 1759500000,
    body: '{"Text": "\\u4f60\\u597d", "SessionId": "s1"}',
  });
  assert.equal(
    headers.Authorization,
    "TC3-HMAC-SHA256 Credential=AKIDEXAMPLEKEYID/2025-10-03/tts/tc3_request, SignedHeaders=content-type;host, " +
      "Signature=531fa847b588591e1ee89340214ace29e3fc7b7dc655d8183ce1c811092dd68c",
  );
  assert.equal(headers["X-TC-Timestamp"], "1759500000");
  assert.equal(headers["X-TC-Region"], "ap-guangzhou");
});

const fakeFetch = (body: unknown, status = 200) =>
  (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

const call = (f: typeof fetch) =>
  callTencentCloud({
    credentials: { secretId: "id", secretKey: "key" },
    service: "tts",
    version: "2019-08-23",
    action: "TextToVoice",
    region: "ap-guangzhou",
    params: {},
    fetch: f,
  });

test("成功时返回 Response 体；接口报错翻译成带服务商错误码、RequestId 与下一步提示的 KinetoError", async () => {
  assert.deepEqual(await call(fakeFetch({ Response: { Audio: "AAA", RequestId: "r1" } })), { Audio: "AAA", RequestId: "r1" });
  await assert.rejects(call(fakeFetch({ Response: { Error: { Code: "AuthFailure.SecretIdNotFound", Message: "bad id" }, RequestId: "r2" } })), {
    code: "TOOL_AUTH_FAILED",
    message: /AuthFailure\.SecretIdNotFound.*bad id.*r2/,
  });
  await assert.rejects(call(fakeFetch({ Response: { Error: { Code: "UnauthorizedOperation.ErrorUserNotExist", Message: "x" }, RequestId: "r3" } })), {
    code: "TOOL_SERVICE_UNAVAILABLE",
  });
  await assert.rejects(call(fakeFetch({ Response: { Error: { Code: "InvalidParameter.TextTooLong", Message: "too long" }, RequestId: "r4" } })), {
    code: "TOOL_FAILED",
  });
  await assert.rejects(call(fakeFetch("<html>", 502)), { code: "TOOL_FAILED" });
});
