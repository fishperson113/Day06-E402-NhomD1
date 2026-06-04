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
- n8n workflow endpoint (URL webhook)

## Setup

### 1. Install dependencies

```bash
cd mini-hackathon
npm install
```

### 2. Set secrets

Encore secrets được inject vào app khi runtime, không lưu trong code.

```bash
# Telegram Bot Token (bắt buộc)
encore secret set --type dev,local TelegramBotToken
# Nhập token từ @BotFather (dạng 123456:ABC-DEF...)

# n8n webhook URL (bắt buộc)
encore secret set --type dev,local N8nWebhookUrl
# Nhập URL webhook từ n8n (dạng https://your-tunnel.trycloudflare.com/webhook/mini-hackathon)
```

### 3. Configure frontend

Frontend dùng Next.js public env vars. File `frontend/.env` chứa sẵn giá trị mặc định phù hợp cho dev:

```env
# API base URL (mặc định port Encore)
NEXT_PUBLIC_API_URL=http://localhost:4000

# Polling interval (ms)
NEXT_PUBLIC_POLL_INTERVAL=5000

# Locale & currency
NEXT_PUBLIC_LOCALE=vi-VN
NEXT_PUBLIC_CURRENCY= đ

# Encore dev toolbar (bật = true khi cần debug)
NEXT_PUBLIC_ENABLE_TOOLBAR=false
```

Có thể ghi đè bằng file `frontend/.env.local` (đã trong `.gitignore`).

### 4. Run backend

```bash
encore run
```

App chạy tại `http://localhost:4000`.

### 5. Tunnel với ngrok

Mở terminal mới:

```bash
ngrok http 4000
```

Hoặc dùng domain cố định nếu có:

```bash
ngrok http 4000 --domain your-domain.ngrok-free.dev
```

Lấy URL từ output của ngrok (dạng `https://xxxx.ngrok-free.dev`).

### 6. Đăng ký webhook cho Telegram bot

```bash
# Thay YOUR_TOKEN và YOUR_NGROK_URL tương ứng
curl -X POST "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://<YOUR_NGROK_URL>/telegram/webhook"
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
ngrok http 4000 --domain your-domain.ngrok-free.dev
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

## Environment Variables Reference

| Variable | Required | Default | Mô tả |
|---|---|---|---|
| `TelegramBotToken` | Yes (encore secret) | — | Token từ @BotFather |
| `N8nWebhookUrl` | Yes (encore secret) | — | Webhook URL của n8n workflow |
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:4000` | API base URL (frontend) |
| `NEXT_PUBLIC_POLL_INTERVAL` | No | `5000` | Tần suất poll dữ liệu (ms) |
| `NEXT_PUBLIC_LOCALE` | No | `vi-VN` | Locale hiển thị số |
| `NEXT_PUBLIC_CURRENCY` | No | ` đ` | Đơn vị tiền tệ |
| `NEXT_PUBLIC_ENABLE_TOOLBAR` | No | `false` | Bật Encore toolbar (debug) |

## Useful commands

```bash
# Logs
encore run --debug

# Dashboard (traces, API docs)
open http://localhost:9400

# Build frontend standalone
npx next build ./frontend
```
