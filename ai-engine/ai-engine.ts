import { api } from "encore.dev/api";
import log from "encore.dev/log";

const N8N_WEBHOOK_URL = "https://convicted-oriental-nursery-tune.trycloudflare.com/webhook/mini-hackathon";

export interface AIRequest {
  message: string;
}

export interface AIResponse {
  reply: unknown;
}

export const send = api<AIRequest, AIResponse>(
  { method: "POST" },
  async ({ message }) => {
    log.info("forwarding to n8n ai engine", { url: N8N_WEBHOOK_URL });

    const resp = await fetch(N8N_WEBHOOK_URL, {
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
