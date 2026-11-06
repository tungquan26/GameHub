import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppRoutes } from "@/App";
import { TourneyProvider } from "@/context/TourneyContext";
import { STORE_KEY } from "@/lib/tourney-store";
import { ORGANIZER_GAMES } from "@/constants/games";

const ENTRY = {
  ownerId: 7,
  id: "tourney_one", name: "Autumn Cup", startDate: "2026-11-10T10:00", endDate: "2026-11-12T18:00",
  contactType: "EMAIL", contact: "captain@example.com", venueAddress: "", venueLat: null, venueLon: null,
  details: { name: "Autumn Cup", startDate: "2026-11-10T10:00", endDate: "2026-11-12T18:00" },
  profileImg: "", bannerImg: "", rules: "# Old rules", gameInfo: { game: "", stageType: "SINGLE_STAGE", format: "SINGLE_ELIMINATION" },
  regSettings: null, tournamentTeams: [],
};
const OTHER = { ...ENTRY, id: "tourney_two", name: "Other Cup", details: { ...ENTRY.details, name: "Other Cup" } };
function Location() { const value = useLocation(); return <span data-testid="location">{value.pathname}{value.search}</span>; }
function open(path, extra = {}) {
  localStorage.setItem(STORE_KEY, JSON.stringify({
    version: 1, rememberLogin: true, profile: { id: 7, tagName: "Captain" }, tournaments: [ENTRY, OTHER], activeTournamentId: ENTRY.id, ...extra,
  }));
  return render(<MemoryRouter initialEntries={[path]}><TourneyProvider><AppRoutes /><Location /></TourneyProvider></MemoryRouter>);
}
const state = () => JSON.parse(localStorage.getItem(STORE_KEY));
const active = () => state().tournaments.find((entry) => String(entry.id) === String(state().activeTournamentId));
const region = (name) => screen.getByRole("region", { name, exact: true });

describe("Phiên 4: Chi tiết giải đấu", () => {
  it("lưu ba card độc lập, kiểm tra ngày/email và cập nhật sidebar/snapshot công khai", async () => {
    open("/tournament/details", { publicTournament: { id: ENTRY.id, name: ENTRY.name, game: "Valorant" } });
    await screen.findByRole("heading", { level: 1, name: "Chi tiết giải đấu" }, { timeout: 5000 });
    const user = userEvent.setup();
    const details = region("Chi tiết giải đấu");
    const rules = region("Điều lệ giải đấu");
    const saveDetails = within(details).getByRole("button", { name: "Lưu thay đổi" });
    expect(saveDetails).toBeDisabled();
    await user.type(within(rules).getByRole("textbox", { name: "Điều lệ giải đấu" }), "\nBản nháp chưa lưu");
    const name = within(details).getByLabelText(/Tên giải đấu/);
    await user.clear(name); await user.type(name, "Updated Cup");
    fireEvent.change(within(details).getByLabelText(/Thời gian kết thúc/), { target: { value: ENTRY.startDate } });
    expect(within(details).getByRole("alert")).toHaveTextContent("kết thúc phải sau");
    expect(saveDetails).toBeDisabled();
    fireEvent.change(within(details).getByLabelText(/Thời gian kết thúc/), { target: { value: ENTRY.endDate } });
    const contact = within(details).getByLabelText(/Thông tin liên hệ/);
    await user.clear(contact); await user.type(contact, "invalid");
    expect(within(details).getByRole("alert")).toHaveTextContent("email hợp lệ");
    expect(saveDetails).toBeDisabled();
    await user.clear(contact); await user.type(contact, "new@example.com");
    await user.click(saveDetails);
    expect(await within(details).findByRole("status")).toHaveTextContent("Đã lưu thông tin chi tiết");
    expect(active()).toMatchObject({ name: "Updated Cup", details: { name: "Updated Cup", contact: "new@example.com" }, rules: "# Old rules" });
    expect(state().publicTournament.name).toBe("Updated Cup");
    expect(within(screen.getByRole("complementary", { name: "Quản lý giải đấu" })).getByRole("heading", { name: "Updated Cup" })).toBeInTheDocument();
    expect(within(rules).getByRole("textbox")).toHaveValue("# Old rules\nBản nháp chưa lưu");
    await user.click(within(rules).getByRole("button", { name: "Lưu thay đổi" }));
    expect(active().rules).toBe("# Old rules\nBản nháp chưa lưu");
    expect(saveDetails).toBeDisabled();
  });
  it("lưu/cảnh báo/xóa ảnh cập nhật dữ liệu thật, không giữ ảnh công khai đã xóa", async () => {
    vi.stubGlobal("Image", class { naturalWidth = 100; naturalHeight = 100; set src(value) { queueMicrotask(() => this.onload?.()); } });
    open("/tournament/details", { publicTournament: { id: ENTRY.id, name: ENTRY.name, image: "old-image" } });
    await screen.findByRole("heading", { level: 1, name: "Chi tiết giải đấu" }, { timeout: 5000 });
    const images = region("Hình ảnh giải đấu");
    const user = userEvent.setup();
    await user.upload(within(images).getByLabelText("Tải ảnh đại diện giải đấu"), new File(["valid"], "avatar.png", { type: "image/png" }));
    expect(await within(images).findByAltText("Xem trước ảnh đại diện giải đấu")).toBeInTheDocument();
    expect(within(images).getByRole("status")).toHaveTextContent("100x100");
    const save = within(images).getByRole("button", { name: "Lưu thay đổi" });
    expect(save).toBeEnabled();
    await user.click(save);
    const image = active().profileImg;
    expect(image).toMatch(/^data:image\/png;base64,/);
    expect(state().publicTournament.image).toBe(image);
    expect(active().name).toBe(ENTRY.name);
    await user.click(within(images).getByRole("button", { name: "Xóa ảnh" }));
    await user.click(save);
    expect(active().profileImg).toBe("");
    expect(state().publicTournament.image).not.toBe(image);
    expect(state().publicTournament.image).not.toBe("old-image");
  });
  it("đổi giải không mang theo bản nháp, tham số id chọn đúng dữ liệu", async () => {
    open("/tournament/details?id=tourney_two");
    await screen.findByRole("heading", { level: 1, name: "Chi tiết giải đấu" }, { timeout: 5000 });
    await waitFor(() => expect(within(region("Chi tiết giải đấu")).getByLabelText(/Tên giải đấu/)).toHaveValue("Other Cup"));
    const user = userEvent.setup();
    const name = within(region("Chi tiết giải đấu")).getByLabelText(/Tên giải đấu/);
    await user.clear(name); await user.type(name, "Unsaved Other");
    await user.selectOptions(screen.getByRole("combobox", { name: "Giải đấu đang quản lý" }), ENTRY.id);
    expect(within(region("Chi tiết giải đấu")).getByLabelText(/Tên giải đấu/)).toHaveValue(ENTRY.name);
    expect(state().tournaments.find((entry) => entry.id === OTHER.id).name).toBe("Other Cup");
    expect(screen.getByTestId("location")).toHaveTextContent("id=tourney_one");
  });
  it("id không tồn tại hoặc không có giải thì không ghi nhầm dữ liệu", async () => {
    const page = open("/tournament/details?id=missing");
    expect(await screen.findByText("Không tìm thấy giải đấu được yêu cầu")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Tên giải đấu/)).not.toBeInTheDocument();
    expect(state().tournaments[0].name).toBe(ENTRY.name);
    page.unmount();
    open("/tournament/details", { tournaments: [], activeTournamentId: null });
    expect(await screen.findByText("Chưa chọn giải đấu")).toBeInTheDocument();
    expect(state().tournaments).toEqual([]);
  });
});

describe("Phiên 4: Đăng ký, Bộ môn và Đội tuyển", () => {
  it("giới hạn số nguyên 4–20, ngày đăng ký đúng thứ tự và lưu cố định 4/16/FREE", async () => {
    open("/tournament/registration-settings");
    await screen.findByRole("heading", { level: 1, name: "Cài đặt đăng ký" }, { timeout: 5000 });
    const card = region("Cài đặt đăng ký");
    const start = within(card).getByLabelText(/Thời gian mở đăng ký/);
    const end = within(card).getByLabelText(/Thời gian đóng đăng ký/);
    const maximum = within(card).getByLabelText(/Số thành viên tối đa/);
    const save = within(card).getByRole("button", { name: "Lưu thay đổi" });
    expect(within(card).getByLabelText(/Số thành viên tối thiểu/)).toBeDisabled();
    expect(within(card).getByLabelText(/Số đội tối đa/)).toHaveValue(16);
    expect(save).toBeDisabled();
    fireEvent.change(start, { target: { value: "2026-11-01T10:00" } });
    fireEvent.change(end, { target: { value: "2026-11-01T10:00" } });
    fireEvent.change(maximum, { target: { value: "4" } });
    expect(within(card).getByRole("alert")).toHaveTextContent("đóng đăng ký phải sau");
    fireEvent.change(end, { target: { value: "2026-11-02T10:00" } });
    for (const value of ["3", "21", "4.5"]) {
      fireEvent.change(maximum, { target: { value } });
      expect(within(card).getByRole("alert")).toBeInTheDocument(); expect(save).toBeDisabled();
    }
    fireEvent.change(maximum, { target: { value: "20" } });
    await userEvent.click(save);
    expect(active().regSettings).toMatchObject({ minTeamSize: 4, maxTeamSize: 20, maxTeams: 16, feeType: "FREE" });
    expect(save).toBeDisabled();
    fireEvent.change(maximum, { target: { value: "" } }); fireEvent.change(maximum, { target: { value: "20" } });
    expect(save).toBeDisabled();
  });
  it("chọn 8 game/4 thể thức, lưu SWISS và đồng bộ về Dashboard", async () => {
    open("/tournament/game-info", { publicTournament: { id: ENTRY.id, name: ENTRY.name, game: "Valorant" } });
    await screen.findByRole("heading", { level: 1, name: "Thông tin game" }, { timeout: 5000 });
    const card = region("THÔNG TIN GAME");
    const game = within(card).getByLabelText(/Tựa game/);
    const format = within(card).getByLabelText(/Thể thức nhánh đấu/);
    expect(within(game).getAllByRole("option")).toHaveLength(ORGANIZER_GAMES.length + 1);
    expect(within(format).getAllByRole("option")).toHaveLength(4);
    expect(within(card).getByRole("radio", { name: "Giải đấu 1 giai đoạn" })).toBeChecked();
    const user = userEvent.setup();
    await user.selectOptions(game, "CS2"); await user.selectOptions(format, "SWISS");
    await user.click(within(card).getByRole("button", { name: "Lưu thay đổi" }));
    expect(active().gameInfo).toEqual({ game: "CS2", stageType: "SINGLE_STAGE", format: "SWISS" });
    expect(state().publicTournament.game).toBe("CS2");
    await user.click(within(screen.getByRole("navigation", { name: "Lối tắt không gian quản lý" })).getByRole("link", { name: "Tổng quan" }));
    const link = await screen.findByRole("link", { name: "Xem giải đấu Autumn Cup" });
    expect(link).toHaveTextContent("Counter-Strike 2");
  });
  it("thêm đội tách thành viên đúng, tìm theo thành viên và không trộn đội giữa các giải", async () => {
    open("/tournament/teams");
    await screen.findByRole("heading", { level: 1, name: "Đội tuyển" }, { timeout: 5000 });
    expect(screen.getByText("Chưa có đội tuyển nào")).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Thêm đội tuyển" }));
    const dialog = screen.getByRole("dialog", { name: "Thêm đội tuyển" });
    await user.click(within(dialog).getByRole("button", { name: "Lưu đội tuyển" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("đầy đủ tên đội tuyển");
    await user.type(within(dialog).getByLabelText(/Tên đội tuyển/), "T1");
    await user.type(within(dialog).getByLabelText(/Danh sách thành viên/), "Faker / Oner, Chovy");
    await user.click(within(dialog).getByRole("button", { name: "Lưu đội tuyển" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(active().tournamentTeams[0]).toMatchObject({ name: "T1", members: ["Faker", "Oner", "Chovy"] });
    const search = screen.getByRole("searchbox", { name: "Tìm đội tuyển hoặc thành viên" });
    await user.type(search, "Chovy");
    expect(screen.getByRole("table", { name: "Đội tuyển trong giải" })).toHaveTextContent("T1");
    await user.clear(search); await user.type(search, "Missing");
    expect(screen.getByText("Không tìm thấy đội tuyển phù hợp.")).toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox", { name: "Giải đấu đang quản lý" }), OTHER.id);
    expect(screen.getByText("Chưa có đội tuyển nào")).toBeInTheDocument();
    expect(active().tournamentTeams).toEqual([]);
    await user.selectOptions(screen.getByRole("combobox", { name: "Giải đấu đang quản lý" }), ENTRY.id);
    expect(screen.getByRole("table")).toHaveTextContent("Faker / Oner / Chovy");
    expect(JSON.parse(sessionStorage.getItem("btp_tournament_teams"))[0].name).toBe("T1");
  });
});
