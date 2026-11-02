# GReSym web client

Vue 3 + Vite + TypeScript frontend of GReSym. Project notes: `../docs/web.md`.

```sh
npm install --legacy-peer-deps
cp .env.example .env    # optional
npm run dev             # http://localhost:5173 (needs the API on http://localhost:5147)
npm run build
npm run preview -- --host
npm run test:unit
npm run lint
```
