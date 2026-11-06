import { SUPPORTED_GAMES } from "@/constants/games";
import { canonicalGame, getGame } from "./games";
import { userKey, userTag } from "./identity";

const fold = (value) =>
  String(value || "")
    .trim()
    .toLocaleLowerCase("vi");
export const sameUser = (left, right) =>
  Boolean(fold(left)) && fold(left) === fold(right);
export const isLegacyTeam = (team) => !team?.sample && !team?.captainKey;
export const isCaptain = (team, user) => !team?.sample && (typeof user === "string"
  ? isLegacyTeam(team) && sameUser(team?.captain, user)
  : Boolean(userKey(user)) && team?.captainKey === userKey(user));
export const isMember = (team, user) => typeof user === "string"
  ? isLegacyTeam(team) && (isCaptain(team, user) || (team?.members || []).some((member) => sameUser(member, user)))
  : Boolean(userKey(user)) && (team?.captainKey === userKey(user) || Object.hasOwn(team?.memberIdentities || {}, userKey(user)));
export const hasRequest = (team, user) => typeof user === "string"
  ? isLegacyTeam(team) && (team?.pendingRequests || []).some((member) => sameUser(member, user))
  : Boolean(userKey(user)) && Object.hasOwn(team?.requestIdentities || {}, userKey(user));
export const TEAM_GAMES = SUPPORTED_GAMES.map((game) => game.id);

const identities = (value) => value && typeof value === "object" && !Array.isArray(value)
  ? Object.fromEntries(Object.entries(value).filter(([key, name]) => key && typeof name === "string" && name.trim())) : {};

// Display names may repeat; removing one identity must remove only one occurrence.
function replaceName(names, before, after) {
  const result = [...(names || [])];
  const index = result.findIndex((name) => sameUser(name, before));
  if (index >= 0) {
    if (after === undefined) result.splice(index, 1);
    else result[index] = after;
  }
  return result;
}

export function normalizeTeams(value) {
  if (!Array.isArray(value)) return null;
  return value
    .filter(
      (team) =>
        team &&
        typeof team.name === "string" &&
        ["string", "number"].includes(typeof team.id),
    )
    .map((team) => ({
      ...team,
      game: canonicalGame(team.game),
      captain: typeof team.captain === "string" ? team.captain : "",
      captainKey: typeof team.captainKey === "string" ? team.captainKey : "",
      memberIdentities: identities(team.memberIdentities),
      requestIdentities: identities(team.requestIdentities),
      members: Array.isArray(team.members)
        ? team.members.filter((name) => typeof name === "string")
        : [],
      pendingRequests: Array.isArray(team.pendingRequests)
        ? team.pendingRequests.filter((name) => typeof name === "string")
        : [],
      recruiting: Boolean(team.recruiting),
      logo: typeof team.logo === "string" ? team.logo : "",
    }));
}

export function validateTeam(values) {
  if (!values.name.trim()) throw new Error("Vui lòng nhập Tên Đội Tuyển.");
  if (!values.game) throw new Error("Vui lòng chọn Tựa Game Thi Đấu Chính.");
  const game = getGame(values.game);
  if (!game) throw new Error(`Vui lòng chọn một trong ${SUPPORTED_GAMES.length} tựa game hiện được hỗ trợ.`);
  return {
    name: values.name.trim(),
    game: game.id,
    recruiting: Boolean(values.recruiting),
    logo: values.logo || "",
  };
}

export function renameTeamMember(teams, before, after, user) {
  if (!teams || !before || !after || before === after) return teams;
  const rename = (name) => (sameUser(name, before) ? after : name);
  const key = userKey(user);
  return teams.map((team) => {
    if (user !== undefined) {
      if (!key) return team;
      const updated = { ...team };
      if (team.captainKey === key) updated.captain = after;
      if (Object.hasOwn(team.memberIdentities || {}, key)) {
        updated.members = replaceName(team.members, team.memberIdentities[key], after);
        updated.memberIdentities = { ...team.memberIdentities, [key]: after };
      }
      if (Object.hasOwn(team.requestIdentities || {}, key)) {
        updated.pendingRequests = replaceName(team.pendingRequests, team.requestIdentities[key], after);
        updated.requestIdentities = { ...team.requestIdentities, [key]: after };
      }
      return updated;
    }
    if (!isLegacyTeam(team)) return team;
    return { ...team, captain: rename(team.captain), members: (team.members || []).map(rename), pendingRequests: (team.pendingRequests || []).map(rename) };
  });
}

export function applyTeamAction(teams, actor, action) {
  const legacyActor = typeof actor === "string";
  const key = userKey(actor);
  const tag = legacyActor ? actor.trim() : userTag(actor).trim();
  if (!tag || (!legacyActor && !key)) throw new Error("Không tìm thấy hồ sơ người dùng.");
  if (action.type === "create") {
    const values = validateTeam(action.values);
    return [
      {
        ...values,
        id: action.id,
        captain: tag,
        ...(key ? { captainKey: key, memberIdentities: { [key]: tag }, requestIdentities: {} } : {}),
        members: [tag],
        pendingRequests: [],
      },
      ...teams,
    ];
  }
  const team = teams.find((entry) => String(entry.id) === String(action.id));
  if (!team) throw new Error("Đội tuyển không còn tồn tại.");
  if (team.sample || (!legacyActor && isLegacyTeam(team))) throw new Error("Đội tuyển cũ hoặc đội mẫu chỉ được xem.");
  if (legacyActor && !isLegacyTeam(team)) throw new Error("Vui lòng đăng nhập để thao tác đội tuyển.");
  const captainAction = ["edit", "dissolve", "accept", "reject"].includes(
    action.type,
  );
  if (captainAction && !isCaptain(team, actor))
    throw new Error("Chỉ đội trưởng được thực hiện thao tác này.");
  if (action.type === "dissolve")
    return teams.filter((entry) => entry !== team);
  let updated = {
    ...team,
    members: [...(team.members || [])],
    pendingRequests: [...(team.pendingRequests || [])],
    ...(!legacyActor ? { memberIdentities: { ...team.memberIdentities }, requestIdentities: { ...team.requestIdentities } } : {}),
  };
  switch (action.type) {
    case "edit":
      updated = { ...updated, ...validateTeam(action.values) };
      break;
    case "join":
      if (isMember(team, actor))
        throw new Error("Bạn đã là thành viên của đội.");
      if (!team.recruiting) throw new Error("Đội đã đủ người.");
      if (!hasRequest(team, actor)) {
        updated.pendingRequests.push(tag);
        if (key) updated.requestIdentities[key] = tag;
      }
      break;
    case "cancel":
      if (legacyActor) updated.pendingRequests = updated.pendingRequests.filter((name) => !sameUser(name, tag));
      else if (hasRequest(team, actor)) {
        updated.pendingRequests = replaceName(updated.pendingRequests, updated.requestIdentities[key]);
        delete updated.requestIdentities[key];
      }
      break;
    case "accept":
    case "reject": {
      const applicantKey = action.applicantKey;
      const applicant = legacyActor ? action.applicant : updated.requestIdentities[applicantKey];
      if (legacyActor ? !hasRequest(team, applicant) : !applicantKey || !Object.hasOwn(updated.requestIdentities, applicantKey) || !updated.pendingRequests.some((name) => sameUser(name, applicant)))
        throw new Error("Yêu cầu gia nhập không còn tồn tại.");
      updated.pendingRequests = legacyActor ? updated.pendingRequests.filter((name) => !sameUser(name, applicant)) : replaceName(updated.pendingRequests, applicant);
      if (!legacyActor) delete updated.requestIdentities[applicantKey];
      const alreadyMember = legacyActor ? isMember(team, applicant) : team.captainKey === applicantKey || Object.hasOwn(updated.memberIdentities, applicantKey);
      if (action.type === "accept" && !alreadyMember) {
        updated.members.push(applicant);
        if (!legacyActor) updated.memberIdentities[applicantKey] = applicant;
      }
      break;
    }
    case "leave":
      if (isCaptain(team, actor))
        throw new Error("Đội trưởng cần giải tán đội thay vì rời đội.");
      if (!isMember(team, actor))
        throw new Error("Bạn không thuộc đội tuyển này.");
      if (legacyActor) updated.members = updated.members.filter((name) => !sameUser(name, tag));
      else {
        updated.members = replaceName(updated.members, updated.memberIdentities[key]);
        delete updated.memberIdentities[key];
      }
      break;
    default:
      throw new Error("Thao tác đội tuyển không hợp lệ.");
  }
  return teams.map((entry) => (entry === team ? updated : entry));
}

