# DramaBox PoC

Mobile-first proof of concept for a short-drama streaming app, laid out like an Emergent project.

- `backend/` FastAPI (port 8001, all routes under `/api`) + MongoDB
- `frontend/` React (CRA + craco, yarn, Tailwind) on port 3000
- `tests/` backend pytest

## Run locally
    # backend
    cd backend && python3 -m venv .venv && . .venv/bin/activate
    pip install -r requirements.txt
    uvicorn server:app --port 8001 --reload
    # frontend
    cd frontend && yarn install && yarn start

## Media
`backend/media/` is gitignored. Demo episodes are copyrighted third-party content for local
evaluation only; replace them with licensed content before any public demo or deploy.
