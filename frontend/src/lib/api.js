import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL || "";

export const api = axios.create({ baseURL: `${BASE}/api` });

const GUEST_KEY = "reelo.guest";

export const getStoredGuestId = () => {
  try { return localStorage.getItem(GUEST_KEY); } catch { return null; }
};
export const storeGuestId = (id) => {
  try { localStorage.setItem(GUEST_KEY, id); } catch { /* private mode: guest lasts one session */ }
};

api.interceptors.request.use((config) => {
  const id = getStoredGuestId();
  if (id) config.headers["X-Guest-Id"] = id;
  return config;
});

// Media paths come back as /api/media/...; make them absolute against the backend.
export const mediaUrl = (path) => (path && path.startsWith("/") ? `${BASE}${path}` : path);
