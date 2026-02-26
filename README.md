# 🚀 AgencyFlow

**Multi-Channel Marketing Automation SaaS for Indian Digital Agencies**

AgencyFlow is a B2B SaaS platform that enables digital marketing agencies to run campaigns across SMS, WhatsApp, Email, and Voice — all from a single dashboard with AI-powered message enhancement.

## ✨ Features

- **📱 SMS Campaigns** — Bulk SMS via Textbee (Android gateway)
- **💬 WhatsApp Campaigns** — Bulk WhatsApp via WAHA (self-hosted)
- **📧 Email Campaigns** — Bulk email via Resend
- **📞 Voice Campaigns** — Automated calls via Twilio
- **🤖 AI Enhancement** — Enhance messages with Groq, Gemini, Cohere, and more
- **📊 Real-time Dashboard** — Live delivery tracking via SSE
- **📰 Blog Automation** — RSS scanning + AI article generation (STORM)
- **💳 Razorpay Billing** — Free trial → Pro (₹999/mo) → Agency (₹2,999/mo)
- **🔐 Firebase Auth** — Google, GitHub, Phone OTP, Email/Password

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| State | Zustand + TanStack Query |
| Backend | FastAPI (Python 3.12, async) |
| Database | Neon PostgreSQL (SQLAlchemy 2.0 + asyncpg) |
| Auth | Firebase Auth + Admin SDK |
| AI | Groq, Gemini, Cohere, DeepSeek, Together AI, HuggingFace, Ollama |
| Payments | Razorpay |
| Queue | Redis pub/sub + asyncio BackgroundTasks |
| MCP | 12 MCP servers for tool orchestration |

## 📁 Project Structure

```
agencyflow/
├── frontend/          ← Next.js 14 App Router
├── backend/           ← FastAPI + SQLAlchemy
├── mcp/               ← MCP server configs + custom server
├── docker-compose.yml ← WAHA + Redis + Ollama + Nginx
└── .github/workflows/ ← CI/CD pipeline
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.12+
- Docker & Docker Compose
- Redis

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/agencyflow.git
cd agencyflow

# Frontend
cd frontend && npm install

# Backend
cd ../backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp frontend/.env.local.example frontend/.env.local
cp backend/.env.example backend/.env
# Fill in all API keys
```

### 3. Start Local Services

```bash
docker-compose up -d
docker exec agencyflow-ollama-1 ollama pull llama3.2:3b
```

### 4. Run Migrations

```bash
cd backend
alembic upgrade head
python seed.py
```

### 5. Start Dev Servers

```bash
# Terminal 1
cd backend && uvicorn main:app --reload --port 8000

# Terminal 2
cd frontend && npm run dev
```

### 6. Open
- Frontend: http://localhost:3000
- Backend: http://localhost:8000/health
- WAHA: http://localhost:3001/dashboard

## 💰 Pricing

| Plan | Price | SMS | WhatsApp | Email | Voice |
|------|-------|-----|----------|-------|-------|
| Free Trial | Free (14 days) | 50 | 20 | 50 | 10 |
| Pro | ₹999/mo | 5,000 | 2,000 | 10,000 | 500 |
| Agency | ₹2,999/mo | Unlimited | Unlimited | Unlimited | Unlimited |

## 📄 License

MIT
