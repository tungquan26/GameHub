import { isLegacyTournament, isOwnTournament, isUserRegistration, lower, normalizeTournament, registrationStatus } from "./tournaments";
import { findSample } from "@/constants/tournament-catalog";
import { userKey } from "./identity";
export { registrationStatus } from "./tournaments";

export function tournamentKey(entry) {
  const id = entry.storeId ?? entry.id;
  return `${entry.sample ? "sample" : "tournament"}:${entry.sample ? findSample(id)?.id ?? id ?? lower(entry.name) : id ?? lower(entry.name)}`;
}
export function sameTournament(first, second) {
  if (!first || !second) return false;
  const firstId = first.storeId ?? first.id; const secondId = second.storeId ?? second.id;
  return firstId != null && secondId != null && tournamentKey(first) === tournamentKey(second);
}
export function resolvePublicTournament({ tournaments, activeTournament, publicTournament }, params = new URLSearchParams()) {
  const requestedId = params.get("id");
  if (requestedId) {
    if (params.get("sample") === "1") {
      const sample = findSample(requestedId);
      if (sample) return normalizeTournament(sample, { sample: true });
      return publicTournament?.sample && String(publicTournament.id) === requestedId && (!params.get("name") || lower(params.get("name")) === lower(publicTournament.name)) ? publicTournament : null;
    }
    const stored = tournaments.find((entry) => String(entry.id) === requestedId);
    if (stored) return stored;
    return publicTournament && !publicTournament.sample && String(publicTournament.storeId ?? publicTournament.id) === requestedId ? publicTournament : null;
  }
  if (!publicTournament) return activeTournament;
  if (publicTournament.sample) return findSample(publicTournament.id) || publicTournament;
  const stored = tournaments.find((entry) => sameTournament(entry, publicTournament));
  return stored ? { ...publicTournament, ...stored } : publicTournament;
}
export function tournamentPath(pathname, entry, { publicView = false, hash = "" } = {}) {
  const params = new URLSearchParams();
  if (entry?.storeId != null || entry?.id != null) params.set("id", entry.storeId ?? entry.id);
  if (entry?.sample) { params.set("sample", "1"); params.set("name", entry.name || ""); }
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
export function publicSectionPath(entry, section = "overview") {
  const path = tournamentPath(section === "schedule" ? "/tournament/schedule" : "/tournament/view", entry, { publicView: section === "schedule" });
  if (["teams", "rules"].includes(section)) {
    const params = new URLSearchParams(path.search); params.set("tab", section); path.search = params.toString();
  }
  return path;
}
export function registerForTournament(registered, entry, user, now = new Date()) {
  if (!userKey(user)) throw new Error("Vui lòng đăng nhập để đăng ký tham gia giải đấu.");
  const access = tournamentAccess(entry, user, registered, now);
  if (access.registeredPlayer) return registered;
  if (isLegacyTournament(entry) || access.organizer || access.status !== "OPEN_REGISTRATION") throw new Error("Giải đấu hiện không nhận đăng ký tham gia.");
  const tournament = normalizeTournament({ ...entry, registrantKey: userKey(user), registrantId: user.id ?? null }, { sample: Boolean(entry.sample), player: true, user });
  return [{ ...tournament, role: "Player", attendees: Number(entry.attendees || 0) + 1 }, ...registered];
}

export function unregisterFromTournament(registered, entry, user, now = new Date()) {
  if (!userKey(user)) throw new Error("Vui lòng đăng nhập để hủy đăng ký giải đấu.");
  const access = tournamentAccess(entry, user, registered, now);
  if (!access.registeredPlayer) return registered;
  if (!access.canCancelRegistration) throw new Error("Chỉ có thể hủy đăng ký khi thời hạn đăng ký còn mở.");
  return registered.filter((item) => !(isUserRegistration(item, user) && sameTournament(item, entry)));
}
