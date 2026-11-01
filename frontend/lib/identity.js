// Danh tính tài khoản độc lập với GamerTag có thể đổi và tên hiển thị trùng nhau.
export function userKey(user) {
  if (!user || typeof user !== "object") return null;
  const id = user.id ?? user.userId;
  if (id != null && String(id).trim()) return `id:${id}`;
  if (user.userCode) return `code:${user.userCode}`;
  if (user.username) return `username:${user.username.toLocaleLowerCase("vi")}`;
  return null;
}

export const userTag = (user) => user?.gamerTag || user?.tagName || user?.username || "";

export function matchesIdentity(key, id, user) {
  const identity = userKey(user);
  if (!identity) return false;
  if (key) return key === identity;
  return id != null && identity === `id:${id}`;
}
