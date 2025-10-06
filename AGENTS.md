# Repository Guidelines

## Project Structure & Module Organization
- Root: `docker-compose.yml`, `cloudbuild.yaml`, `README.md`。
- Backend (FastAPI): `backend/app/` に `main.py`(エントリ), `db.py`(DB接続), `models.py`, `schemas.py`。
- Frontend (Vite + React): `frontend/` に `index.tsx`, `index.html`, `vite.config.ts`。
- Assets/静的出力: フロントは `frontend/dist/` にビルド成果物。

## Build, Test, and Development Commands
- Backend (local): `cd backend && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && uvicorn app.main:app --reload`。
- Frontend (local): `cd frontend && npm install && npm run dev`。
- Docker (dev, all): ルートで `docker-compose up --build`。`http://localhost:5173` (FE), `http://localhost:8080/api` (BE)。
- Frontend build: `cd frontend && npm run build` (出力は `dist/`)。
- Container build (CI): `cloudbuild.yaml` で `backend`/`frontend` それぞれのイメージをビルド。

## Coding Style & Naming Conventions
- Python: PEP 8、4スペースインデント、型ヒント必須。`snake_case`（関数/変数）、`PascalCase`（Pydantic/SQLAlchemyモデル）。
- TypeScript/React: 関数コンポーネント/フックを推奨。コンポーネントは `PascalCase`、変数は `camelCase`。
- API ルートは `/api/...` に統一。モジュール配置は `app/` 直下に集約。

## Testing Guidelines
- 現状、正式なテストは未整備。追加する場合の推奨:
  - Backend: `pytest` + `httpx`/`pytest-asyncio`。配置は `backend/tests/test_*.py`。
  - Frontend: `Vitest` + `@testing-library/react`。配置は `frontend/src/**/*.test.tsx`。
- 変更時は最小限のユニットテストを同梱し、主要フローの回帰を防止。

## Commit & Pull Request Guidelines
- コミット: 1 つの意図に小さく。英日どちらでも可。例: `backend: add Item model`, `frontend: wire /api/items`。
- PR: 目的/背景、主要変更点、動作確認手順、影響範囲（backend/frontend/docker）を記載。必要ならスクリーンショット/ログを添付。

## Security & Configuration Tips
- 環境変数: Backend は `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME`。未設定時は `sqlite:/tmp/minapp/app.db` にフォールバック。
- CORS: 開発中は許可広め。本番は `allow_origins` を必要最小限へ。
- Frontend: `VITE_API_BASE` で API エンドポイントを指定（Compose では自動設定）。

