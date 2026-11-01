import { ORGANIZER_GAMES, BRACKET_FORMATS } from "@/constants/games";
import { canonicalGame } from "./tournaments";
import { pastDateError } from "./dates";

export function detailsValues(entry) {
  const details = entry?.details || {};
  return {
    name: entry?.name ?? details.name ?? "", startDate: entry?.startDate ?? details.startDate ?? "",
    endDate: entry?.endDate ?? details.endDate ?? "", venueAddress: entry?.venueAddress ?? details.venueAddress ?? "",
    venueLat: entry?.venueLat ?? details.venueLat ?? null, venueLon: entry?.venueLon ?? details.venueLon ?? null,
    contactType: String(entry?.contactType ?? details.contactType ?? "EMAIL").toUpperCase(),
    contact: entry?.contact ?? details.contact ?? "",
  };
}
export function detailsError(values, required = false) {
  if (!values.name.trim() || !values.startDate || !values.endDate || !values.contact.trim()) return required ? "Vui lòng điền đầy đủ thông tin." : "";
  if (!Number.isFinite(Date.parse(values.startDate)) || !Number.isFinite(Date.parse(values.endDate)) || new Date(values.endDate) <= new Date(values.startDate)) return "Thời gian kết thúc phải sau thời gian bắt đầu.";
  if (values.contactType === "EMAIL" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contact.trim())) return "Vui lòng nhập địa chỉ email hợp lệ.";
  return "";
}
export function cleanDetails(values, dateOptions) {
  const error = detailsError(values, true) || pastDateError(values, ["startDate", "endDate"], dateOptions);
  if (error) throw new Error(error);
  return { ...values, name: values.name.trim(), contact: values.contact.trim(), venueAddress: values.venueAddress.trim() };
}
export function registrationValues(entry) {
  return { registrationStartDate: entry?.regSettings?.registrationStartDate || "", registrationEndDate: entry?.regSettings?.registrationEndDate || "",
    feeType: "FREE", minTeamSize: 4, maxTeamSize: entry?.regSettings?.maxTeamSize ?? "", maxTeams: 16 };
}
export function registrationError(values, required = false) {
  if (!values.registrationStartDate || !values.registrationEndDate || String(values.maxTeamSize).trim() === "") return required ? "Vui lòng nhập đầy đủ thời gian đăng ký và số thành viên tối đa." : "";
  if (!Number.isFinite(Date.parse(values.registrationStartDate)) || !Number.isFinite(Date.parse(values.registrationEndDate)) || new Date(values.registrationEndDate) <= new Date(values.registrationStartDate)) return "Thời gian đóng đăng ký phải sau thời gian mở đăng ký.";
  const maximum = Number(values.maxTeamSize);
  if (!Number.isInteger(maximum)) return "Số thành viên tối đa mỗi đội phải là số nguyên từ 4 đến 20.";
  if (maximum < 4) return "Số thành viên tối đa mỗi đội phải lớn hơn hoặc bằng số thành viên tối thiểu (4).";
  if (maximum > 20) return "Số thành viên tối đa mỗi đội không được vượt quá 20.";
  return "";
}
export function cleanRegistration(values, dateOptions) {
  const error = registrationError(values, true) || pastDateError(values, ["registrationStartDate", "registrationEndDate"], dateOptions);
  if (error) throw new Error(error);
  return { ...values, feeType: "FREE", minTeamSize: 4, maxTeamSize: Number(values.maxTeamSize), maxTeams: 16 };
}
export function gameValues(entry) {
  return { game: canonicalGame(entry?.gameInfo?.game || entry?.game || ""), stageType: "SINGLE_STAGE", format: entry?.gameInfo?.format || entry?.format || "SINGLE_ELIMINATION" };
}
export function cleanGame(values) {
  if (!ORGANIZER_GAMES.some((game) => game.id === values.game)) throw new Error("Vui lòng chọn một tựa game trong hệ thống.");
  if (!BRACKET_FORMATS.some((format) => format.value === values.format)) throw new Error("Vui lòng chọn thể thức nhánh đấu hợp lệ.");
  return { game: values.game, stageType: "SINGLE_STAGE", format: values.format };
}
export function normalizeParticipants(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((team) => team && typeof team.name === "string" && Array.isArray(team.members))
    .map((team, index) => ({ ...team, id: team.id ?? "legacy-team-" + index, members: team.members.filter((member) => typeof member === "string") }));
}
export function makeParticipant(values) {
  const name = values.name.trim();
  const raw = values.members.trim();
  if (!name || !raw) throw new Error("Vui lòng nhập đầy đủ tên đội tuyển và danh sách thành viên.");
  const members = raw.split(/[\/,]+/).map((member) => member.trim()).filter(Boolean);
  if (!members.length) throw new Error("Vui lòng nhập ít nhất 1 thành viên.");
  return { id: "participant_" + crypto.randomUUID(), name, members };
}

export function applyTournamentPatch(entry, patch) {
  const original = detailsValues(entry);
  const direct = Object.fromEntries(Object.keys(original).filter((key) => Object.hasOwn(patch, key)).map((key) => [key, patch[key]]));
  const details = { ...original, ...patch.details, ...direct };
  return { ...entry, ...patch, ...details, id: entry.id, details: { ...entry.details, ...details, id: entry.id } };
}
