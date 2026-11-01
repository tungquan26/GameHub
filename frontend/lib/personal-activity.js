import { TOURNAMENT_SAMPLES } from "@/constants/tournament-catalog";
import { allMatches, isGeneratedBracketTeam, validBracket } from "./bracket";
import { getGame } from "./games";
import { matchesIdentity, userKey } from "./identity";
import { isCaptain, isLegacyTeam, isMember, sameUser } from "./teams";
import { registrationError, registrationValues } from "./tournament-settings";
import { buildUserEvents, isLegacyTournament, isOwnTournament, normalizeTournament, uniqueTournaments } from "./tournaments";
import { tournamentKey, tournamentPath } from "./public-tournament";

export const isActivePersonalTournament = (entry) => !["completed", "cancelled"].includes(entry.status);
export const personalEventsPath = (role = "") => ({ pathname: "/events", search: role ? new URLSearchParams({ role }).toString() : "" });
export function personalTeamPath(team) {
  return { pathname: "/community", search: new URLSearchParams({ action: "view-team", team: team.id }).toString(), hash: "#myTeamsSection" };
}

export function personalTeams(teams, user) {
  return (teams || []).filter((team) => !isLegacyTeam(team) && isMember(team, user));
}

export function pendingTeamRequests(team) {
  return Object.entries(team.requestIdentities || {}).filter(([, name]) => typeof name === "string" && name.trim() && (team.pendingRequests || []).some((pending) => sameUser(pending, name)));
}

function upcomingMatches(tournaments, teams, brackets, user, now) {
  const teamIds = new Set(teams.map((team) => String(team.id)));
  const belongsToUser = (slot, tournament) => {
    if (!slot || isGeneratedBracketTeam(slot, tournament.tournamentTeams)) return false;
    const participant = (Array.isArray(tournament.tournamentTeams) ? tournament.tournamentTeams : []).find((entry) => String(entry.id) === String(slot.id));
    return teamIds.has(String(slot.id)) || isMember(slot, user) || Boolean(participant && isMember(participant, user))
      || matchesIdentity(slot.userKey, slot.userId, user) || Boolean(participant && matchesIdentity(participant.userKey, participant.userId, user));
  };
  const result = [];
  for (const tournament of tournaments) {
    if (isLegacyTournament(tournament) || !isActivePersonalTournament(tournament)) continue;
    const bracket = brackets?.[tournamentKey(tournament)];
    if (!validBracket(bracket)) continue;
    for (const match of allMatches(bracket)) {
      const time = Date.parse(match.scheduledTime);
      if (match.status !== "SCHEDULED" || match.result || !Number.isFinite(time) || time < now.getTime()) continue;
      if (!match.teamA || !match.teamB || [match.teamA, match.teamB].some((slot) => isGeneratedBracketTeam(slot, tournament.tournamentTeams))) continue;
      if (!belongsToUser(match.teamA, tournament) && !belongsToUser(match.teamB, tournament)) continue;
      result.push({ key: `${tournamentKey(tournament)}:${match.matchId}`, tournament, match, time,
        to: tournamentPath("/tournament/schedule", tournament, { publicView: !isOwnTournament(tournament, user), hash: `#match-${encodeURIComponent(match.matchId)}` }) });
    }
  }
  return result.sort((first, second) => first.time - second.time);
}

export function buildPersonalActivity({ tournaments = [], registeredTournaments = [], teams = [], brackets = {}, publicTournament = null }, user, now = new Date()) {
  const events = buildUserEvents(tournaments, registeredTournaments, TOURNAMENT_SAMPLES, user);
  const organized = events.filter((entry) => entry.role === "Organizer");
  const participating = events.filter((entry) => entry.role === "Player");
  const mine = personalTeams(teams, user);
  const tasks = [];
  for (const team of mine.filter((entry) => isCaptain(entry, user))) {
    const count = pendingTeamRequests(team).length;
    if (count) tasks.push({ key: `team:${team.id}`, title: `Duyệt ${count} yêu cầu vào đội`, description: team.name, to: personalTeamPath(team) });
  }
  for (const entry of organized.filter(isActivePersonalTournament)) {
    if (!getGame(entry.gameInfo?.game || entry.game)) tasks.push({ key: `game:${entry.id}`, title: "Chọn bộ môn thi đấu", description: entry.name, to: tournamentPath("/tournament/game-info", entry) });
    if (registrationError(registrationValues(entry), true)) tasks.push({ key: `registration:${entry.id}`, title: "Hoàn tất cài đặt đăng ký", description: entry.name, to: tournamentPath("/tournament/registration-settings", entry) });
  }
  const known = uniqueTournaments([...events, ...tournaments.map((entry) => normalizeTournament(entry, { user })), ...(publicTournament ? [normalizeTournament(publicTournament, { user })] : [])]);
  const active = events.filter(isActivePersonalTournament).sort((first, second) => {
    const priority = Number(second.status === "in_progress") - Number(first.status === "in_progress");
    const time = (entry) => Number.isFinite(Date.parse(entry.startDate)) ? Date.parse(entry.startDate) : Infinity;
    return priority || time(first) - time(second);
  });
  return { events, organized, participating, teams: mine, active, tasks,
    stats: { organized: organized.length, participating: participating.length, teams: mine.length },
    upcoming: userKey(user) ? upcomingMatches(known, mine, brackets, user, now) : [],
  };
}
