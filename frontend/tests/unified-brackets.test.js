import { describe, expect, it } from "vitest";
import { allMatches, bracketStats, findMatch, generateBracket, sanitizeBracket, teamsForBracket, updateBracketMatch, validBracket } from "@/lib/bracket";
import { loadState, parseState, STORE_KEY } from "@/lib/tourney-store";
import { tournamentKey } from "@/lib/public-tournament";

const participant = (id, extra = {}) => ({ id, name: `Team ${id}`, members: [], ...extra });
const cup = { id: 51, ownerId: 7, name: "Unified Cup", startDate: "2099-11-10T10:00" };
function oldBracket() {
  const teams = Array.from({ length: 8 }, (_, index) => participant(index + 1));
  teams[1] = participant("sample-team-0", { name: "Old generated team", sample: true });
  let bracket = generateBracket({ ...cup, tournamentTeams: teams }, 8);
  bracket.usesSampleTeams = true;
  for (const id of [101,102,103,104,201,202,301]) bracket = updateBracketMatch(bracket, id, { scoreA: 2, scoreB: 0 });
  return { bracket, participants: teams.filter((entry) => !entry.sample) };
}

describe("Nhánh đấu chỉ dùng đội đã thêm và TBD", () => {
  for (const size of [4,8]) {
    it.each([0,1,size-1,size])(`nhánh ${size} vị trí với %s đội không tự sinh đội hoặc tự đi tiếp`, (count) => {
      const teams = Array.from({ length: count }, (_, index) => participant(index + 1));
      const bracket = generateBracket({ ...cup, tournamentTeams: teams }, size, true, () => 0.25);
      const slots = bracket.rounds[0].matches.flatMap((match) => [match.teamA, match.teamB]);
      expect(validBracket(bracket)).toBe(true); expect(allMatches(bracket)).toHaveLength(size - 1);
      expect(slots.filter(Boolean).map((team) => team.id).sort()).toEqual(teams.map((team) => team.id).sort());
      expect(slots.filter((slot) => slot === null)).toHaveLength(size - count);
      expect(slots.slice(count)).toEqual(Array(size - count).fill(null));
      expect(allMatches(bracket).every((match) => match.result === null && match.status === "SCHEDULED")).toBe(true);
      expect(bracket.rounds.slice(1).flatMap((round) => round.matches).every((match) => !match.teamA && !match.teamB)).toBe(true);
      expect(bracket.usesSampleTeams).toBe(false);
    });
  }
  it("thiếu đội chỉ cho lưu giờ; không chấp nhận kết quả", () => {
    const bracket = generateBracket({ ...cup, tournamentTeams: [participant(1)] }, 4);
    expect(teamsForBracket([],4)).toEqual([null,null,null,null]);
    expect(() => updateBracketMatch(bracket,101,{scoreA:2,scoreB:0})).toThrow("chưa sẵn sàng");
    expect(findMatch(updateBracketMatch(bracket,101,{scheduledTime:"2099-11-11T15:00"},true),101).scheduledTime).toBe("2099-11-11T15:00");
  });
});

describe("Dọn đội tự sinh trong dữ liệu đã lưu", () => {
  it("xóa đội tự sinh và kết quả phụ thuộc, giữ nhánh độc lập/ID/giờ và không sửa đầu vào", () => {
    const { bracket, participants } = oldBracket(); const before = structuredClone(bracket);
    const cleaned = sanitizeBracket(bracket, participants);
    expect(findMatch(cleaned,101)).toMatchObject({ teamA: { id: 1 }, teamB: null, result: null, status: "SCHEDULED" });
    expect(findMatch(cleaned,201)).toMatchObject({ teamA: null, teamB: { id: 3 }, result: null });
    expect(findMatch(cleaned,301)).toMatchObject({ teamA: null, teamB: { id: 5 }, result: null });
    for (const id of [102,103,104,202]) expect(findMatch(cleaned,id)).toEqual(findMatch(before,id));
    expect(cleaned.bracketId).toBe(before.bracketId);
    expect(allMatches(cleaned).map(({matchId,scheduledTime})=>({matchId,scheduledTime}))).toEqual(allMatches(before).map(({matchId,scheduledTime})=>({matchId,scheduledTime})));
    expect(bracketStats(cleaned)).toMatchObject({ completed: 4, champion: null });
    expect(validBracket(cleaned)).toBe(true); expect(bracket).toEqual(before); expect(sanitizeBracket(cleaned,participants)).toBe(cleaned);
  });
  it("đối chiếu ID đội đã thêm, giữ đội có dấu nguồn cũ và đội thật trùng tên đội mặc định", () => {
    const team = participant("sample-team-0", { name: "BTP Esports", sample: true });
    const bracket = generateBracket({ ...cup,tournamentTeams:[team,participant(2),participant(3),participant(4)] },4);
    expect(sanitizeBracket(bracket,[team])).toBe(bracket);
    const renamed = generateBracket({ ...cup,tournamentTeams:[participant(1,{name:"BTP Esports"})] },4);
    expect(sanitizeBracket(renamed,[])).toBe(renamed);
  });
  it("cache hiện tại và dữ liệu nhận từ tab khác dùng cùng quy tắc", () => {
    const { bracket, participants } = oldBracket();
    const state = { version:1, tournaments:[{...cup,tournamentTeams:participants}], brackets:{[tournamentKey(cup)]:bracket} };
    localStorage.setItem(STORE_KEY,JSON.stringify(state));
    const loaded = loadState(localStorage,sessionStorage); const incoming = parseState(state);
    expect(loaded.brackets).toEqual(incoming.brackets);
    expect(findMatch(loaded.brackets[tournamentKey(cup)],101).teamB).toBeNull();
  });
  it("hydrate đội và bracket phiên cũ trước khi làm sạch; không mất đội đã được thêm", () => {
    const team = participant("sample-team-0",{sample:true});
    const bracket = generateBracket({...cup,tournamentTeams:[team]},4);
    localStorage.setItem(STORE_KEY,JSON.stringify({version:1,tournaments:[cup],activeTournamentId:cup.id}));
    sessionStorage.setItem("btp_tournament_teams",JSON.stringify([team]));
    sessionStorage.setItem("btp_tournament_brackets_v1",JSON.stringify({"unified cup":bracket}));
    expect(findMatch(loadState(localStorage,sessionStorage).brackets[tournamentKey(cup)],101).teamA).toMatchObject({id:team.id});
  });
  it("không làm mất dữ liệu bracket không hợp lệ và không tạo bracket để thay thế", () => {
    const broken = { custom: "preserve" }; expect(sanitizeBracket(broken)).toBe(broken);
    expect(parseState({version:1,tournaments:[],brackets:{unknown:broken}}).brackets.unknown).toEqual(broken);
  });
});
