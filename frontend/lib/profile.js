export const EMPTY_PROFILE = {
  tagName: "", userCode: "", joinedDate: "", prefix: "", bio: "",
  displayPronouns: false, pronouns: "", country: "Việt Nam", city: "", zipCode: "",
  phone: "", displayCityMode: "Hiển thị thành phố", birthday: "", email: "", avatarUrl: "", bannerUrl: "",
};
export const COUNTRIES = ["Việt Nam", "Hoa Kỳ", "Hàn Quốc", "Nhật Bản", "Singapore", "Thái Lan", "Vương quốc Anh", "Úc"];

export function userCodeFor(tag) {
  let hash = 0;
  for (let index = 0; index < tag.length; index++) { hash = (hash << 5) - hash + tag.charCodeAt(index); hash |= 0; }
  return Math.abs(hash).toString(16).padStart(8, "0").slice(0, 8);
}
export function displayProfile(profile) {
  const result = profile ? { ...EMPTY_PROFILE, ...profile, tagName: profile.gamerTag || profile.tagName || profile.username || "" } : { ...EMPTY_PROFILE };
  if (result.country === "Vietnam") result.country = "Việt Nam";
  if (result.displayCityMode === "Hide city") result.displayCityMode = "Ẩn thành phố";
  if (result.displayCityMode === "Display city") result.displayCityMode = "Hiển thị thành phố";
  return result;
}
export function profileFromLogin(user, previous) {
  if (!user || typeof user !== "object" || !user.username) throw new Error("Thông tin đăng nhập trả về không hợp lệ.");
  const id = user.userId ?? user.id;
  const sameUser = previous && (id != null && String(previous.id) === String(id));
  return {
    ...EMPTY_PROFILE, ...(sameUser ? previous : {}),
    id, username: user.username, tagName: sameUser ? previous.gamerTag || previous.tagName || user.username : user.username,
    email: user.email || "", userCode: sameUser && previous.userCode ? previous.userCode : userCodeFor(user.username),
  };
}
export function maskEmail(email) {
  const [name, domain] = email.split("@");
  if (!domain) return "địa chỉ email của bạn";
  const dot = domain.lastIndexOf(".");
  return `${name.slice(0, 3)}**@****${dot >= 0 ? domain.slice(dot) : ""}`;
}
export function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).format(date);
}
export function dateRange(start, end) {
  return [formatDate(start), formatDate(end)].filter(Boolean).join(" – ") || "Chưa cập nhật lịch thi đấu";
}
