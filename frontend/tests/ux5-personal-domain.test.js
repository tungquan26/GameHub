import { describe, expect, it } from "vitest";
import { buildPersonalActivity } from "@/lib/personal-activity";
import { generateBracket, findMatch } from "@/lib/bracket";
import { tournamentKey } from "@/lib/public-tournament";

const user = { id: 7, tagName: "Captain" };
const other = { id: 8, tagName: "Captain" };
const now = new Date("2026-10-31T03:00:00Z");
const regSettings = { registrationStartDate: "2026-10-01", registrationEndDate: "2026-11-05", maxTeamSize: 5 };
const cup = (id, extra = {}) => ({ id, name: `Cup ${id}`, ownerId: 7, game: "Valorant", regSettings, startDate: "2026-11-10T10:00", endDate: "2026-11-15T18:00", ...extra });
const team = { id: "team_alpha", name: "Alpha", captainKey: "id:7", captain: "Captain", members: ["Captain"], memberIdentities: { "id:7": "Captain" }, pendingRequests: ["Applicant", "Old request"], requestIdentities: { "id:8": "Applicant" } };
const activity = (data) => buildPersonalActivity(data, user, now);
function bracketCup(extra = {}) {
  const entry = cup("scheduled", { tournamentTeams: [{ id: team.id, name: team.name, members: [] }, { id: "opponent", name: "Opponent", members: [] }, { id: "third", name: "Third", members: [] }, { id: "fourth", name: "Fourth", members: [] }], ...extra });
  return { entry, bracket: generateBracket(entry, 4) };
}

describe("UX-5: nguồn hoạt động và số liệu cá nhân", () => {
  it("gộp đăng ký có danh tính, giữ nguồn riêng cho ID trùng và loại tài khoản khác/dữ liệu cũ", () => {
    const data = { tournaments: [cup(1), cup(2, { ownerId: 8, role: "Organizer" }), cup("tourney_old", { ownerId: null, source: "local" }), cup(4, { sample: true })], registeredTournaments: [cup(11, { ownerId: 8, registrantKey: "id:7" }), cup(12, { registrantKey: "id:8" }), { id: 1, sample: true, registrantKey: "id:7" }, { id: 21, role: "Player" }], teams: [team, { ...team, id: "sample", sample: true }, { ...team, id: "other", captainKey: "id:8", memberIdentities: {} }, { id: "old", name: "Legacy", captain: "Captain", members: ["Captain"] }] };
    const result = activity(data);
    expect(result.stats).toEqual({ organized: 1, participating: 2, teams: 2 });
    expect(result.events.map(tournamentKey)).toEqual(["tournament:1", "tournament:11", "sample:1"]);
    expect(result.participating.filter((entry) => entry.sample)).toHaveLength(1);
    expect(buildPersonalActivity(data, other, now).events.map((item) => item.id)).not.toContain(1);
    expect(buildPersonalActivity(data, null, now).stats).toEqual({ organized: 0, participating: 0, teams: 0 });
  });

  it("sửa thông tin giải dùng snapshot mới nhất, không trùng bộ đếm theo tên", () => {
    const result = activity({ tournaments: [cup(1), cup(2, { name: "Same" }), cup(3, { name: "Same", ownerId: 8 })], registeredTournaments: [cup(3, { name: "Old name", ownerId: 8, registrantId: 7 })] });
    expect(result.stats).toMatchObject({ organized: 2, participating: 1 });
    expect(result.participating[0].name).toBe("Same");
  });

  it("hoạt động không gồm giải kết thúc/hủy; ưu tiên giải đang diễn ra", () => {
    const result = activity({ tournaments: [cup(1), cup(2, { status: "COMPLETED" }), cup(3, { status: "CANCELLED" }), cup(4, { status: "ONGOING", startDate: "2026-12-01" })] });
    expect(result.active.map((item) => item.id)).toEqual([4, 1]);
    expect(result.stats.organized).toBe(4);
  });

  it("công việc chỉ từ cấu hình thiếu và yêu cầu có danh tính, đúng đích giải/đội", () => {
    const result = activity({ tournaments: [cup(1, { game: "", regSettings: null }), cup(2), cup(3, { game: "", regSettings: null, status: "COMPLETED" })], teams: [team] });
    expect(result.tasks.map((item) => item.title)).toEqual(["Duyệt 1 yêu cầu vào đội", "Chọn bộ môn thi đấu", "Hoàn tất cài đặt đăng ký"]);
    expect(result.tasks[0].to).toEqual({ pathname: "/community", search: "action=view-team&team=team_alpha", hash: "#myTeamsSection" });
    expect(result.tasks[1].to).toMatchObject({ pathname: "/tournament/game-info", search: "id=1" });
    expect(result.tasks[2].to).toMatchObject({ pathname: "/tournament/registration-settings", search: "id=1" });
  });

  it("không tạo công việc duyệt cho thành viên thường, mẫu hoặc yêu cầu cũ", () => {
    const result = activity({ teams: [{ ...team, captainKey: "id:8" }, { ...team, sample: true }, { ...team, id: "old", requestIdentities: {} }] });
    expect(result.tasks).toEqual([]);
  });
});

describe("UX-5: trận sắp tới chỉ lấy nhánh đã lưu và danh tính", () => {
  it("không tự tạo lịch khi có giải nhưng chưa có bracket, không sửa dữ liệu đầu vào", () => {
    const data = { tournaments: [cup(1)], teams: [team], brackets: {} }; const before = structuredClone(data);
    expect(activity(data).upcoming).toEqual([]); expect(data).toEqual(before);
  });

  it("đội hiện tại được nhận diện theo ID, không theo tên; organizer không tự nhận mọi trận", () => {
    const { entry, bracket } = bracketCup();
    const data = { tournaments: [entry], teams: [team], brackets: { [tournamentKey(entry)]: bracket } };
    const matches = activity(data).upcoming;
    expect(matches).toHaveLength(1); expect(matches[0].match.matchId).toBe(101);
    expect(matches[0].to).toMatchObject({ pathname: "/tournament/schedule", search: "id=scheduled", hash: "#match-101" });
    expect(activity({ ...data, teams: [{ ...team, id: "different", name: "Alpha" }] }).upcoming).toEqual([]);
    expect(activity({ ...data, teams: [] }).upcoming).toEqual([]);
  });

  it("danh tính trong đội đăng ký vẫn xác định được dù bracket chỉ giữ ID/tên", () => {
    const { entry, bracket } = bracketCup();
    entry.tournamentTeams[0].memberIdentities = { "id:7": "Captain" };
    expect(activity({ tournaments: [entry], brackets: { [tournamentKey(entry)]: bracket } }).upcoming).toHaveLength(1);
  });

  it("tuyển thủ mở lịch công khai đúng giải, không được quyền quản lý", () => {
    const { entry, bracket } = bracketCup({ ownerId: 8 });
    const result = activity({ tournaments: [entry], registeredTournaments: [{ ...entry, registrantId: 7 }], teams: [team], brackets: { [tournamentKey(entry)]: bracket } });
    expect(result.upcoming[0].to.search).toBe("id=scheduled&view=public");
  });

  it("bỏ trận quá hạn, hoàn thành, đối thủ mẫu, TBD và bracket hỏng", () => {
    const { entry, bracket } = bracketCup();
    for (const patch of [{ scheduledTime: "2020-01-01" }, { status: "COMPLETED" }, { teamB: { id: "sample-team-1", name: "Sample", sample: true } }, { teamB: null }]) {
      const changed = structuredClone(bracket); Object.assign(findMatch(changed, 101), patch);
      expect(activity({ tournaments: [entry], teams: [team], brackets: { [tournamentKey(entry)]: changed } }).upcoming).toEqual([]);
    }
    expect(activity({ tournaments: [entry], teams: [team], brackets: { [tournamentKey(entry)]: {} } }).upcoming).toEqual([]);
  });

  it("nguồn giải/đội không loại trận đã lưu có danh tính; giải hủy không tạo trận cá nhân", () => {
    const { entry, bracket } = bracketCup();
    expect(activity({ tournaments: [{ ...entry, sample: true }], teams: [team], brackets: { [tournamentKey({ ...entry, sample: true })]: bracket } }).upcoming).toHaveLength(1);
    expect(activity({ tournaments: [{ ...entry, status: "CANCELLED" }], teams: [team], brackets: { [tournamentKey(entry)]: bracket } }).upcoming).toEqual([]);
    expect(activity({ tournaments: [entry], teams: [{ ...team, sample: true }], brackets: { [tournamentKey(entry)]: bracket } }).upcoming).toHaveLength(1);
  });
});
