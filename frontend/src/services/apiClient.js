const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToken() {
  return sessionStorage.getItem("clearance_token");
}

/**
 * Central fetch wrapper used by every service function. Attaches the JWT
 * (if present), parses JSON, and throws a normal Error with the backend's
 * message on non-2xx responses so callers can just try/catch.
 */
async function request(path, { method = "GET", body, headers = {}, isFormData = false } = {}) {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // some endpoints (like file download) don't return JSON — handled by callers directly
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body, opts = {}) => request(path, { method: "POST", body, ...opts }),
  put: (path, body) => request(path, { method: "PUT", body }),
  del: (path) => request(path, { method: "DELETE" }),
};

export function downloadUrl(path) {
  return `${BASE_URL}${path}`;
}

/**
 * Fetches a binary file (PDF, uploaded document) with the JWT auth header
 * attached, then opens it in a new tab via a blob URL. Needed because a
 * plain <a href> can't attach an Authorization header, and these download
 * routes are protected (row-level access checks happen server-side).
 */
export async function downloadAuthenticatedFile(path) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Download failed (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export { BASE_URL };
