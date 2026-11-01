const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function request(path, { body, form, headers, responseType = "json", ...options } = {}) {
  const isForm = form !== undefined;
  const response = await fetch(`${baseUrl}${path}`, {
    credentials: "same-origin",
    ...options,
    headers: {
      Accept: responseType === "message" ? "application/json, text/plain" : "application/json",
      ...(isForm ? { "Content-Type": "application/x-www-form-urlencoded" } : body !== undefined && { "Content-Type": "application/json" }),
      ...headers,
    },
    ...(isForm ? { body: new URLSearchParams(form).toString() } : body !== undefined && { body: JSON.stringify(body) }),
  });
  const content = await response.text();
  if (responseType === "message" && /^\s*</.test(content)) throw new ApiError("Máy chủ trả về dữ liệu JSON không hợp lệ.", response.status);
  let data = content;
  if (content && response.headers.get("content-type")?.includes("application/json")) {
    try { data = JSON.parse(content); }
    catch {
      // Older Spring controllers send an unquoted String with a JSON header.
      // Only message endpoints accept that legacy shape; structured API data
      // and malformed JSON/HTML must still fail instead of reporting success.
      if (responseType !== "message" || /^\s*[\[\{"]/.test(content)) throw new ApiError("Máy chủ trả về dữ liệu JSON không hợp lệ.", response.status);
    }
  }
  if (!response.ok) {
    const message = typeof data === "object" && data ? data.message : data;
    throw new ApiError(message || `Yêu cầu thất bại (HTTP ${response.status}).`, response.status);
  }
  return data || null;
}
export const tournamentApi = {
  list: (options) => request("/api/tournaments", options),
  get: (id, options) => request(`/api/tournaments/${encodeURIComponent(id)}`, options),
};

export const notificationApi = {
  list: (userId, options) => request(`/api/notifications/user/${encodeURIComponent(userId)}`, options),
  markAsRead: (id, options) => request(`/api/notifications/${encodeURIComponent(id)}/read`, { ...options, method: "PUT" }),
};

export const authApi = {
  login: (form) => request("/api/users/login", { method: "POST", form }),
  register: (body) => request("/api/users/register", { method: "POST", body, responseType: "message" }),
  verify: (form) => request("/api/verification/verify-email", { method: "POST", form, responseType: "message" }),
  resend: (email) => request("/api/verification/resend-activation-code", { method: "POST", form: { email }, responseType: "message" }),
};
