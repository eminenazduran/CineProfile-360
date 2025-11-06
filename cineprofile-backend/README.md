\# CineProfile Backend



\## Çalıştırma

```bash

npm install

npm start

# CineProfile Backend

## Env
- PORT=3000
- ANALYZER_URL=http://127.0.0.1:5001 (yoksa analyze-test fallback mock döner)
- JWT_SECRET=dev-secret

## Endpoint’ler
- GET /health → { status:"ok" }
- POST /api/analyze-test {text} → {violence,fear,risk_spans}
- POST /api/auth/mock-login → {token}
- GET /api/me (Bearer <token>) → kullanıcı payload
- GET /api/policies/me (Bearer) → {autoplay,dimScreen,skipViolence}
- PUT /api/policies/me (Bearer) body: {auto_skip,dim_screen,lower_volume} → günceller (şimdilik memory)

## Çalıştırma


