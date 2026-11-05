# DramaBox PoC

Mobile-first proof of concept for a short-drama streaming app, laid out like an Emergent project.

- `backend/` FastAPI (port 8001, all routes under `/api`) + MongoDB
- `frontend/` React (CRA + craco, yarn, Tailwind) on port 3000
- `tests/` backend pytest

## Run locally
    # backend
    cd backend && python3 -m venv .venv && . .venv/bin/activate
    pip install -r requirements-dev.txt
    uvicorn server:app --port 8001 --reload
    # frontend
    cd frontend && yarn install && yarn start

## Media
Posters and sample clips live in `frontend/public/media/` and are served as static files
(`/media/...`) by the frontend host. They are open-licence (CC0 / CC BY / CC BY-SA); credits are in
`frontend/public/media/CREDITS.md` and linked from the Profile screen.

## Deploy (Vercel + MongoDB Atlas, free tiers)
Two Vercel projects from this repo plus one Atlas M0 cluster.
1. Atlas: create a free M0 cluster, a database user, and allow network access `0.0.0.0/0`.
   Seed once: `cd backend && MONGO_URL="mongodb+srv://..." python seed_cli.py`.
2. Backend project: root directory `backend`, env `MONGO_URL`, `DB_NAME=dramabox_poc`, `CORS_ORIGINS=<frontend url>`.
3. Frontend project: root directory `frontend`, env `REACT_APP_BACKEND_URL=<backend url>`.
