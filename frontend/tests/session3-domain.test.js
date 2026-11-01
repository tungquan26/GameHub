import { describe, expect, it } from "vitest";
import { applyTeamAction, hasRequest, isCaptain, isMember, normalizeTeams, renameTeamMember } from "@/lib/teams";
import { buildCatalog, canonicalGame, EMPTY_FILTERS, filterTournaments, makeTournament, matchesDates, normalizeTournament } from "@/lib/tournaments";
import { loadState, STORE_KEY } from "@/lib/tourney-store";

const team = () => ({ id: 1, name: "Alpha", game: "Valorant", captain: "Captain", members: ["Captain", "Member"], pendingRequests: ["Applicant"], recruiting: true, logo: "" });
describe("Quy tắc đội tuyển", () => {
  it("đối chiếu tên không phân biệt hoa thường", () => {
    expect(isCaptain(team(), "captain")).toBe(true);
    expect(isMember(team(), "MEMBER")).toBe(true);
    expect(hasRequest(team(), "applicant")).toBe(true);
  });
  it.each(["edit", "dissolve", "accept", "reject"])("thành viên không được thực hiện %s", (type) => {
    expect(() => applyTeamAction([team()], "Member", { type, id: 1, applicant: "Applicant", values: { name: "Hijacked", game: "CS2" } })).toThrow("Chỉ đội trưởng");
  });
  it("xin vào không trùng yêu cầu; hủy chỉ yêu cầu của chính mình", () => {
    const original = [team()];
    const joined = applyTeamAction(original, "Guest", { type: "join", id: 1 });
    const repeated = applyTeamAction(joined, "guest", { type: "join", id: 1 });
    expect(repeated[0].pendingRequests).toEqual(["Applicant", "Guest"]);
    const canceled = applyTeamAction(repeated, "GUEST", { type: "cancel", id: 1 });
    expect(canceled[0].pendingRequests).toEqual(["Applicant"]);
    expect(original[0].pendingRequests).toEqual(["Applicant"]);
  });
  it("không xin vào đội đã chốt hoặc đã có tên trong đội", () => {
    expect(() => applyTeamAction([{ ...team(), recruiting: false }], "Guest", { type: "join", id: 1 })).toThrow("Đội đã đủ người");
    expect(() => applyTeamAction([team()], "member", { type: "join", id: 1 })).toThrow("đã là thành viên");
  });
  it("duyệt và từ chối xóa đúng yêu cầu, chỉ duyệt mới thêm thành viên", () => {
    const accepted = applyTeamAction([team()], "Captain", { type: "accept", id: 1, applicant: "Applicant" });
    expect(accepted[0].members).toEqual(["Captain", "Member", "Applicant"]);
    expect(accepted[0].pendingRequests).toEqual([]);
    expect(() => applyTeamAction(accepted, "Captain", { type: "accept", id: 1, applicant: "Applicant" })).toThrow("không còn tồn tại");
    const rejected = applyTeamAction([team()], "Captain", { type: "reject", id: 1, applicant: "Applicant" });
    expect(rejected[0].members).toEqual(["Captain", "Member"]);
    expect(rejected[0].pendingRequests).toEqual([]);
  });
  it("rời đội giữ đội trưởng và các thành viên khác", () => {
    const result = applyTeamAction([team()], "Member", { type: "leave", id: 1 });
    expect(result[0].members).toEqual(["Captain"]);
    expect(() => applyTeamAction([team()], "Captain", { type: "leave", id: 1 })).toThrow("giải tán");
  });
  it("sửa đội giữ danh sách thành viên/yêu cầu và giải tán trả mảng rỗng", () => {
    const edited = applyTeamAction([team()], "Captain", { type: "edit", id: 1, values: { name: " Alpha 2 ", game: "CS2", recruiting: false, logo: "data:image/png;base64,x" } });
    expect(edited[0]).toMatchObject({ name: "Alpha 2", game: "CS2", members: ["Captain", "Member"], pendingRequests: ["Applicant"], recruiting: false });
    expect(applyTeamAction(edited, "Captain", { type: "dissolve", id: 1 })).toEqual([]);
  });
  it("đổi GamerTag không làm mất quyền đội trưởng hoặc yêu cầu đang chờ", () => {
    const renamed = renameTeamMember([team()], "Captain", "NewCaptain");
    expect(renamed[0]).toMatchObject({ captain: "NewCaptain", members: ["NewCaptain", "Member"] });
    expect(renameTeamMember([team()], "Applicant", "NewApplicant")[0].pendingRequests).toEqual(["NewApplicant"]);
  });
  it("dữ liệu đội cũ thiếu requests được chuẩn hóa", () => {
    expect(normalizeTeams([{ id: 1, name: "Old", members: ["one", null], captain: "one" }])[0]).toMatchObject({ members: ["one"], pendingRequests: [], recruiting: false });
  });
});

describe("Tìm kiếm và chuẩn hóa giải đấu", () => {
  const now = new Date("2026-10-30T18:00:00Z");
  it("ngày tương đối theo Asia/Saigon, gồm cả hai đầu mốc", () => {
    const filters = { ...EMPTY_FILTERS, dateRanges: ["next_7_days"] };
    expect(matchesDates({ startDate: "2026-10-31T09:00" }, filters, now)).toBe(true);
    expect(matchesDates({ startDate: "2026-11-07T23:00" }, filters, now)).toBe(true);
    expect(matchesDates({ startDate: "2026-11-08" }, filters, now)).toBe(false);
    expect(matchesDates({ startDate: "2026-10-30" }, filters, now)).toBe(false);
  });
  it("khoảng tùy chọn bao gồm cả Đến ngày; các khoảng ngày kết hợp OR", () => {
    const filters = { ...EMPTY_FILTERS, dateRanges: ["custom"], from: "2026-11-01", to: "2026-11-02" };
    expect(matchesDates({ startDate: "2026-11-02T23:59" }, filters, now)).toBe(true);
    expect(matchesDates({ startDate: "2026-11-03T00:00" }, filters, now)).toBe(false);
    expect(matchesDates({ startDate: "2026-10-30" }, { ...filters, dateRanges: ["custom", "past_7_days"] }, now)).toBe(true);
  });
  it("chuẩn hóa API tournamentId, tên game và trạng thái mà không gắn vai trò sai", () => {
    const item = normalizeTournament({ tournamentId: 7, name: "API", game: { name: "Counter-Strike 2" }, status: "IN_PROGRESS", registrations: [] });
    expect(item).toMatchObject({ id: 7, game: "CS2", status: "in_progress", role: null, attendees: 0 });
    expect(canonicalGame("League of Legends")).toBe("Liên Minh Huyền Thoại");
    expect(canonicalGame("Wild Rift")).toBe("League of Legends: Wild Rift");
  });
  it("kết hợp AND giữa trạng thái, game, keyword và ngày", () => {
    const items = [
      normalizeTournament({ id: 1, name: "API Test", game: "CS2", status: "IN_PROGRESS", startDate: "2026-11-05" }),
      normalizeTournament({ id: 2, name: "API Other", game: "Valorant", status: "IN_PROGRESS", startDate: "2026-11-05" }),
    ];
    expect(filterTournaments(items, "API", { ...EMPTY_FILTERS, statuses: ["in_progress"], games: ["Counter-Strike 2"], dateRanges: ["custom"], from: "2026-11-01", to: "2026-11-05" }, now).map((item) => item.id)).toEqual([1]);
  });
  it("giữ cả giải thật và mẫu cùng tên, không gán quyền từ nguồn local", () => {
    const items = buildCatalog([{ id: "tourney_x", name: "Cup", source: "local", status: "closed" }], [{ id: 1, name: "cup", status: "open" }], null);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ role: null, sample: false, status: "upcoming", registrationState: "closed", badgeLabel: "Đã đóng đăng ký" });
  });
  it("tạo giải không nhận ngày kết thúc trước hoặc bằng bắt đầu", () => {
    const values = { name: " Cup ", contactType: "DISCORD", contact: " invite ", startDate: "2026-11-01T10:00", endDate: "2026-11-01T10:00" };
    expect(() => makeTournament(values, { id: 9 })).toThrow("Ngày kết thúc");
    const result = makeTournament({ ...values, endDate: "2026-11-02T10:00" }, { id: 9 });
    expect(result).toMatchObject({ name: "Cup", contact: "invite", source: "local", ownerId: 9, attendees: 0, profileImg: "", bannerImg: "", rules: "", gameInfo: { game: "" } });
  });
});

describe("Chuyển tiếp cache Phiên 1–2", () => {
  it("cache cũ vẫn nhận đội và đăng ký từ SessionStorage", () => {
    localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, profile: null, tournaments: [] }));
    sessionStorage.setItem("btp_community_teams_v5", JSON.stringify([team()]));
    sessionStorage.setItem("btp_registered_tournaments", JSON.stringify([{ name: "Đã đăng ký" }]));
    expect(loadState(localStorage, sessionStorage)).toMatchObject({ teams: [{ name: "Alpha" }], registeredTournaments: [{ name: "Đã đăng ký" }] });
  });
  it("mảng đội rỗng đã lưu không khôi phục đội cũ sau giải tán", () => {
    localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, profile: null, tournaments: [], teams: [], registeredTournaments: [] }));
    sessionStorage.setItem("btp_community_teams_v5", JSON.stringify([team()]));
    expect(loadState(localStorage, sessionStorage).teams).toEqual([]);
  });
});
