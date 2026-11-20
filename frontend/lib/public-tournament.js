import { isLegacyTournament, isOwnTournament, isUserRegistration, lower, registrationStatus } from "./tournaments";

export function tournamentKey(entry) {
  const id = entry.storeId ?? entry.id;
  return `tournament:${id ?? lower(entry.name)}`;
}
function sameTournament(first, second) {
  if (!first || !second) return false;
  const firstId = first.storeId ?? first.id; const secondId = second.storeId ?? second.id;
  return firstId != null && secondId != null && tournamentKey(first) === tournamentKey(second);
}
export function resolvePublicTournament({ tournaments, activeTournament, publicTournament }, params = new URLSearchParams()) {
  const requestedId = params.get("id");
  if (params.get("sample") === "1") return null;
  if (requestedId) {
    const stored = tournaments.find((entry) => String(entry.id) === requestedId);
    if (stored) return stored;
    return publicTournament && String(publicTournament.storeId ?? publicTournament.id) === requestedId ? publicTournament : null;
  }
  if (!publicTournament) return activeTournament;
  const stored = tournaments.find((entry) => sameTournament(entry, publicTournament));
  return stored ? { ...publicTournament, ...stored } : publicTournament;
}
export function tournamentPath(pathname, entry, { publicView = false, hash = "" } = {}) {
  const params = new URLSearchParams();
  if (entry?.storeId != null || entry?.id != null) params.set("id", entry.storeId ?? entry.id);
  if (publicView) params.set("view", "public");
  return { pathname, search: params.toString(), hash };
}
export function tournamentAccess(entry, user, registered = [], now = new Date()) {
  const registeredPlayer = registered.some((item) => isUserRegistration(item, user) && sameTournament(item, entry));
  const organizer = isOwnTournament(entry, user);
  const legacy = isLegacyTournament(entry);
  const status = registrationStatus(entry, now);
  const blocked = { COMPLETED: "Đã kết thúc", IN_PROGRESS: "Đang diễn ra", CANCELLED: "Đã hủy" }[status];
  const label = legacy ? "Dữ liệu cũ · Chỉ xem" : blocked || (organizer ? "Quản lý giải đấu" : registeredPlayer ? "Đã đăng ký" : { REGISTRATION_CLOSED: "Đã đóng đăng ký", REGISTRATION_NOT_STARTED: "Chưa mở đăng ký" }[status]) || "Đăng ký tham gia";
  const canCancelRegistration = registeredPlayer && !organizer && !legacy && status === "OPEN_REGISTRATION";
  return { organizer, registeredPlayer, status, label, disabled: Boolean(legacy || blocked || (!organizer && (registeredPlayer || status !== "OPEN_REGISTRATION"))), canCancelRegistration, canSchedule: true };
}
export const PUBLIC_VIEW_TABS = ["teams", "standings", "rules"];

export function publicSectionPath(entry, section = "overview") {
  const path = tournamentPath(section === "schedule" ? "/tournament/schedule" : "/tournament/view", entry, { publicView: section === "schedule" });
  if (PUBLIC_VIEW_TABS.includes(section)) {
    const params = new URLSearchParams(path.search); params.set("tab", section); path.search = params.toString();
  }
  return path;
}
