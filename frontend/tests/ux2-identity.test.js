import { describe, expect, it } from "vitest";
import { buildCatalog, buildUserEvents, isOwnTournament, makeTournament } from "@/lib/tournaments";
import { registerForTournament, resolvePublicTournament, tournamentAccess, tournamentKey } from "@/lib/public-tournament";
import { applyTeamAction, hasRequest, isCaptain, isMember, renameTeamMember } from "@/lib/teams";
import { findSample, TOURNAMENT_SAMPLES } from "@/constants/tournament-catalog";

const alice = { id: 7, tagName: "Captain" };
const bob = { id: 8, tagName: "Captain" };
const cup = { id: 55, name: "Public Cup", status: "open" };

describe("UX-2: dữ liệu cá nhân dựa trên danh tính", () => {
  it("không cấp quyền từ source local, details, prefix ID, fixture role hoặc tên giống nhau", () => {
    for (const entry of [{ source: "local" }, { details: {} }, { id: "tourney_old" }, { role: "Organizer" }, { ownerId: 8 }, { ownerId: 7, sample: true }]) {
      expect(isOwnTournament(entry, alice)).toBe(false);
      expect(tournamentAccess(entry, alice).organizer).toBe(false);
    }
    expect(isOwnTournament({ organizer: { userId: 7 } }, alice)).toBe(true);
    expect(isOwnTournament({ ownerId: 7 }, null)).toBe(false);
  });

  it("tách dữ liệu thật, mẫu và các giải trùng tên theo ID", () => {
    const entries = buildCatalog([{ ...cup, id: 1 }, { ...cup, id: 2 }, { ...cup, id: 1 }], [{ ...cup, id: 1 }], alice);
    expect(entries).toHaveLength(3);
    expect(new Set(entries.map(tournamentKey)).size).toBe(3);
  });

  it("chỉ chủ tài khoản thấy giải tạo và đăng ký của mình; giữ hoạt động mẫu có chủ đích", () => {
    const created = makeTournament({ name: "New Cup", contact: "hello", startDate: "2026-11-01", endDate: "2026-11-02" }, alice);
    const registered = registerForTournament([], { ...findSample(1), sample: true }, alice);
    expect(buildUserEvents([created], registered, TOURNAMENT_SAMPLES, alice).map((entry) => entry.role)).toEqual(["Organizer", "Player"]);
    expect(buildUserEvents([created], registered, TOURNAMENT_SAMPLES, bob)).toEqual([]);
    expect(buildUserEvents([created], registered, TOURNAMENT_SAMPLES, null)).toEqual([]);
    expect(buildUserEvents([], [{ ...cup, role: "Player" }], TOURNAMENT_SAMPLES, alice)).toEqual([]);
  });

  it("đăng ký tách tài khoản, chặn khách và không nhận vai trò Player từ cache cũ", () => {
    const first = registerForTournament([], cup, alice);
    expect(registerForTournament(first, cup, alice)).toBe(first);
    const second = registerForTournament(first, cup, bob);
    expect(second).toHaveLength(2);
    expect(second.map((item) => item.registrantKey)).toEqual(["id:8", "id:7"]);
    expect(tournamentAccess({ ...cup, role: "Player" }, bob, first).registeredPlayer).toBe(false);
    expect(() => registerForTournament([], cup, null)).toThrow("đăng nhập");
  });

  it("tra mẫu từ catalog khi không có context; liên kết mẫu cũ dùng cùng dữ liệu", () => {
    const context = { tournaments: [{ id: 1, name: "Real Cup" }], activeTournament: cup, publicTournament: null };
    expect(resolvePublicTournament(context, new URLSearchParams("id=1&sample=1"))).toMatchObject({ name: findSample(1).name, sample: true });
    expect(resolvePublicTournament(context, new URLSearchParams("id=201&sample=1"))).toMatchObject({ id: 1, name: findSample(1).name });
    expect(resolvePublicTournament(context, new URLSearchParams("id=999999&sample=1"))).toBeNull();
    expect(resolvePublicTournament(context, new URLSearchParams("id=missing"))).toBeNull();
  });

  it("đội mẫu/đội cũ không tự trở thành đội cá nhân dù trùng GamerTag", () => {
    const legacy = { id: 1, name: "Old", captain: "Captain", members: ["Captain"], pendingRequests: [], recruiting: true };
    expect(isCaptain(legacy, alice)).toBe(false);
    expect(isMember({ ...legacy, sample: true }, alice)).toBe(false);
    expect(() => applyTeamAction([legacy], alice, { type: "edit", id: 1, values: { name: "Taken", game: "Valorant" } })).toThrow("chỉ được xem");
  });

  it("tạo, xin vào, đổi tên và duyệt đội dùng danh tính dù hai người có cùng tên", () => {
    let teams = applyTeamAction([], alice, { type: "create", id: "new", values: { name: "Our team", game: "Valorant", recruiting: true } });
    expect(isCaptain(teams[0], bob)).toBe(false);
    teams = applyTeamAction(teams, bob, { type: "join", id: "new" });
    expect(hasRequest(teams[0], bob)).toBe(true);
    teams = renameTeamMember(teams, "Captain", "Captain A", alice);
    expect(teams[0]).toMatchObject({ captain: "Captain A", pendingRequests: ["Captain"], memberIdentities: { "id:7": "Captain A" } });
    teams = applyTeamAction(teams, alice, { type: "accept", id: "new", applicant: "Captain", applicantKey: "id:8" });
    expect(isMember(teams[0], bob)).toBe(true);
    teams = applyTeamAction(teams, bob, { type: "leave", id: "new" });
    expect(isMember(teams[0], bob)).toBe(false);
    expect(isCaptain(teams[0], alice)).toBe(true);
  });

  it("đổi tên và hủy yêu cầu chỉ thay một tài khoản khi tên hiển thị trùng nhau", () => {
    const captain = { id: 1, tagName: "Owner" };
    let teams = applyTeamAction([], captain, { type: "create", id: "same-tags", values: { name: "Team", game: "CS2", recruiting: true } });
    teams = applyTeamAction(teams, alice, { type: "join", id: "same-tags" });
    teams = applyTeamAction(teams, bob, { type: "join", id: "same-tags" });
    teams = applyTeamAction(teams, alice, { type: "cancel", id: "same-tags" });
    expect(teams[0].pendingRequests).toEqual(["Captain"]);
    expect(hasRequest(teams[0], bob)).toBe(true);
    teams = applyTeamAction(teams, alice, { type: "join", id: "same-tags" });
    teams = renameTeamMember(teams, "Captain", "Alice", alice);
    expect(teams[0].pendingRequests).toEqual(["Alice", "Captain"]);
    expect(teams[0].requestIdentities).toEqual({ "id:7": "Alice", "id:8": "Captain" });
  });

  it("duyệt/từ chối theo ID, không nhận yêu cầu chỉ trùng tên hoặc sửa dữ liệu gốc", () => {
    const owner = { id: 1, tagName: "Owner" };
    let teams = applyTeamAction([], owner, { type: "create", id: "requests", values: { name: "Team", game: "Valorant", recruiting: true } });
    teams = applyTeamAction(teams, alice, { type: "join", id: "requests" });
    teams = applyTeamAction(teams, bob, { type: "join", id: "requests" });
    const snapshot = structuredClone(teams);
    expect(() => applyTeamAction(teams, owner, { type: "accept", id: "requests", applicant: "Captain" })).toThrow("không còn tồn tại");
    const rejected = applyTeamAction(teams, owner, { type: "reject", id: "requests", applicantKey: "id:7" });
    expect(hasRequest(rejected[0], alice)).toBe(false);
    expect(hasRequest(rejected[0], bob)).toBe(true);
    expect(rejected[0].pendingRequests).toEqual(["Captain"]);
    const accepted = applyTeamAction(rejected, owner, { type: "accept", id: "requests", applicantKey: "id:8", applicant: "Forged name" });
    expect(isMember(accepted[0], alice)).toBe(false);
    expect(isMember(accepted[0], bob)).toBe(true);
    expect(accepted[0].members).toEqual(["Owner", "Captain"]);
    expect(teams).toEqual(snapshot);
  });

  it("rời đội chỉ xóa đúng ID khi thành viên trùng tên với đội trưởng", () => {
    let teams = applyTeamAction([], alice, { type: "create", id: "members", values: { name: "Team", game: "Free Fire", recruiting: true } });
    teams = applyTeamAction(teams, bob, { type: "join", id: "members" });
    teams = applyTeamAction(teams, alice, { type: "accept", id: "members", applicantKey: "id:8" });
    const left = applyTeamAction(teams, bob, { type: "leave", id: "members" });
    expect(left[0]).toMatchObject({ game: "Free Fire", captainKey: "id:7", members: ["Captain"], memberIdentities: { "id:7": "Captain" } });
    expect(isMember(left[0], bob)).toBe(false);
    expect(isCaptain(left[0], alice)).toBe(true);
    expect(isMember(teams[0], bob)).toBe(true);
  });
});
