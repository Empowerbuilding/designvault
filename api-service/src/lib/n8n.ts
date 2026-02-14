import { log } from "./logger.js";

const N8N_BASE_URL =
  process.env.N8N_BASE_URL ?? "https://n8n.empowerbuilding.ai";

export async function callN8nWebhook<T = unknown>(
  webhookPath: string,
  payload: Record<string, unknown>
): Promise<T> {
  const url = `${N8N_BASE_URL}/webhook/${webhookPath}`;

  log("N8N_CALL", { url, payload });

  const start = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const elapsed = Date.now() - start;

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    log("N8N_ERROR", { url, status: res.status, elapsed, body });
    throw new Error(`n8n webhook failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as T;
  log("N8N_OK", { url, elapsed });

  return data;
}
