# CodeE.AI – AI Cold Outreach Agent

AI-powered cold-email agent that:
- generates personalized outreach emails,
- sends them,
- and classifies replies using an n8n + Groq workflow.
---

## 🏁 Quick Start

### 1. Requirements

- Node.js ≥ 18 and npm
- n8n instance (already deployed)
- (Optional) MongoDB + SMTP account (for real email sending)
---

### 2. Clone & Install

```bash
git clone <repo-url>
cd CodeE.AI

# Backend deps
cd backend
npm install

# Frontend deps
cd ../frontend
npm install
