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
1. git clone <repo-url>
cd CodeE.AI

# Backend deps
2. cd backend
npm install

# Frontend deps
3. cd ../frontend
npm install

4. Run Backend
cd backend
npm start    # or: npm run dev   (depending on package.json)


Backend runs on: http://localhost:8000

5. Run Frontend
cd frontend
npm start


Frontend runs on: http://localhost:3000
```

## 🧬 Structure
```
CodeE.AI/
├── backend/
│   ├── .env
│   ├── server.js          # Express app entry
│   ├── n8n.service.js     # Calls n8n generate-email & classify-reply webhooks
│   ├── backend_test.js    # Simple test script (optional)
│   ├── package.json
│   └── ... (other backend files: routes, models, mailer, etc.)
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/    # Reusable UI parts (forms, tables, cards)
│   │   ├── contexts/      # React context (auth, campaigns, etc.)
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # API helpers / utils
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   └── NewCampaignPage.jsx
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   └── craco.config.js / tailwind.config.js
│
└── README.md
```
 