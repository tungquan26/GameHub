import { describe, expect, it } from "vitest";
import { applyTournamentPatch, cleanDetails, cleanGame, cleanRegistration, makeParticipant, registrationValues } from "@/lib/tournament-settings";
import { loadState, STORE_KEY } from "@/lib/tourney-store";
import { imageWarning } from "@/lib/images";

const details = { name: " Cup ", contactType: "EMAIL", contact: " hello@example.com ", startDate: "2026-11-01T10:00", endDate: "2026-11-02T10:00", venueAddress: " Hà Nội ", venueLat: 0, venueLon: 0 };
describe("Quy tắc cài đặt giải đấu", () => {
  it("chi tiết bắt buộc đủ dữ liệu, ngày hợp lệ và email đúng định dạng", () => {
    expect(() => cleanDetails({ ...details, name: "  " })).toThrow("đầy đủ");
    expect(() => cleanDetails({ ...details, endDate: details.startDate })).toThrow("kết thúc phải sau");
    expect(() => cleanDetails({ ...details, contact: "invalid" })).toThrow("email hợp lệ");
    expect(cleanDetails(details)).toMatchObject({ name: "Cup", contact: "hello@example.com", venueAddress: "Hà Nội", venueLat: 0, venueLon: 0 });
  });
  it("giữ PHONE từ form Create; Discord chỉ yêu cầu không trống", () => {
    expect(cleanDetails({ ...details, contactType: "PHONE", contact: "0901234567" }).contactType).toBe("PHONE");
    expect(cleanDetails({ ...details, contactType: "DISCORD", contact: "https://discord.gg/btp" }).contactType).toBe("DISCORD");
  });
  it.each([3, 21, 4.5])("không nhận maxTeamSize=%s", (maxTeamSize) => {
    expect(() => cleanRegistration({ registrationStartDate: details.startDate, registrationEndDate: details.endDate, maxTeamSize })).toThrow();
  });
  it("đăng ký giữ cố định min=4, maxTeams=16, Miễn phí và cho phép mốc 4/20", () => {
    const input = { registrationStartDate: details.startDate, registrationEndDate: details.endDate, maxTeamSize: "20", minTeamSize: 1, maxTeams: 8, feeType: "PAID" };
    expect(cleanRegistration(input)).toMatchObject({ maxTeamSize: 20, minTeamSize: 4, maxTeams: 16, feeType: "FREE" });
    expect(cleanRegistration({ ...input, maxTeamSize: 4 }).maxTeamSize).toBe(4);
    expect(() => cleanRegistration({ ...input, registrationEndDate: input.registrationStartDate })).toThrow("đóng đăng ký phải sau");
    expect(registrationValues(null)).toMatchObject({ minTeamSize: 4, maxTeams: 16, maxTeamSize: "" });
  });
  it("bộ môn giới hạn 8 game, 4 thể thức và một giai đoạn", () => {
    expect(cleanGame({ game: "CS2", stageType: "TWO_STAGES", format: "SWISS" })).toEqual({ game: "CS2", stageType: "SINGLE_STAGE", format: "SWISS" });
    expect(() => cleanGame({ game: "2XKO", format: "SINGLE_ELIMINATION" })).toThrow("tựa game");
    expect(() => cleanGame({ game: "CS2", format: "UNKNOWN" })).toThrow("thể thức");
  });
  it("thành viên tách bằng / hoặc dấu phẩy; không thêm ràng buộc 4 người cho thao tác thủ công", () => {
    expect(makeParticipant({ name: " Team ", members: "Faker / Oner, Chovy" })).toMatchObject({ name: "Team", members: ["Faker", "Oner", "Chovy"] });
    expect(makeParticipant({ name: "One", members: "Faker" }).members).toEqual(["Faker"]);
    expect(() => makeParticipant({ name: "Team", members: " , / " })).toThrow("ít nhất 1");
  });
  it("ảnh ngoài khuyến nghị chỉ cảnh báo và giữ đúng các giới hạn gốc", () => {
    expect(imageWarning("profile", 280, 280)).toBe("");
    expect(imageWarning("profile", 4800, 4800)).toBe("");
    expect(imageWarning("profile", 279, 280)).toContain("280x280");
    expect(imageWarning("banner", 1600, 800)).toBe("");
    expect(imageWarning("banner", 4801, 2400)).toContain("1600x800");
  });
  it("patch ảnh hoặc bộ môn không làm mất chi tiết, id và dữ liệu khác", () => {
    const entry = { id: "one", name: "Cup", details: { name: "Cup", startDate: details.startDate }, rules: "# Rules", bannerImg: "banner" };
    const changed = applyTournamentPatch(entry, { id: "bad", name: "New", gameInfo: { game: "CS2" } });
    expect(changed).toMatchObject({ id: "one", name: "New", details: { id: "one", name: "New", startDate: details.startDate }, rules: "# Rules", bannerImg: "banner" });
  });
});

describe("Chuyển tiếp đội tuyển cũ", () => {
  it("chỉ gán danh sách làm việc cũ cho giải đang chọn", () => {
    localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, tournaments: [{ id: "one", name: "One" }, { id: "two", name: "Two" }], activeTournamentId: "one" }));
    sessionStorage.setItem("btp_tournament_teams", JSON.stringify([{ id: 9, name: "Legacy", members: ["A"] }]));
    const state = loadState(localStorage, sessionStorage);
    expect(state.tournaments[0].tournamentTeams).toEqual([{ id: 9, name: "Legacy", members: ["A"] }]);
    expect(state.tournaments[1].tournamentTeams).toBeUndefined();
  });
  it("giữ danh sách rỗng đã lưu, không nhập lại đội của giải trước", () => {
    localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, tournaments: [{ id: "one", name: "One", tournamentTeams: [] }], activeTournamentId: "one" }));
    sessionStorage.setItem("btp_tournament_teams", JSON.stringify([{ name: "Other", members: ["A"] }]));
    expect(loadState(localStorage, sessionStorage).tournaments[0].tournamentTeams).toEqual([]);
  });
});
