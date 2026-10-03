// 腾讯云 API 3.0 的最小客户端：TC3-HMAC-SHA256 签名 + JSON POST。
// 几十行能写清，不为它引入体积庞大的官方 Node SDK；签名与官方 Python SDK 对拍过（见测试）。
import { createHash, createHmac } from "node:crypto";
import { KinetoError } from "../../kernel/errors.ts";

export interface TencentCredentials {
  secretId: string;
  secretKey: string;
}

export interface SignInput {
  credentials: TencentCredentials;
  service: string;
  host: string;
  action: string;
  version: string;
  region?: string;
  timestamp: number;
  body: string;
}

const sha256 = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");
const hmac = (key: Buffer | string, msg: string) => createHmac("sha256", key).update(msg, "utf8").digest();

export function signTc3(input: SignInput): Record<string, string> {
  const contentType = "application/json";
  const date = new Date(input.timestamp * 1000).toISOString().slice(0, 10);
  const canonicalRequest = ["POST", "/", "", `content-type:${contentType}\nhost:${input.host}\n`, "content-type;host", sha256(input.body)].join("\n");
  const scope = `${date}/${input.service}/tc3_request`;
  const stringToSign = ["TC3-HMAC-SHA256", String(input.timestamp), scope, sha256(canonicalRequest)].join("\n");
  const signingKey = hmac(hmac(hmac(`TC3${input.credentials.secretKey}`, date), input.service), "tc3_request");
  const signature = createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");
  return {
    Authorization: `TC3-HMAC-SHA256 Credential=${input.credentials.secretId}/${scope}, SignedHeaders=content-type;host, Signature=${signature}`,
    "Content-Type": contentType,
    Host: input.host,
    "X-TC-Action": input.action,
    "X-TC-Timestamp": String(input.timestamp),
    "X-TC-Version": input.version,
    ...(input.region ? { "X-TC-Region": input.region } : {}),
  };
}

export interface CallInput {
  credentials: TencentCredentials;
  service: string;
  version: string;
  action: string;
  region?: string;
  params: Record<string, unknown>;
  // 测试时注入
  fetch?: typeof fetch;
}

export async function callTencentCloud<T = Record<string, unknown>>(input: CallInput): Promise<T> {
  const host = `${input.service}.tencentcloudapi.com`;
  const body = JSON.stringify(input.params);
  const headers = signTc3({ ...input, host, timestamp: Math.floor(Date.now() / 1000), body });
  const what = `${input.service}.${input.action}`;
  const res = await (input.fetch ?? fetch)(`https://${host}/`, { method: "POST", headers, body }).catch((err: unknown) => {
    throw new KinetoError("TOOL_FAILED", `${what}: ${(err as Error).message}`, { hint: "Check the network, then retry.", cause: err });
  });
  const text = await res.text();
  let json: { Response?: T & { Error?: { Code: string; Message: string }; RequestId?: string } };
  try {
    json = JSON.parse(text);
  } catch {
    throw new KinetoError("TOOL_FAILED", `${what}: HTTP ${res.status}, not JSON: ${text.slice(0, 200)}`, { hint: "Retry later." });
  }
  const response = json.Response;
  if (!response) throw new KinetoError("TOOL_FAILED", `${what}: unexpected response ${text.slice(0, 200)}`);
  if (response.Error) throw providerError(what, response.Error, response.RequestId);
  return response;
}

// 服务商错误码按「下一步该做什么」归成三类；原始错误码与 RequestId 保留在消息里，方便找客服
function providerError(what: string, error: { Code: string; Message: string }, requestId: string | undefined): KinetoError {
  const message = `${what} failed: ${error.Code}: ${error.Message} (RequestId ${requestId ?? "?"})`;
  if (error.Code.startsWith("AuthFailure")) {
    return new KinetoError("TOOL_AUTH_FAILED", message, {
      hint: "Check secretId / secretKey of this tool in kineto.config.yaml (usually ${ENV} references into your envFile).",
    });
  }
  // 服务没开通、额度用完、欠费、子账号没授权：都要人去控制台处理，重试没用
  if (/^(UnauthorizedOperation|ResourceUnavailable|ResourceInsufficient)|NotActivated|NotOpen|Arrears|Exhausted|ChargeResource/.test(error.Code)) {
    return new KinetoError("TOOL_SERVICE_UNAVAILABLE", message, {
      hint: "In the Tencent Cloud console: enable the service, claim its free quota or turn on pay-as-you-go billing, and grant this key its CAM policy.",
    });
  }
  return new KinetoError("TOOL_FAILED", message, { hint: "Check the tool's options against the provider's limits." });
}
