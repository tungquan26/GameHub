import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "@/App";
import { TourneyProvider } from "@/context/TourneyContext";
import { STORE_KEY } from "@/lib/tourney-store";
import { currentDay, pastDateError } from "@/lib/dates";
import { makeTournament } from "@/lib/tournaments";
import { cleanDetails, cleanRegistration } from "@/lib/tournament-settings";
import { generateBracket, updateBracketMatch } from "@/lib/bracket";
import { registerForTournament, unregisterFromTournament, tournamentAccess } from "@/lib/public-tournament";
import useTournamentView from "@/hooks/useTournamentView";

const now = new Date("2026-11-01T05:00:00Z");
const profile = { id: 7, tagName: "Player" };
const cup = { id: 77, ownerId: 8, name: "November Cup", game: "Valorant", status: "OPEN_REGISTRATION", attendees: 2,
  startDate: "2026-11-10T10:00", endDate: "2026-11-12T18:00", contactType: "EMAIL", contact: "cup@example.com",
  regSettings: { registrationStartDate: "2026-10-01T00:00", registrationEndDate: "2026-11-05T18:00", maxTeamSize: 5 } };
const registration = (entry = cup, user = profile) => ({ ...entry, registrantKey: `id:${user.id}`, registrantId: user.id, role: "Player" });
const saved = () => JSON.parse(localStorage.getItem(STORE_KEY));
function seed(extra = {}) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, rememberLogin: true, profile, tournaments: [cup], teams: [], registeredTournaments: [], ...extra }));
}
function open(path, extra = {}) {
  seed(extra);
  return render(<MemoryRouter initialEntries={[path]}><TourneyProvider><AppRoutes /></TourneyProvider></MemoryRouter>);
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(now);
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response("[]", { headers: { "Content-Type": "application/json" } })));
});
afterEach(() => vi.useRealTimers());

describe("Ngày từ hôm nay", () => {
  it("dùng ngày Việt Nam, cho phép cả hôm nay và chặn ngày hôm qua", () => {
    expect(currentDay(new Date("2026-10-31T18:00:00Z"))).toBe("2026-11-01");
    expect(pastDateError({ date: "2026-11-01T00:00" }, ["date"])).toBe("");
    expect(pastDateError({ date: "2026-10-31T23:59" }, ["date"])).toContain("hôm nay");
  });
  it("chặn nhập ngày quá khứ ở tầng lưu, giữ mốc cũ không đổi khi sửa thông tin khác", () => {
    const old = { ...cup, startDate: "2026-10-01T10:00", endDate: "2026-10-02T18:00", venueAddress: "" };
    expect(() => makeTournament(old, profile)).toThrow("hôm nay");
    expect(() => cleanDetails(old)).toThrow("hôm nay");
    expect(cleanDetails({ ...old, name: "Renamed" }, { original: old }).name).toBe("Renamed");
    expect(() => cleanDetails({ ...old, startDate: "2026-09-30T10:00" }, { original: old })).toThrow("hôm nay");
    expect(cleanRegistration(cup.regSettings, { original: cup.regSettings }).maxTeamSize).toBe(5);
    expect(() => cleanRegistration({ ...cup.regSettings, registrationStartDate: "2026-10-31T10:00" }, { original: cup.regSettings })).toThrow("hôm nay");
  });
  it("không đổi lịch sang ngày cũ nhưng vẫn nhập kết quả cho trận đã diễn ra", () => {
    const entry = { ...cup, startDate: "2026-10-01T10:00", tournamentTeams: [1, 2, 3, 4].map((id) => ({ id, name: `Team ${id}`, members: [] })) };
    const bracket = generateBracket(entry, 4);
    expect(() => updateBracketMatch(bracket, 101, { scheduledTime: "2026-10-31T12:00" }, true)).toThrow("hôm nay");
    expect(updateBracketMatch(bracket, 101, { scheduledTime: bracket.rounds[0].matches[0].scheduledTime, scoreA: 2, scoreB: 0 }).rounds[0].matches[0].status).toBe("COMPLETED");
    expect(updateBracketMatch(bracket, 101, { scheduledTime: "2026-11-01T00:00" }, true).rounds[0].matches[0].scheduledTime).toBe("2026-11-01T00:00");
  });
  it.each([
    ["/create", "Ngày bắt đầu", "Ngày kết thúc"],
    ["/tournament/details?id=77", "Thời gian bắt đầu", "Thời gian kết thúc"],
    ["/tournament/registration-settings?id=77", "Thời gian mở đăng ký", "Thời gian đóng đăng ký"],
  ])("%s giới hạn lịch từ hôm nay", async (path, startLabel, endLabel) => {
    open(path, { tournaments: [{ ...cup, ownerId: 7 }], activeTournamentId: 77 });
    const start = await screen.findByLabelText(new RegExp(startLabel), {}, { timeout: 5000 });
    expect(start).toHaveAttribute("min", "2026-11-01T00:00");
    expect(screen.getByLabelText(new RegExp(endLabel))).toHaveAttribute("min", "2026-11-01T00:00");
    fireEvent.change(start, { target: { value: "2026-10-31T12:00" } });
    expect(screen.getByRole("alert")).toHaveTextContent("hôm nay");
    expect(within(start.closest("form")).getByRole("button", { name: path === "/create" ? "Tạo giải đấu" : "Lưu thay đổi" })).toBeDisabled();
  });
});

describe("Hủy đăng ký trong thời hạn", () => {
  it("xóa đúng tài khoản và giải, tách giải mẫu trùng ID, không thay đổi dữ liệu đầu vào", () => {
    const entries = [registration(), registration(cup, { id: 9 }), registration({ ...cup, sample: true }), registration({ ...cup, id: 88 })];
    const remaining = unregisterFromTournament(entries, cup, profile);
    expect(remaining).toEqual(entries.slice(1)); expect(entries).toHaveLength(4);
    expect(unregisterFromTournament(remaining, cup, profile)).toBe(remaining);
    expect(registerForTournament(remaining, cup, profile)).toHaveLength(4);
    expect(() => unregisterFromTournament(entries, cup, null)).toThrow("đăng nhập");
  });
  it.each(["IN_PROGRESS", "COMPLETED", "CANCELLED", "REGISTRATION_CLOSED"])("không cho hủy khi trạng thái %s", (status) => {
    expect(() => unregisterFromTournament([registration()], { ...cup, status }, profile)).toThrow("thời hạn");
  });
  it("chặn ngay đúng thời điểm hết hạn, cho phép trước hạn một mili giây", () => {
    const end = new Date(cup.regSettings.registrationEndDate);
    expect(tournamentAccess(cup, profile, [registration()], new Date(end.getTime() - 1)).canCancelRegistration).toBe(true);
    expect(tournamentAccess(cup, profile, [registration()], end).canCancelRegistration).toBe(false);
    expect(() => unregisterFromTournament([registration()], cup, profile, end)).toThrow("thời hạn");
  });
  it("UI hủy, cập nhật bộ đếm/lưu trữ, giữ tài khoản khác và cho đăng ký lại", async () => {
    open("/tournament/view?id=77", { registeredTournaments: [registration(), registration(cup, { id: 9 })], publicTournament: cup });
    const cancel = await screen.findByRole("button", { name: "Hủy đăng ký" }, { timeout: 5000 });
    await userEvent.click(cancel);
    expect(screen.queryByRole("button", { name: "Hủy đăng ký" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đăng ký tham gia" })).toHaveFocus();
    expect(saved().registeredTournaments).toHaveLength(1);
    expect(saved().registeredTournaments[0]).toMatchObject({ registrantKey: "id:9", attendees: 1 });
    expect(saved().tournaments[0].attendees).toBe(1); expect(saved().publicTournament.attendees).toBe(1);
    expect(screen.getByText(/Đã hủy đăng ký tham gia giải đấu/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Đăng ký tham gia" }));
    expect(screen.getByRole("button", { name: "Hủy đăng ký" })).toBeEnabled();
    expect(saved().registeredTournaments).toHaveLength(2); expect(saved().tournaments[0].attendees).toBe(2);
  });
  it("cập nhật quyền hủy khi vừa hết hạn dù trang vẫn đang mở", async () => {
    vi.useRealTimers();
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout", "setInterval", "clearInterval"] }); vi.setSystemTime(now);
    const ending = { ...cup, regSettings: { ...cup.regSettings, registrationEndDate: new Date(now.getTime() + 1000).toISOString() } };
    seed({ tournaments: [ending], registeredTournaments: [registration(ending)] });
    function Access() { const { access } = useTournamentView(); return <output data-testid="cancel">{String(access.canCancelRegistration)}</output>; }
    render(<MemoryRouter initialEntries={["/tournament/view?id=77"]}><TourneyProvider><Access /></TourneyProvider></MemoryRouter>);
    expect(screen.getByTestId("cancel")).toHaveTextContent("true");
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(screen.getByTestId("cancel")).toHaveTextContent("false");
  });
});
