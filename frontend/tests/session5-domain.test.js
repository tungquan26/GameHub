import { describe, expect, it } from "vitest";
import { cleanImageWidget, COLUMN_LAYOUTS, defaultHomepage, editHomepage, newWidget, normalizeHomepage, safeWebUrl, WIDGET_META } from "@/lib/homepage";
import { allMatches, bracketStats, findMatch, generateBracket, teamsForBracket, updateBracketMatch, validBracket } from "@/lib/bracket";
import { registerForTournament, resolvePublicTournament, sameTournament, tournamentAccess, tournamentKey } from "@/lib/public-tournament";
import { loadState, STORE_KEY } from "@/lib/tourney-store";

const user = { id: 7, tagName: "Captain" };
const entry = { id: "tourney_one", ownerId: 7, name: "Autumn Cup", startDate: "2026-11-10T10:00", endDate: "2026-11-15T18:00", source: "local", tournamentTeams: Array.from({ length: 8 }, (_, index) => ({ id: index + 1, name: "Đội " + (index + 1), members: ["Captain"] })) };
const outsider = { id: 71, name: "Public Cup", status: "open", contact: "public@example.com" };
const result = (bracket, id, scoreA = 2, scoreB = 0) => updateBracketMatch(bracket, id, { scoreA, scoreB });

describe("Phiên 5: bố cục trang chủ", () => {
  it("giữ đủ bốn bố cục, sáu tiện ích và bố cục mặc định gốc", () => {
    expect(COLUMN_LAYOUTS.map((item) => item.value)).toEqual(["1col", "2col-50-50", "2col-66-33", "2col-33-66"]);
    expect(Object.keys(WIDGET_META)).toEqual(["MARKDOWN", "IMAGE", "GAME_INFO", "LOCATION", "CONTACT", "RULES"]);
    expect(defaultHomepage()).toHaveLength(4);
    expect(defaultHomepage().flatMap((section) => section.columns.flat())).toHaveLength(5);
    expect(normalizeHomepage([])).toEqual([]);
  });
  it("đổi cột, chuyển tiện ích và gộp cột không mất nội dung hoặc sửa bản gốc", () => {
    const original = defaultHomepage();
    let changed = editHomepage(original, { type: "layout", sectionId: "sec_loc_contact", value: "2col-66-33" });
    changed = editHomepage(changed, { type: "move-widget", sectionId: "sec_loc_contact", widgetId: "wid_contact", targetSectionId: "sec_loc_contact", targetColumn: 1 });
    expect(changed[2].columns.map((column) => column.map((widget) => widget.id))).toEqual([["wid_location"], ["wid_contact"]]);
    changed = editHomepage(changed, { type: "layout", sectionId: "sec_loc_contact", value: "1col" });
    expect(changed[2].columns[0].map((widget) => widget.id)).toEqual(["wid_location", "wid_contact"]);
    expect(original).toEqual(defaultHomepage());
  });
  it("di chuyển khu vực và tiện ích giữa các khu vực, giữ id khi sửa", () => {
    let changed = editHomepage(defaultHomepage(), { type: "move-section", sectionId: "sec_rules", targetId: "sec_overview" });
    expect(changed[0].id).toBe("sec_rules");
    changed = editHomepage(changed, { type: "move-widget", sectionId: "sec_rules", widgetId: "wid_rules", targetSectionId: "sec_overview", targetColumn: 0 });
    expect(changed[0].columns[0]).toEqual([]);
    expect(changed[1].columns[0].at(-1).id).toBe("wid_rules");
    changed = editHomepage(changed, { type: "update-widget", sectionId: "sec_overview", widgetId: "wid_rules", patch: { id: "bad", type: "IMAGE", title: "New" } });
    expect(changed[1].columns[0].at(-1)).toMatchObject({ id: "wid_rules", type: "RULES", title: "New" });
  });
  it("phục hồi dữ liệu bố cục lỗi và id trùng, Việt hóa tiêu đề cũ", () => {
    expect(normalizeHomepage(null)).toEqual(defaultHomepage());
    const list = normalizeHomepage([{ id: "s", title: "Overview", layout: "bad", columns: [[{ id: "w", type: "RULES", content: { invalid: true } }, null], [{ id: "w", type: "CONTACT" }]] }, { id: "s", columns: [null] }]);
    expect(list[0]).toMatchObject({ title: "Tổng quan", layout: "1col" });
    expect(list[0].columns[0]).toHaveLength(2);
    expect(list[0].columns[0][0].content).toBe("");
    expect(new Set(list.map((item) => item.id)).size).toBe(2);
    expect(new Set(list[0].columns[0].map((item) => item.id)).size).toBe(2);
    expect(newWidget("MARKDOWN").content).toContain("Nhập nội dung");
    expect(() => newWidget("SCRIPT")).toThrow();
  });
  it("chặn URL thực thi mã trong ảnh và liên kết, cho data URL ảnh raster", () => {
    for (const url of ["javascript:alert(1)", "data:text/html,<script>", "data:image/svg+xml,<svg>", "//evil.test/a"]) expect(safeWebUrl(url, { image: true })).toBe("");
    expect(safeWebUrl("data:image/png;base64,YWJj", { image: true })).toContain("data:image/png");
    expect(() => cleanImageWidget({ title: "", caption: "", imageUrl: "", linkUrl: "" })).toThrow("tải ảnh");
    expect(() => cleanImageWidget({ title: "", caption: "", imageUrl: "https://example.com/img.png", linkUrl: "javascript:alert(1)" })).toThrow("HTTP");
  });
});

describe("Phiên 5: nhánh đấu loại trực tiếp", () => {
  it.each([4, 8])("tạo đúng nhánh %s đội, liên kết lượt trận và lịch theo ngày giải", (size) => {
    const bracket = generateBracket(entry, size);
    expect(validBracket(bracket)).toBe(true);
    expect(allMatches(bracket)).toHaveLength(size - 1);
    expect(allMatches(bracket).map((match) => match.matchNumber)).toEqual(Array.from({ length: size - 1 }, (_, index) => index + 1));
    expect(findMatch(bracket, 101).nextMatchId).toBe(201);
    expect(findMatch(bracket, 102).nextMatchSlot).toBe("B");
    expect(findMatch(bracket, 101).scheduledTime).toBe("2026-11-10T14:00");
    expect(findMatch(bracket, 201).scheduledTime).toBe("2026-11-11T14:00");
    expect(bracket.usesSampleTeams).toBe(false);
  });
  it("bổ sung TBD và bốc thăm không mất đội đã thêm", () => {
    const teams = teamsForBracket([{ id: 50, name: "BTP Esports" }], 8);
    expect(teams).toHaveLength(8); expect(teams.filter(Boolean)).toHaveLength(1); expect(teams.slice(1)).toEqual(Array(7).fill(null));
    const bracket = generateBracket(entry, 8, true, () => 0.25);
    expect(allMatches(bracket).filter((match) => match.roundNumber === 1).flatMap((match) => [match.teamA.id, match.teamB.id]).sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
  it("đẩy đội thắng, xác định nhà vô địch và không sửa nhánh ban đầu", () => {
    const original = generateBracket(entry, 4);
    let bracket = result(original, 101); bracket = result(bracket, 102, 0, 2); bracket = result(bracket, 201, 3, 1);
    expect(bracketStats(bracket)).toMatchObject({ completed: 3, total: 3, champion: { id: 1 } });
    expect(findMatch(original, 201).teamA).toBeNull();
    expect(bracketStats(original).completed).toBe(0);
  });
  it("sửa đội thắng vòng đầu xóa kết quả phụ thuộc tới chung kết nhưng giữ nhánh còn lại", () => {
    let bracket = generateBracket(entry, 8);
    for (const id of [101, 102, 103, 104, 201, 202, 301]) bracket = result(bracket, id);
    expect(bracketStats(bracket).champion.id).toBe(1);
    bracket = result(bracket, 101, 0, 2);
    expect(findMatch(bracket, 201)).toMatchObject({ teamA: { id: 2 }, teamB: { id: 3 }, result: null, status: "SCHEDULED" });
    expect(findMatch(bracket, 301)).toMatchObject({ teamA: null, teamB: { id: 5 }, result: null });
    expect(findMatch(bracket, 202).result.winner.id).toBe(5);
    expect(bracketStats(bracket)).toMatchObject({ completed: 5, champion: null });
  });
  it("đổi tỉ số cùng đội thắng hoặc chỉ đổi giờ giữ kết quả vòng sau", () => {
    let bracket = result(result(generateBracket(entry, 4), 101), 102);
    bracket = result(bracket, 201); bracket = result(bracket, 101, 3, 1);
    expect(bracketStats(bracket).champion.id).toBe(1);
    const edited = updateBracketMatch(bracket, 101, { scheduledTime: "2026-11-10T18:30", scoreA: "bad" }, true);
    expect(findMatch(edited, 101).scheduledTime).toBe("2026-11-10T18:30");
    expect(bracketStats(edited).champion.id).toBe(1);
  });
  it.each([[0, 0], [-1, 0], [1.5, 0], ["", 1], ["NaN", 1]])("không chấp nhận tỉ số không hợp lệ %s:%s", (scoreA, scoreB) => {
    expect(() => result(generateBracket(entry, 4), 101, scoreA, scoreB)).toThrow();
  });
  it("chờ đủ hai đội mới lưu kết quả, vẫn đổi giờ được; bỏ cache hỏng", () => {
    const bracket = generateBracket(entry, 4);
    expect(() => result(bracket, 201)).toThrow("chưa sẵn sàng");
    expect(() => updateBracketMatch(bracket, 201, { scheduledTime: "" }, true)).toThrow("ngày giờ");
    expect(findMatch(updateBracketMatch(bracket, 201, { scheduledTime: "2026-11-11T20:00" }, true), 201).scheduledTime).toContain("20:00");
    for (const data of [null, {}, { bracketSize: 4, rounds: [null, null] }]) expect(validBracket(data)).toBe(false);
  });
});

describe("Phiên 5: ngữ cảnh công khai và đăng ký", () => {
  it("tách giải mẫu trùng id và id không tồn tại khỏi giải đang quản lý", () => {
    const sample = { id: entry.id, name: "Sample Cup", sample: true };
    const context = { tournaments: [entry], activeTournament: entry, publicTournament: sample };
    expect(resolvePublicTournament(context).name).toBe("Sample Cup");
    expect(resolvePublicTournament(context, new URLSearchParams("id=missing"))).toBeNull();
    expect(resolvePublicTournament(context, new URLSearchParams(`id=${entry.id}&sample=1`)).sample).toBe(true);
    expect(sameTournament(entry, sample)).toBe(false);
    const anotherSample = { ...sample, name: "Another Sample" };
    expect(sameTournament(sample, anotherSample)).toBe(true);
    expect(tournamentKey(sample)).toBe(tournamentKey(anotherSample));
  });
  it("ưu tiên kết thúc/đang diễn ra rồi vai trò, sau đó kiểm tra thời gian đăng ký", () => {
    const now = new Date("2026-11-02T12:00");
    expect(tournamentAccess({ ...entry, status: "completed" }, user, [], now)).toMatchObject({ label: "Đã kết thúc", disabled: true, organizer: true });
    expect(tournamentAccess({ ...entry, status: "in_progress" }, null, [], now).label).toBe("Đang diễn ra");
    expect(tournamentAccess(entry, user, [], now).label).toBe("Quản lý giải đấu");
    expect(tournamentAccess({ ...outsider, role: "Player" }, user, [], now)).toMatchObject({ label: "Đăng ký tham gia", organizer: false, canSchedule: true });
    expect(tournamentAccess({ ...outsider, regSettings: { registrationStartDate: "2026-11-03T00:00" } }, null, [], now).label).toBe("Chưa mở đăng ký");
    expect(tournamentAccess({ ...outsider, regSettings: { registrationEndDate: "2026-11-01T00:00" } }, null, [], now).label).toBe("Đã đóng đăng ký");
  });
  it("đăng ký một lần, cập nhật tư cách và từ chối giải đã đóng", () => {
    const registered = registerForTournament([], outsider, user);
    expect(registered[0]).toMatchObject({ id: 71, role: "Player", attendees: 1 });
    expect(registerForTournament(registered, outsider, user)).toBe(registered);
    expect(tournamentAccess(outsider, user, registered).disabled).toBe(true);
    expect(tournamentAccess({ ...outsider, sample: true }, user, [{ name: outsider.name, role: "Tuyển thủ" }]).registeredPlayer).toBe(false);
    expect(() => registerForTournament([], { ...outsider, status: "closed" }, user)).toThrow("không nhận");
  });
  it("chuyển nhánh đấu cũ theo tên sang khóa id và giữ nhánh đã lưu khi đổi tên giải", () => {
    const bracket = generateBracket(entry, 4);
    sessionStorage.setItem("btp_tournament_brackets_v1", JSON.stringify({ "autumn cup": bracket }));
    localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, tournaments: [entry], activeTournamentId: entry.id }));
    const state = loadState(localStorage, sessionStorage);
    expect(state.brackets[tournamentKey(entry)]).toEqual(bracket);
    localStorage.setItem(STORE_KEY, JSON.stringify({ ...state, tournaments: [{ ...entry, name: "Renamed Cup" }] }));
    expect(loadState(localStorage, sessionStorage).brackets[tournamentKey(entry)]).toEqual(bracket);
  });
});
