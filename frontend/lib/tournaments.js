import { canonicalGame, gameDisplay, gameImage, isManagedGameArtwork, resolveGameArtwork } from "./games";
import { dateRange } from "./profile";
import { parseVietnamDateTime } from "./dates";
import logo from "@/assets/logo.png";
import { matchesIdentity } from "./identity";

export const STATUS_FILTERS = [
  { value: "open_registration", label: "Đang mở đăng ký" },
  { value: "upcoming", label: "Sắp diễn ra" },
  { value: "in_progress", label: "Đang diễn ra" },
  { value: "completed", label: "Đã kết thúc" },
  { value: "cancelled", label: "Đã hủy" },
];
export const DATE_FILTERS = [
  { value: "next_7_days", label: "7 ngày tới" }, { value: "next_month", label: "Tháng tới" },
  { value: "next_3_months", label: "3 tháng tới" }, { value: "next_6_months", label: "6 tháng tới" },
  { value: "past_7_days", label: "7 ngày qua" }, { value: "custom", label: "Tùy chọn ngày" },
];
export const EMPTY_FILTERS = { statuses: [], games: [], dateRanges: [], from: "", to: "" };
export const REGISTRATION_STATUS_LABELS = {
  OPEN_REGISTRATION: "Đang mở đăng ký",
  REGISTRATION_NOT_STARTED: "Chưa mở đăng ký",
  REGISTRATION_CLOSED: "Đã đóng đăng ký",
  IN_PROGRESS: "Đang diễn ra",
  COMPLETED: "Đã kết thúc",
  CANCELLED: "Đã hủy",
};
const FORMAT_LABELS = { SINGLE_ELIMINATION: "Loại trực tiếp đơn", DOUBLE_ELIMINATION: "Loại trực tiếp kép", ROUND_ROBIN: "Vòng tròn tính điểm", SWISS: "Hệ Thụy Sĩ" };
export const lower = (value) => String(value || "").trim().toLocaleLowerCase("vi");

export { canonicalGame } from "./games";
export function resolveTournamentImage(value, game) {
  if (isManagedGameArtwork(value)) return resolveGameArtwork(value, game) || logo;
  if (value && !String(value).startsWith("/images/")) return value;
  return gameImage(game) || logo;
}
export function isOwnTournament(entry, user) {
  return matchesIdentity(entry.ownerKey, entry.ownerId ?? entry.organizer?.userId ?? entry.organizer?.id ?? entry.organizerId, user);
}
const hasTournamentOwner = (entry) => Boolean(entry.ownerKey || (entry.ownerId ?? entry.organizer?.userId ?? entry.organizer?.id ?? entry.organizerId) != null);
export const isLegacyTournament = (entry) => !hasTournamentOwner(entry) && (entry.source === "local" || Boolean(entry.details) || String(entry.id).startsWith("tourney_") || entry.id === "legacy-tournament");
export const isUserRegistration = (entry, user) => matchesIdentity(entry.registrantKey, entry.registrantId, user);
export function normalizeTournament(entry, { user = null, player = false } = {}) {
  const details = entry.details || {};
  const game = canonicalGame(entry.gameInfo?.game || entry.game || "");
  const raw = lower(entry.status);
  const status = ["in_progress", "ongoing"].includes(raw) ? "in_progress" : ["completed", "finished"].includes(raw) ? "completed" : raw === "cancelled" ? "cancelled" : "upcoming";
  const registration = entry.registrationState || (["closed", "registration_closed"].includes(raw) ? "closed" : raw === "closing" ? "closing" : "open");
  const role = isOwnTournament(entry, user) ? "Organizer"
    : player && isUserRegistration(entry, user) ? "Player" : null;
  const startDate = entry.startDate || details.startDate || "";
  const endDate = entry.endDate || details.endDate || "";
  const format = entry.gameInfo?.format || entry.format;
  const displayFormat = FORMAT_LABELS[format] || [entry.gameDisplay, entry.game].find((value) => typeof value === "string" && value.includes("·"))?.split("·").slice(1).join(" · ").trim() || "";
  return {
    ...entry, id: entry.id ?? entry.tournamentId ?? entry.name,
    name: entry.name || details.name || "Giải đấu chưa đặt tên", game, status, registrationState: registration, role,
    gameDisplay: gameDisplay(game, displayFormat),
    startDate, endDate, dateText: entry.dateLabel || entry.date || dateRange(startDate, endDate),
    location: entry.venueAddress || details.venueAddress || entry.location || "Trực tuyến",
    attendees: entry.attendees ?? (Array.isArray(entry.registrations) ? entry.registrations.length : 0),
    image: resolveTournamentImage(entry.bannerImg || entry.profileImg || entry.image, game),
  };
}
export function uniqueTournaments(items) {
  const ids = new Set();
  return items.filter((item) => {
    const id = item.storeId ?? item.id;
    if (id == null) return true;
    const key = String(id);
    if (ids.has(key)) return false;
    ids.add(key); return true;
  });
}
export function buildCatalog(tournaments, user) {
  return uniqueTournaments(tournaments.map((entry) => normalizeTournament(entry, { user })));
}
export function buildUserEvents(tournaments, registered, user) {
  return uniqueTournaments([
    ...tournaments.filter((item) => isOwnTournament(item, user)).map((entry) => normalizeTournament(entry, { user })),
    ...registered.filter((item) => isUserRegistration(item, user)).map((entry) => {
      const stored = tournaments.find((item) => String(item.id) === String(entry.storeId ?? entry.id));
      return normalizeTournament({ ...entry, ...stored, registrantKey: entry.registrantKey, registrantId: entry.registrantId }, { user, player: true });
    }),
  ]);
}
function dayNumber(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return NaN;
  const timestamp = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Date(timestamp).toISOString().slice(0, 10) === match[0] ? timestamp / 86400000 : NaN;
}
function todayNumber(now) {
  const parts = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }).formatToParts(now);
  const part = (type) => parts.find((entry) => entry.type === type).value;
  return dayNumber(`${part("year")}-${part("month")}-${part("day")}`);
}
function matchesDates(item, filters, now) {
  if (!filters.dateRanges.length) return true;
  const day = dayNumber(item.startDate);
  if (Number.isNaN(day)) return false;
  const diff = day - todayNumber(now);
  return filters.dateRanges.some((range) => {
    if (range === "custom") return (!filters.from || day >= dayNumber(filters.from)) && (!filters.to || day <= dayNumber(filters.to));
    if (range === "past_7_days") return diff >= -7 && diff <= 0;
    const limit = { next_7_days: 7, next_month: 31, next_3_months: 92, next_6_months: 185 }[range];
    return diff >= 0 && diff <= limit;
  });
}
export function filterTournaments(items, keyword, filters = EMPTY_FILTERS, now = new Date()) {
  const search = lower(keyword);
  return items.filter((item) => (!search || lower(item.name).includes(search) || lower(item.game).includes(search) || lower(item.gameDisplay).includes(search))
    && (!filters.statuses.length || filters.statuses.some((status) => matchesTournamentStatus(item, status, now)))
    && (!filters.games.length || filters.games.map(canonicalGame).includes(item.game))
    && matchesDates(item, filters, now));
}

export function registrationStatus(entry, now = new Date()) {
  const status = lower(entry.status); const badge = lower(entry.badgeLabel);
  if (status === "cancelled") return "CANCELLED";
  if (["completed", "finished"].includes(status) || ["completed", "đã kết thúc"].includes(badge)) return "COMPLETED";
  const finalRound = entry.bracket?.rounds?.at(-1);
  const final = finalRound?.matches?.length === 1 ? finalRound.matches[0] : null;
  const tournamentEnd = parseVietnamDateTime(entry.endDate || entry.details?.endDate);
  if (now.getTime() >= tournamentEnd || (entry.bracket?.format === "SINGLE_ELIMINATION"
    && final?.status === "COMPLETED" && final.result?.winner)) return "COMPLETED";
  const tournamentStart = parseVietnamDateTime(entry.startDate || entry.details?.startDate);
  if (now.getTime() >= tournamentStart) return "IN_PROGRESS";
  if (["in_progress", "ongoing"].includes(status) || ["in progress", "đang diễn ra"].includes(badge)) return "IN_PROGRESS";
  if (["closed", "registration_closed"].includes(status) || entry.registrationState === "closed" || ["registration closed", "đã đóng đăng ký"].includes(badge)) return "REGISTRATION_CLOSED";
  if (["upcoming", "sắp diễn ra"].includes(badge)) return "REGISTRATION_NOT_STARTED";
  const start = parseVietnamDateTime(entry.regSettings?.registrationStartDate);
  const end = parseVietnamDateTime(entry.regSettings?.registrationEndDate);
  if (Number.isFinite(start) && now.getTime() < start) return "REGISTRATION_NOT_STARTED";
  if (Number.isFinite(end) && now.getTime() >= end) return "REGISTRATION_CLOSED";
  return "OPEN_REGISTRATION";
}

function matchesTournamentStatus(entry, status, now) {
  const current = registrationStatus(entry, now);
  if (status === "open_registration") return !isLegacyTournament(entry) && current === "OPEN_REGISTRATION";
  if (status === "upcoming") return ["OPEN_REGISTRATION", "REGISTRATION_CLOSED", "REGISTRATION_NOT_STARTED"].includes(current);
  return lower(current) === status;
}

export function landingHighlights(catalog, now = new Date()) {
  return {
    open: catalog.filter((entry) => matchesTournamentStatus(entry, "open_registration", now)).slice(0, 4),
    ongoing: catalog.filter((entry) => matchesTournamentStatus(entry, "in_progress", now)).slice(0, 4),
  };
}
