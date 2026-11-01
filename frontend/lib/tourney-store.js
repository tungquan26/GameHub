import { normalizeTeams } from "./teams";
import { normalizeParticipants } from "./tournament-settings";
import { tournamentKey } from "./public-tournament";
import { sanitizeBracket, validBracket } from "./bracket";
import { findSample } from "@/constants/tournament-catalog";

export const STORE_KEY = "btp_react_state_v1";
const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const hasId = (value) => isRecord(value) && ["string", "number"].includes(typeof value.id);

export function readJson(storage, key, fallback = null) {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function readText(storage, key) {
  try { return storage?.getItem(key) || ""; }
  catch { return ""; }
}

// Chỉ lưu dữ liệu hiển thị; không đưa mật khẩu/token từ phản hồi login vào LocalStorage.
export function profileData(profile) {
  if (!isRecord(profile)) return null;
  const fields = [
    "id", "username", "tagName", "gamerTag", "userCode", "joinedDate", "prefix", "bio",
    "displayPronouns", "pronouns", "country", "city", "zipCode", "phone",
    "displayCityMode", "birthday", "email", "avatarUrl", "bannerUrl",
  ];
  return Object.fromEntries(fields.filter((key) => Object.hasOwn(profile, key)).map((key) => [key, profile[key]]));
}
function cleanStoredBrackets(brackets, entries) {
  const known = entries.filter((entry) => entry && typeof entry === "object");
  return Object.fromEntries(Object.entries(brackets).map(([key, bracket]) => {
    const sample = key.startsWith("sample:") ? findSample(key.split(":")[1]) : null;
    const matches = known.filter((item) => tournamentKey(item) === key || sample && item.sample && tournamentKey(item) === tournamentKey(sample));
    const entry = matches.find((item) => Array.isArray(item.tournamentTeams)) || matches[0] || sample;
    return [key, sanitizeBracket(bracket, normalizeParticipants(entry?.tournamentTeams))];
  }));
}
export function parseState(value, { cleanBrackets = true } = {}) {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.tournaments)) return null;
  const state = {
    version: 1,
    profile: profileData(value.profile),
    tournaments: value.tournaments.filter(hasId),
    activeTournamentId: ["string", "number"].includes(typeof value.activeTournamentId) ? value.activeTournamentId : null,
    publicTournament: isRecord(value.publicTournament) ? value.publicTournament : null,
    teams: normalizeTeams(value.teams),
    registeredTournaments: Array.isArray(value.registeredTournaments) ? value.registeredTournaments.filter(isRecord) : [],
    brackets: isRecord(value.brackets) ? value.brackets : {},
  };
  if (cleanBrackets) state.brackets = cleanStoredBrackets(state.brackets, [...state.tournaments, state.publicTournament, ...state.registeredTournaments]);
  return state;
}
export function loadState(local, session) {
  const rawCache = readJson(local, STORE_KEY);
  const cached = parseState(rawCache, { cleanBrackets: false });
  const legacyTeams = normalizeTeams(readJson(session, "btp_community_teams_v5"));
  const legacyRegistered = readJson(session, "btp_registered_tournaments", []);
  const registeredTournaments = Array.isArray(legacyRegistered) ? legacyRegistered.filter(isRecord) : [];
  const participants = normalizeParticipants(readJson(session, "btp_tournament_teams", []));
  const legacyBrackets = readJson(session, "btp_tournament_brackets_v1", {});
  function hydrateBrackets(saved, entries) {
    const brackets = { ...saved };
    for (const [key, bracket] of Object.entries(saved)) {
      const sample = findSample(key.match(/^sample:([^:]+):/)?.[1]);
      if (sample && !Object.hasOwn(brackets, tournamentKey(sample)) && validBracket(bracket)) brackets[tournamentKey(sample)] = bracket;
    }
    if (!isRecord(legacyBrackets)) return cleanStoredBrackets(brackets, entries);
    for (const entry of entries.filter(Boolean)) {
      const oldKey = entry.sample ? `sample:${entry.id ?? ""}:${String(entry.name || "").trim().toLocaleLowerCase("vi")}` : null;
      if (oldKey && !Object.hasOwn(brackets, tournamentKey(entry)) && validBracket(saved[oldKey])) brackets[tournamentKey(entry)] = saved[oldKey];
      const old = legacyBrackets[String(entry.name || entry.details?.name || "").trim().toLocaleLowerCase("vi")];
      if (!Object.hasOwn(brackets, tournamentKey(entry)) && validBracket(old)) brackets[tournamentKey(entry)] = old;
    }
    return cleanStoredBrackets(brackets, entries);
  }
  const hydrateParticipants = (list, activeId) => list.map((entry) => String(entry.id) === String(activeId) && !Array.isArray(entry.tournamentTeams)
    ? { ...entry, tournamentTeams: participants } : entry);
  if (cached) {
    const hydrated = hydrateParticipants(cached.tournaments, cached.activeTournamentId);
    return {
    ...cached,
    teams: cached.teams ?? legacyTeams,
    registeredTournaments: Array.isArray(rawCache.registeredTournaments) ? cached.registeredTournaments : registeredTournaments,
    tournaments: hydrated,
    brackets: hydrateBrackets(cached.brackets, [...hydrated, cached.publicTournament, ...cached.registeredTournaments, ...registeredTournaments]),
    };
  }
  const legacyProfile = readJson(session, "btp_user_profile") || readJson(local, "btp_profile_data_v1");
  const storedList = readJson(session, "btp_created_tournaments", []);
  const tournaments = Array.isArray(storedList) ? storedList.filter(hasId).map((entry) => ({ ...entry, source: entry.source || "local" })) : [];
  const details = readJson(session, "btp_tournament_data") || readJson(local, "btp_tournament_details_v1");
  let activeTournamentId = readText(session, "btp_active_tournament_id") || null;

  if (isRecord(details) && (details.name || details.tournamentName)) {
    const id = details.id || activeTournamentId || "legacy-tournament";
    activeTournamentId = id;
    const existing = tournaments.find((item) => String(item.id) === String(id));
    const snapshot = {
      ...existing, ...details, id,
      name: details.name || details.tournamentName,
      details,
      profileImg: readText(session, "btp_tournament_profile_img") || details.logoDataUrl || existing?.profileImg || "",
      bannerImg: readText(session, "btp_tournament_banner_img") || details.bannerDataUrl || existing?.bannerImg || "",
      rules: readText(session, "btp_tournament_rules") || existing?.rules || "",
      gameInfo: readJson(session, "btp_tournament_game_info", existing?.gameInfo || null),
      regSettings: readJson(session, "btp_tournament_reg_settings", existing?.regSettings || null),
      homepageLayout: readJson(session, "btp_tournament_homepage_layout_v2")
        || readJson(session, "btp_tournament_homepage_layout", existing?.homepageLayout || null),
      tournamentTeams: Array.isArray(existing?.tournamentTeams) ? existing.tournamentTeams : participants,
    };
    const index = tournaments.findIndex((item) => String(item.id) === String(id));
    if (index < 0) tournaments.unshift(snapshot);
    else tournaments[index] = snapshot;
  }
  const selected = readJson(session, "btp_selected_view_tournament");
  const hydrated = hydrateParticipants(tournaments, activeTournamentId);
  return {
    version: 1, profile: profileData(legacyProfile), tournaments: hydrated, activeTournamentId,
    publicTournament: isRecord(selected) ? selected : null, teams: legacyTeams, registeredTournaments,
    brackets: hydrateBrackets({}, [...hydrated, selected, ...registeredTournaments]),
  };
}
export function browserStorage(area) {
  try { return window[area]; }
  catch { return null; }
}
export function mergeTournaments(local, remote) {
  const merged = new Map(local.filter(hasId).map((item) => [String(item.id), item]));
  for (const item of remote.filter(hasId)) {
    merged.set(String(item.id), { ...merged.get(String(item.id)), ...item });
  }
  return [...merged.values()];
}
