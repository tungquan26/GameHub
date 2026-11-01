export function notificationDate(value) {
  if (typeof value !== "string" || !value) return null;
  // Backend LocalDateTime has no offset; display it in the application's Vietnam timezone.
  const source = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(value) ? `${value}+07:00` : value;
  const date = new Date(source);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function normalizeNotifications(value) {
  if (!Array.isArray(value)) throw new Error("Danh sách thông báo không hợp lệ.");
  const seen = new Set();
  return value.filter((item) => item && /^\d+$/.test(String(item.notificationId)) && !seen.has(String(item.notificationId)) && seen.add(String(item.notificationId)))
    .map((item) => ({ id: String(item.notificationId), title: typeof item.title === "string" && item.title.trim() ? item.title : "Thông báo lịch thi đấu",
      message: typeof item.message === "string" ? item.message : "", createdAt: typeof item.createdAt === "string" ? item.createdAt : "",
      read: item.read === true || item.isRead === true }))
    .sort((a, b) => (notificationDate(b.createdAt)?.getTime() || 0) - (notificationDate(a.createdAt)?.getTime() || 0));
}

export function notificationTime(value) {
  const date = notificationDate(value);
  return date ? new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date) : "Chưa cập nhật thời gian";
}
