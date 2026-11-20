import { isLegacyTeam, isMember, sameUser } from "./teams";
import { buildUserEvents } from "./tournaments";

export const personalEventsPath = (role = "") => ({ pathname: "/events", search: role ? new URLSearchParams({ role }).toString() : "" });

export function personalTeams(teams, user) {
  return (teams || []).filter((team) => !isLegacyTeam(team) && isMember(team, user));
}

export function pendingTeamRequests(team) {
  return Object.entries(team.requestIdentities || {}).filter(([, name]) => typeof name === "string" && name.trim() && (team.pendingRequests || []).some((pending) => sameUser(pending, name)));
}

export function buildPersonalActivity({ tournaments = [], registeredTournaments = [], teams = [] }, user) {
  const events = buildUserEvents(tournaments, registeredTournaments, user);
  const organized = events.filter((entry) => entry.role === "Organizer");
  const participating = events.filter((entry) => entry.role === "Player");
  const mine = personalTeams(teams, user);
  return { events, organized, participating, teams: mine, stats: { organized: organized.length, participating: participating.length } };
}
