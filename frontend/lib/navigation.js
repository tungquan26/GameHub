const AUTH_PATHS = new Set(["/login", "/register", "/verify", "/auth/login", "/auth/register", "/auth/verify"]);
const PRIVATE_PATHS = new Set(["/events", "/create", "/messages", "/profile/settings", "/tournament"]);

function decodedPath(pathname) {
  let path = pathname;
  for (let count = 0; count < 5; count++) {
    const next = decodeURIComponent(path);
    if (next === path) return path.replace(/\/+$/, "").toLowerCase() || "/";
    path = next;
  }
  throw new Error("Đường dẫn mã hóa không hợp lệ.");
}

// Chỉ dùng đích nội bộ, tránh quay lại chính cụm xác thực hoặc URL bên ngoài.
export function safeReturnTo(value, fallback = "/") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(decoded)) return fallback;
    const url = new URL(value, "https://btp.local");
    const path = decodedPath(url.pathname);
    if (url.origin !== "https://btp.local" || path.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(path) || AUTH_PATHS.has(path)) return fallback;
    return url.pathname + url.search + url.hash;
  } catch { return fallback; }
}

export function returnToFrom(location, fallback = "/") {
  return safeReturnTo(new URLSearchParams(location.search).get("returnTo") ?? location.state?.from, fallback);
}

export function loginPath(location) {
  const search = location.search ? "?" + location.search.replace(/^\?/, "") : "";
  const hash = location.hash ? "#" + location.hash.replace(/^#/, "") : "";
  const returnTo = safeReturnTo(location.pathname + search + hash);
  return { pathname: "/login", search: new URLSearchParams({ returnTo }).toString() };
}

export function authPath(pathname, location, values = {}) {
  const params = new URLSearchParams(values);
  const returnTo = returnToFrom(location, "");
  if (returnTo) params.set("returnTo", returnTo);
  return { pathname, search: params.toString() };
}

export function requiresAuthentication(location) {
  const { pathname, search } = typeof location === "string" ? new URL(location, "https://btp.local") : location;
  const path = decodedPath(pathname);
  return PRIVATE_PATHS.has(path) || isManagementRoute({ pathname: path, search });
}

export function isManagementRoute({ pathname, search }) {
  let path;
  try { path = decodedPath(pathname); } catch { return false; }
  return path.startsWith("/tournament/") && path !== "/tournament/view"
    && !(path === "/tournament/schedule" && new URLSearchParams(search).get("view") === "public");
}
