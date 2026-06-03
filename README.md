# Mini Hackathon - Personal Finance Bot

Quản lý thu chi cá nhân qua Telegram + Encore + n8n workflow.

## Architecture

```
Telegram ──webhook──► Encore (telegram service)
                          │
                    ai-engine service
                          │
                  ┌───────┴───────┐
                  │  n8n workflow  │
                  └───────┬───────┘
                          │
              finance service (PostgreSQL)
                          │
              sendMessage reply về Telegram
```

## Services

| Service | Chức năng |
|---|---|
| `telegram` | Nhận webhook từ Telegram, gọi AI Engine |
| `ai-engine` | Forward message lên n8n workflow, nhận response |
| `finance` | CRUD giao dịch thu/chi (PostgreSQL) |
| `frontend` | Next.js UI tại `/finance` |

## Prerequisites

- Node.js 20+
- Docker (Encore tự động start PostgreSQL)
- Encore CLI
- ngrok (để expose local ra internet)
- Telegram Bot Token (từ [@BotFather](https://t.me/botfather))

## Setup

### 1. Install dependencies

```bash
cd mini-hackathon
npm install
```

### 2. Set Telegram Bot Token

```bash
encore secret set --type dev,local TelegramBotToken
```

Nhập token từ @BotFather (dạng `123456:ABC-DEF...`).

### 3. Run backend

```bash
encore run
```

App chạy tại `http://localhost:4000`.

### 4. Tunnel với ngrok

Mở terminal mới:

```bash
ngrok http 4000 --domain pennie-superindustrious-january.ngrok-free.dev
```

### 5. Đăng ký webhook cho Telegram bot

```bash
curl -X POST "https://api.telegram.org/bot<THAY_BANG_TOKEN_THAT>/setWebhook?url=https://pennie-superindustrious-january.ngrok-free.dev/telegram/webhook"
```

Kết quả mong đợi: `{"ok": true, "result": true, "description": "Webhook was set"}`

## Run locally (tóm tắt)

Mỗi lần dev cần 2 terminal:

**Terminal 1 - Backend:**
```bash
cd mini-hackathon
encore run
```

**Terminal 2 - Tunnel:**
```bash
ngrok http 4000 --domain pennie-superindustrious-january.ngrok-free.dev
```

## API Endpoints

### Finance

```bash
# Thêm giao dịch
curl -X POST "http://localhost:4000/finance/transactions" \
  -H "Content-Type: application/json" \
  -d '{"type": "expense", "amount": 4000, "category": "food", "description": "trứng x2 quả"}'

# Danh sách
curl "http://localhost:4000/finance/transactions"

# Tổng quan
curl "http://localhost:4000/finance/summary"

# Xoá
curl -X DELETE "http://localhost:4000/finance/transactions/1"
```

### Frontend

Mở `http://localhost:4000/finance`.

## Database

```bash
# Kết nối psql
encore db shell finance --env=local --superuser
```

## Useful commands

```bash
# Logs
encore run --debug

# Dashboard (traces, API docs)
open http://localhost:9400
```
