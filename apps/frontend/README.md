# CineProfile 360 – Frontend

React + Vite. Analyzer (Flask) ve Backend (Express) ile konuşur.

## Kurulum
```bash
cd apps/frontend
npm install


### Auth & Policies (mock)
POST /api/auth/mock-login → { token }
GET  /api/me              (Auth: Bearer)
GET  /api/policies/me     (Auth: Bearer)
PUT  /api/policies/me     (Auth: Bearer) body: { autoplay, dimScreen, skipViolence }
