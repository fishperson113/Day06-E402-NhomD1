import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import log from "encore.dev/log";

const n8nWebhookUrl = secret("N8nWebhookUrl");

export interface AIRequest {
  message: string;
}

export interface AIResponse {
  reply: unknown;
}

export const send = api<AIRequest, AIResponse>(
  { method: "POST" },
  async ({ message }) => {
    const url = n8nWebhookUrl();
    log.info("forwarding to n8n ai engine", { url });

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (resp.status >= 400) {
      const body = await resp.text();
      log.error("n8n error", { status: resp.status, body });
      throw new Error(`n8n error: ${resp.status}: ${body}`);
    }

    const reply = await resp.json();
    return { reply };
  },
);
