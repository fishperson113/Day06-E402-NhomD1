# Personal Finance AI — Prototype

Quản lý thu chi cá nhân thông qua giao diện web, kết hợp AI để tự động trích xuất giao dịch từ tin nhắn tiếng Việt tự nhiên.

## Kiến trúc

```
Người dùng ──► Next.js (Frontend) ──► Encore.ts (Backend API)
                                              │
                                    ┌─────────┴──────────┐
                                    ▼                    ▼
                              PostgreSQL            n8n AI Engine
                              (transactions)         (LLM prompt)
```

- **Encore.ts** — Backend framework (TypeScript), tự động quản lý API endpoints, database, secrets.
- **PostgreSQL** — Lưu trữ giao dịch thu chi.
- **n8n** — Workflow engine chạy AI prompt (LLM), nhận request từ `ai-engine` service và trả kết quả JSON.
- **Next.js** — Frontend SPA, serve qua Encore raw endpoint.

## Cấu trúc thư mục

```
codebase/
├── ai-engine/          # Service: gọi n8n webhook để xử lý AI
│   ├── encore.service.ts
│   └── ai-engine.ts
├── finance/            # Service: CRUD giao dịch + database migration
│   ├── encore.service.ts
│   └── migrations/
├── frontend/           # Next.js app (Personal Finance dashboard)
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── finance/page.tsx
│   │   └── globals.css
│   ├── frontend.ts     # Encore raw endpoint → Next.js handler
│   └── .env            # Frontend env variables
├── promt.md            # System prompt cho LLM trích xuất giao dịch
├── encore.app          # App manifest
├── package.json        # Root dependencies
└── README.md
```

## Yêu cầu

| Công cụ | Phiên bản | Ghi chú |
|---------|-----------|---------|
| Node.js | ≥ 20 | |
| npm | ≥ 9 | |
| Encore CLI | ≥ 1.57 | Cần đăng nhập (login) |
| Docker | latest | Chạy PostgreSQL local |
| n8n | latest | Chạy qua Docker |
| Git | — | |

### Cài đặt Encore CLI

```bash
# Windows (PowerShell)
winget install encoredotdev.encore

# macOS
brew install encore

# Linux
curl -L https://encore.dev/install.sh | bash
```

Sau đó đăng nhập:
```bash
encore auth login
```

## 1. Thiết lập hạ tầng

### PostgreSQL

Encore tự động khởi tạo database PostgreSQL local khi chạy `encore run`. Không cần cài đặt thủ công — Docker sẽ được Encore dùng để chạy Postgres.

### n8n AI Engine

Dự án dùng **n8n** làm AI workflow engine. Service `ai-engine` gửi request tới một webhook n8n, n8n gọi LLM với prompt trích xuất giao dịch (`promt.md`) và trả về JSON.

#### Bước 1: Chạy n8n bằng Docker

```bash
docker run -d --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  -e N8N_SECURE_COOKIE=false \
  n8nio/n8n
```

#### Bước 2: Tạo workflow trong n8n

1. Mở n8n tại `http://localhost:5678`
2. Tạo **Workflow** mới
3. Thêm node **Webhook** (method: POST, path: `/ai-extract`)
4. Thêm node **OpenAI** (hoặc LLM node tương ứng):
   - Model: `gpt-4o-mini` (hoặc model tương đương)
   - System prompt: nội dung file [`promt.md`](./promt.md)
   - User message: `{{ $json.message }}`
5. Thêm node **Code** để parse JSON response từ LLM
6. Kết nối output về Webhook response
7. **Active** workflow

Sau khi active, webhook URL có dạng:
```
http://localhost:5678/webhook/ai-extract
```

> **Lưu ý**: Trên Windows, cần đặt `host.docker.internal` để n8n gọi được API. Hoặc dùng `http://172.17.0.1:5678` từ container.

## 2. Cấu hình Secrets

### Encore Secrets

Dự án dùng Encore secret `N8nWebhookUrl` (định nghĩa trong `ai-engine/ai-engine.ts`).

```bash
# Set cho môi trường local
encore secret set --type local N8nWebhookUrl
```

Khi được hỏi, nhập URL webhook n8n:
```
http://localhost:5678/webhook/ai-extract
```

### Frontend .env

File `frontend/.env` đã có sẵn giá trị mặc định. Có thể tuỳ chỉnh:

```env
# API base URL (dùng khi window.location.origin không khả dụng)
NEXT_PUBLIC_API_URL=http://localhost:4000

# Polling interval (ms) cho auto-refresh
NEXT_PUBLIC_POLL_INTERVAL=5000

# Locale format
NEXT_PUBLIC_LOCALE=vi-VN

# Currency suffix
NEXT_PUBLIC_CURRENCY= đ

# Bật Encore Dev Toolbar (true/false)
NEXT_PUBLIC_ENABLE_TOOLBAR=false
```

## 3. Chạy local

### Development

```bash
cd codebase

# Cài dependencies
npm install

# Chạy app (cả backend + frontend)
encore run
```

Encore sẽ:
1. Khởi tạo database PostgreSQL trong Docker
2. Chạy migration
3. Compile TypeScript
4. Boot Next.js dev server
5. Serve tại `http://localhost:4000`

Mở trình duyệt: **http://localhost:4000/finance**

### Kiểm tra health

```bash
encore check 'curl /finance/transactions'
```

## Build cho production

```bash
encore build docker mini-hackathon-image
```

Hoặc deploy lên Encore Cloud:

```bash
encore app create --name mini-hackathon
encore deploy
```

## Công nghệ sử dụng

### Backend
- **Encore.ts** — TypeScript backend framework (API, database, secrets, Pub/Sub)
- **PostgreSQL** — Database
- **n8n** — AI workflow engine (gọi LLM)
- **Gemini API** — LLM xử lý tiếng Việt (tuỳ cấu hình n8n)

### Frontend
- **Next.js 14** — React framework (App Router)
- **Tailwind CSS** — Utility-first CSS (CDN)
- **@tanstack/react-query** — Data fetching + caching
- **@heroicons/react** — Icon set

### AI/Prompt Engineering
- **promt.md** — System prompt tiếng Việt cho trích xuất giao dịch tài chính
  - Hỗ trợ slang: *k, củ, chai, tr, triệu, tỷ...*
  - Hỗ trợ đa ngoại tệ: USD, EUR, GBP, JPY, AUD + 15 loại khác
  - Edge cases: nợ/vay, hoàn tiền, mất cắp, lừa đảo, thu nhập bất hợp pháp

## API Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/finance/transactions` | Danh sách giao dịch |
| POST | `/finance/transactions` | Thêm giao dịch mới |
| DELETE | `/finance/transactions/:id` | Xoá giao dịch |
| GET | `/finance/summary` | Tổng quan thu/chi |
| POST | `/ai-engine/send` | Gửi tin nhắn → AI trích xuất giao dịch |
| GET | `/` | Dashboard (redirect → /finance) |

## Environment Variables Reference

```env
# === Backend (Encore Secrets) ===
N8nWebhookUrl             # Webhook URL của n8n AI engine

# === Frontend (frontend/.env) ===
NEXT_PUBLIC_API_URL       # Backend API base URL (default: http://localhost:4000)
NEXT_PUBLIC_POLL_INTERVAL # Auto-refresh interval ms (default: 5000)
NEXT_PUBLIC_LOCALE        # Locale (default: vi-VN)
NEXT_PUBLIC_CURRENCY      # Currency symbol (default: " đ")
NEXT_PUBLIC_ENABLE_TOOLBAR # Encore toolbar (default: false)
```

## Lưu ý

- Không commit API key hay `.env` file thật lên repo. Dùng `encore secret set` cho backend secrets.
- File `promt.md` chứa toàn bộ instruction cho LLM — có thể chỉnh sửa để cải thiện độ chính xác.
- n8n workflow template có thể export dưới dạng JSON và commit vào repo để team dùng chung.
- Khi chạy local, Encore dùng database PostgreSQL ảo trong Docker (dữ liệu sẽ mất khi restart). Nếu muốn giữ dữ liệu, dùng `encore db conn-uri finance` để kết nối và dump.

## Phân công

| Thành viên | MSSV | Vai trò |
|-----------|------|---------|
| Phạm Triều Dương | 2A202600833 | Hạ tầng Encore.ts, tích hợp Telegram bot, n8n workflow |
| Nguyễn Viết Du | 2A202600800 | Frontend (Next.js) |
| Nguyễn Thành Đạt | 2A202600626 | Frontend (Next.js) |
| Nguyễn Ngọc Duy | 2A202600980 | Slide & Spec tài liệu |
| Lê Sỹ Hân | 2A202600790 | Prompt Engineering trên n8n |

---

