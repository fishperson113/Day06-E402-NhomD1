import { api, APIError, ErrCode } from "encore.dev/api";
import { secret } from "encore.dev/config";
import log from "encore.dev/log";
import { ai_engine } from "~encore/clients";

const botToken = secret("TelegramBotToken");

// Telegram sends updates as POST to our webhook.
// We parse it raw, log it, and acknowledge receipt.
// For now this just proves Encore can receive messages.
export const webhook = api.raw(
  { expose: true, method: "POST", path: "/telegram/webhook" },
  async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const raw = Buffer.concat(chunks).toString("utf-8");

    let update: TelegramUpdate;
    try {
      update = JSON.parse(raw);
    } catch {
      throw APIError.invalidArgument("invalid JSON");
    }

    const msg = update.message;
    log.info("telegram message received", {
      chat_id: msg?.chat?.id,
      from: msg?.from?.first_name,
      text: msg?.text,
    });

    if (msg?.text) {
      if (msg.text.startsWith("/")) {
        await handleCommand(msg.chat.id, msg.text);
      } else {
        const { reply } = await ai_engine.send({ message: msg.text });
        const text = typeof reply === "string" ? reply : (reply as any).text ?? "";
        log.info("ai engine reply", { text });
        if (text) await sendMessage(msg.chat.id, text);
      }
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  },
);

// Helper: send a message back to a Telegram chat.
// Called by other services when they want to reply.
export async function sendMessage(chatId: number, text: string) {
  const token = botToken();
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    log.error("telegram sendMessage failed", { status: resp.status, body });
    throw new Error(`telegram api error: ${resp.status}: ${body}`);
  }
}

async function handleCommand(chatId: number, text: string) {
  switch (text) {
    case "/start":
      await sendMessage(
        chatId,
        "Xin chào! Tôi là bot quản lý thu chi.\n\n"
        + "Gõ /help để xem hướng dẫn.",
      );
      break;

    case "/help":
      await sendMessage(
        chatId,
        "Cách dùng:\n"
        + "• Nhắn tin tự nhiên để ghi giao dịch\n"
        + "  Ví dụ: trứng x2 quả 4k\n"
        + "• /summary — Xem tổng quan thu chi\n"
        + "• /help — Hướng dẫn này",
      );
      break;

    default:
      await sendMessage(chatId, `Unknown command: ${text}`);
  }
}

// Types from Telegram Bot API (minimal — enough for our use case)
interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      first_name?: string;
      type: string;
    };
    date: number;
    text?: string;
  };
}
