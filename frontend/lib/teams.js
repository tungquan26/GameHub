import { catalogGame } from "./games";
import { userKey } from "./identity";

const fold = (value) =>
  String(value || "")
    .trim()
    .toLocaleLowerCase("vi");
export const sameUser = (left, right) =>
  Boolean(fold(left)) && fold(left) === fold(right);
export const isLegacyTeam = (team) => !team?.captainKey;
export const isCaptain = (team, user) => (typeof user === "string"
  ? isLegacyTeam(team) && sameUser(team?.captain, user)
  : Boolean(userKey(user)) && team?.captainKey === userKey(user));
export const isMember = (team, user) => typeof user === "string"
  ? isLegacyTeam(team) && (isCaptain(team, user) || (team?.members || []).some((member) => sameUser(member, user)))
  : Boolean(userKey(user)) && (team?.captainKey === userKey(user) || Object.hasOwn(team?.memberIdentities || {}, userKey(user)));
export const hasRequest = (team, user) => typeof user === "string"
  ? isLegacyTeam(team) && (team?.pendingRequests || []).some((member) => sameUser(member, user))
  : Boolean(userKey(user)) && Object.hasOwn(team?.requestIdentities || {}, userKey(user));
export function isTeamFull(team, games) {
  const max = catalogGame(games, team.game)?.maxPlayers;
  return max > 0 && team.members.length >= max;
}
export function validateTeam(values, games) {
  if (!values.name.trim()) throw new Error("Vui lòng nhập Tên Đội Tuyển.");
  if (!values.game) throw new Error("Vui lòng chọn Tựa Game Thi Đấu Chính.");
  const game = catalogGame(games, values.game);
  if (!game) throw new Error("Vui lòng chọn một tựa game trong hệ thống.");
  return {
    name: values.name.trim(),
    game: game.name,
    recruiting: Boolean(values.recruiting),
    logo: values.logo || "",
  };
}

