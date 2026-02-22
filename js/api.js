function resolveApiBase() {
  const fromWindow = window.__API_BASE__;
  const fromMeta = document.querySelector('meta[name="api-base"]')?.content?.trim();
  if (fromWindow) return String(fromWindow).trim();
  if (fromMeta) return fromMeta;
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return "http://localhost:4000";
  }
  return "";
}

const API_BASE = resolveApiBase();

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem("auth-token", token);
  } else {
    localStorage.removeItem("auth-token");
  }
}

export function getAuthToken() {
  if (authToken) return authToken;
  const stored = localStorage.getItem("auth-token");
  if (stored) {
    authToken = stored;
  }
  return authToken;
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = API_BASE ? `${API_BASE}${path}` : path;
  const res = await fetch(url, {
    ...options,
    headers,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = data?.error || res.statusText || "Request failed";
    throw new Error(message);
  }

  return data;
}

export async function apiRegister(payload) {
  const data = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setAuthToken(data.token);
  return data;
}

export async function apiLogin(payload) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setAuthToken(data.token);
  return data;
}

export async function apiListQuotations() {
  return request("/api/quotations");
}

export async function apiCreateQuotation(payload) {
  return request("/api/quotations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateQuotation(id, payload) {
  return request(`/api/quotations/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteQuotation(id) {
  await request(`/api/quotations/${id}`, { method: "DELETE" });
}
