import { clone } from "./homepage";
import { pastDateError } from "./dates";

export const allMatches = (bracket) => bracket?.rounds?.flatMap((round) => round.matches) || [];
export const findMatch = (bracket, id) => allMatches(bracket).find((match) => String(match.matchId) === String(id));
function teamsForBracket(teams, size) {
  return (Array.isArray(teams) ? teams : []).filter((team) => team && typeof team.name === "string" && team.name.trim())
    .slice(0, size).map((team, index) => ({ id: team.id ?? "team-" + index, name: team.name.trim() }));
}
function scheduledTime(start, dayOffset, hourOffset) {
  const date = new Date(start);
  if (!Number.isFinite(date.getTime())) return "";
  date.setDate(date.getDate() + dayOffset); date.setHours(14 + hourOffset, 0, 0, 0);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
export function generateBracket(entry, size = 8, shuffle = false, random = Math.random) {
  if (![4, 8].includes(size)) throw new Error("Quy mô nhánh đấu phải là 4 hoặc 8 đội.");
  const teams = teamsForBracket(entry.tournamentTeams, size);
  if (shuffle) for (let index = teams.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [teams[index], teams[target]] = [teams[target], teams[index]];
  }
  while (teams.length < size) teams.push(null);
  const totalRounds = Math.log2(size);
  let counter = 1;
  const rounds = Array.from({ length: totalRounds }, (_, roundIndex) => {
    const roundNumber = roundIndex + 1;
    const name = roundNumber === totalRounds ? "Chung kết" : roundNumber === totalRounds - 1 ? "Bán kết" : "Tứ kết";
    return { roundId: roundNumber, roundNumber, name, matches: Array.from({ length: size / 2 ** roundNumber }, (_, index) => ({
      matchId: roundNumber * 100 + index + 1, matchNumber: counter++, roundNumber, roundName: name, matchOrder: index,
      teamA: roundIndex === 0 ? teams[index * 2] : null, teamB: roundIndex === 0 ? teams[index * 2 + 1] : null,
      scheduledTime: scheduledTime(entry.startDate || entry.details?.startDate, roundIndex, index * 2), status: "SCHEDULED", result: null,
      nextMatchId: roundNumber < totalRounds ? (roundNumber + 1) * 100 + Math.floor(index / 2) + 1 : null,
      nextMatchSlot: roundNumber < totalRounds ? index % 2 === 0 ? "A" : "B" : null,
    })) };
  });
  return { bracketId: "bracket_" + crypto.randomUUID(), tournamentName: entry.name, format: "SINGLE_ELIMINATION", bracketSize: size, usesSampleTeams: false, rounds };
}
export function validBracket(value) {
  if (!value || ![4, 8].includes(value.bracketSize) || !Array.isArray(value.rounds) || value.rounds.length !== Math.log2(value.bracketSize)) return false;
  const ids = new Set();
  return value.rounds.every((round, index) => round && Array.isArray(round.matches) && round.matches.length === value.bracketSize / 2 ** (index + 1)
    && round.matches.every((match) => {
      if (!match || match.matchId == null || ids.has(String(match.matchId))) return false;
      ids.add(String(match.matchId));
      return [match.teamA, match.teamB].every((team) => team == null || (team.id != null && typeof team.name === "string"))
        && (!match.result || (match.teamA && match.teamB && [match.result.scoreA, match.result.scoreB].every((score) => Number.isSafeInteger(score) && score >= 0) && match.result.scoreA !== match.result.scoreB));
    }));
}
export function bracketStats(bracket) {
  const matches = allMatches(bracket); const final = bracket?.rounds?.at(-1)?.matches?.[0];
  return { total: matches.length, completed: matches.filter((match) => match.status === "COMPLETED" && match.result).length,
    champion: final?.status === "COMPLETED" ? final.result?.winner || null : null };
}
function sameTeam(first, second) { return first == null && second == null || first && second && String(first.id) === String(second.id); }
function propagate(bracket, match, visited = new Set()) {
  if (!match.nextMatchId || visited.has(String(match.matchId))) return;
  visited.add(String(match.matchId));
  const next = findMatch(bracket, match.nextMatchId);
  if (!next || !["A", "B"].includes(match.nextMatchSlot)) return;
  const slot = "team" + match.nextMatchSlot;
  const winner = match.status === "COMPLETED" ? match.result?.winner || null : null;
  const changed = !sameTeam(next[slot], winner);
  next[slot] = winner;
  if (changed) {
    next.result = null; next.status = "SCHEDULED";
    propagate(bracket, next, visited);
  }
}
export function updateBracketMatch(bracket, matchId, values, timeOnly = false) {
  if (!validBracket(bracket)) throw new Error("Dữ liệu nhánh đấu không hợp lệ.");
  const updated = clone(bracket); const match = findMatch(updated, matchId);
  if (!match) throw new Error("Không tìm thấy trận đấu.");
  const time = String(values.scheduledTime || "").trim();
  if ((timeOnly && !time) || (time && !Number.isFinite(Date.parse(time)))) throw new Error("Vui lòng chọn ngày giờ thi đấu hợp lệ.");
  const dateError = pastDateError({ scheduledTime: time }, ["scheduledTime"], { original: match });
  if (dateError) throw new Error(dateError);
  if (time) match.scheduledTime = time;
  if (!timeOnly) {
    if (!match.teamA || !match.teamB) throw new Error("Không thể xác định đội thắng vì thông tin 2 đội chưa sẵn sàng.");
    const scores = [values.scoreA, values.scoreB];
    if (scores.some((score) => String(score).trim() === "" || !Number.isSafeInteger(Number(score)) || Number(score) < 0)) throw new Error("Điểm số phải là số nguyên không âm.");
    const [scoreA, scoreB] = scores.map(Number);
    if (scoreA === scoreB) throw new Error("Trận đấu theo thể thức loại trực tiếp không thể có kết quả hòa.");
    match.result = { scoreA, scoreB, winner: scoreA > scoreB ? match.teamA : match.teamB }; match.status = "COMPLETED";
    propagate(updated, match);
  }
  return updated;
}
export function formatMatchTime(value) {
  if (!value) return "Chưa xếp lịch";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date) : "Chưa xếp lịch";
}
