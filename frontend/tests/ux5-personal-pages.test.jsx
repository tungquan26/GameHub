import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "@/App";
import { TourneyProvider, useTourney } from "@/context/TourneyContext";
import { STORE_KEY } from "@/lib/tourney-store";
import { generateBracket } from "@/lib/bracket";
import { tournamentKey } from "@/lib/public-tournament";

const profile = { id: 7, tagName: "Captain" };
const regSettings = { registrationStartDate: "2026-10-01T10:00", registrationEndDate: "2026-11-10T18:00", maxTeamSize: 5 };
const cup = (id, extra = {}) => ({ id, name: `Owned Cup ${id}`, ownerId: 7, game: "Valorant", regSettings, startDate: "2099-11-15T10:00", endDate: "2099-11-20T18:00", ...extra });
const team = { id: "team_alpha", name: "Alpha", game: "Valorant", captain: "Captain", captainKey: "id:7", members: ["Captain"], memberIdentities: { "id:7": "Captain" }, pendingRequests: ["Applicant"], requestIdentities: { "id:8": "Applicant" }, recruiting: true };
function Controls() {
  const { setProfile, apiStatus } = useTourney(); const location = useLocation(); const navigate = useNavigate();
  return <><span data-testid="api-status">{apiStatus}</span><span data-testid="location">{location.pathname}{location.search}{location.hash}</span><button onClick={() => navigate(-1)}>History back</button><button onClick={() => setProfile({ id: 8, tagName: "Captain" })}>Switch account</button><Link to="/dashboard">Open overview</Link><Link to="/events">Open events</Link><Link to="/profile">Open profile</Link></>;
}
function open(path, extra = {}) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, rememberLogin: true, profile, tournaments: [], teams: [], ...extra }));
  return render(<MemoryRouter initialEntries={[path]}><TourneyProvider><AppRoutes /><Controls /></TourneyProvider></MemoryRouter>);
}
const current = () => screen.getByTestId("location").textContent;
const state = () => JSON.parse(localStorage.getItem(STORE_KEY));
const ready = (name) => screen.findByRole("heading", { name, level: 1 }, { timeout: 5000 });
beforeEach(() => vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response("[]", { headers: { "Content-Type": "application/json" } }))));

describe("UX-5: dashboard và danh sách cá nhân", () => {
  it("dashboard/events/hồ sơ gộp hoạt động có danh tính và giữ quyền theo chủ sở hữu", async () => {
    open("/dashboard", { tournaments: [cup(1), cup(2), cup(3, { status: "COMPLETED" }), cup(4, { ownerId: 8 }), cup("tourney_old", { ownerId: null, source: "local" })], registeredTournaments: [cup(10, { ownerId: 8, registrantKey: "id:7" }), { id: 1, sample: true, registrantKey: "id:7" }], teams: [team, { ...team, id: "sample", sample: true }] });
    await ready("Tổng quan của tôi");
    expect(screen.getByRole("link", { name: "Giải tổ chức: 3" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Giải tham gia: 2" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đội của tôi: 2" })).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Giải đang hoạt động" })).getAllByRole("article")).toHaveLength(3);
    expect(screen.queryByText("Hoạt động trên giải mẫu")).not.toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole("link", { name: "Giải tổ chức: 3" })); await ready("Giải đấu của tôi");
    expect(screen.getByRole("button", { name: "Ban tổ chức", exact: true })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.queryByRole("link", { name: "Xem giải đấu Owned Cup 10" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Open profile" })); await ready("Captain");
    expect(screen.getByRole("link", { name: /Owned Cup 3/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Owned Cup 10/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Owned Cup 4/ })).not.toBeInTheDocument();
    const all = screen.getAllByRole("link", { name: "Xem tất cả" });
    expect(all.map((item) => item.getAttribute("href"))).toEqual(["/events?role=Player", "/events?role=Organizer"]);
  });

  it("tải giải có owner từ API và gộp dữ liệu đã lưu", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response(JSON.stringify([cup(2), cup(3, { ownerId: 8 })]), { headers: { "Content-Type": "application/json" } })));
    open("/dashboard", { tournaments: [cup(1)] });
    await screen.findByRole("link", { name: "Giải tổ chức: 2" });
    expect(state().tournaments).toHaveLength(3);
    expect(screen.queryByRole("link", { name: "Xem giải đấu Owned Cup 3" })).not.toBeInTheDocument();
  });

  it.each([
    ["/", /SIMPLIFIED/],
    ["/search", "Tìm kiếm giải đấu"],
    ["/dashboard", "Tổng quan của tôi"],
    ["/events", "Giải đấu của tôi"],
    ["/profile", "Captain"],
  ])("%s giữ dữ liệu khi API lỗi, không hiện thông báo hoặc thử lại", async (path, heading) => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Offline")));
    const cached = cup(1, { status: "OPEN_REGISTRATION", regSettings: null });
    open(path, { tournaments: [cached] });
    await ready(heading);
    await waitFor(() => expect(screen.getByTestId("api-status")).toHaveTextContent("error"));
    expect(screen.queryByText(/Chưa thể tải thêm giải đấu/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Thử lại" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Owned Cup 1").length).toBeGreaterThan(0);
    expect(state().tournaments).toEqual([cached]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("đổi tài khoản cùng GamerTag xóa số liệu, công việc và quyền của tài khoản cũ", async () => {
    open("/dashboard", { tournaments: [cup(1, { game: "", regSettings: null })], teams: [team] }); await ready("Tổng quan của tôi");
    expect(screen.getByRole("link", { name: /Duyệt 1 yêu cầu vào đội/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Switch account" }));
    await screen.findByRole("link", { name: "Giải tổ chức: 0" });
    expect(screen.getByRole("link", { name: "Đội của tôi: 0" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Chọn bộ môn thi đấu/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Duyệt 1 yêu cầu vào đội/ })).not.toBeInTheDocument();
    expect(state().tournaments).toHaveLength(1);
  });

  it("liên kết quản lý mở đúng giải, Back giữ tìm kiếm/vai trò/trang Events", async () => {
    const path = "/events?role=Organizer&q=Owned&page=2#list";
    open(path, { tournaments: Array.from({ length: 7 }, (_, index) => cup(index + 1)), activeTournamentId: 1 });
    await ready("Giải đấu của tôi");
    const user = userEvent.setup();
    const manage = screen.getByRole("link", { name: "Quản lý giải đấu Owned Cup 6" });
    expect(manage).toHaveAttribute("href", "/tournament/details?id=6");
    await user.click(manage); await ready("Chi tiết giải đấu");
    expect(screen.getByLabelText(/Tên giải đấu/)).toHaveValue("Owned Cup 6");
    await user.click(screen.getByRole("button", { name: "History back" })); await ready("Giải đấu của tôi");
    expect(current()).toBe(path);
    expect(screen.getByRole("searchbox")).toHaveValue("Owned");
    expect(screen.getByRole("button", { name: "Trang 2", exact: true })).toHaveAttribute("aria-current", "page");
    await user.click(screen.getByRole("button", { name: "Tuyển thủ", exact: true }));
    await waitFor(() => expect(new URL(current(), "https://btp.local").searchParams.has("page")).toBe(false));
  });
});

describe("UX-5: công việc và hoạt động cập nhật sau thao tác thật", () => {
  it("hoàn thiện game/đăng ký làm mất đúng công việc, giữ các giải khác", async () => {
    open("/dashboard", { tournaments: [cup(1, { game: "", gameInfo: { game: "", stageType: "SINGLE_STAGE", format: "SINGLE_ELIMINATION" }, regSettings: null }), cup(2)] });
    const user = userEvent.setup(); await ready("Tổng quan của tôi");
    await user.click(screen.getByRole("link", { name: /Chọn bộ môn thi đấu/ })); await ready("Thông tin game");
    expect(current()).toContain("id=1");
    await user.selectOptions(screen.getByLabelText(/Tựa game/), "Valorant");
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    await user.click(screen.getByRole("link", { name: "Open overview" })); await ready("Tổng quan của tôi");
    expect(screen.queryByRole("link", { name: /Chọn bộ môn thi đấu/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: /Hoàn tất cài đặt đăng ký/ })); await ready("Cài đặt đăng ký");
    fireEvent.change(screen.getByLabelText(/Thời gian mở đăng ký/), { target: { value: "2099-10-01T10:00" } });
    fireEvent.change(screen.getByLabelText(/Thời gian đóng đăng ký/), { target: { value: "2099-11-01T10:00" } });
    fireEvent.change(screen.getByLabelText(/Số thành viên tối đa mỗi đội/), { target: { value: "5" } });
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    await user.click(screen.getByRole("link", { name: "Open overview" })); await ready("Tổng quan của tôi");
    expect(screen.queryByRole("link", { name: /Hoàn tất cài đặt đăng ký/ })).not.toBeInTheDocument();
    expect(state().tournaments[1].name).toBe("Owned Cup 2");
  });

  it("công việc đội mở đúng đội và danh sách chờ duyệt, duyệt xong cập nhật dashboard", async () => {
    open("/dashboard", { teams: [team] }); const user = userEvent.setup(); await ready("Tổng quan của tôi");
    await user.click(screen.getByRole("link", { name: /Duyệt 1 yêu cầu vào đội/ })); await ready("Cộng đồng & Đội tuyển");
    const mine = screen.getByRole("region", { name: "Đội tuyển của tôi" });
    const card = within(mine).getByRole("article", { name: "Alpha" });
    await waitFor(() => expect(card).toHaveFocus());
    expect(within(card).getByRole("button", { name: "Thành viên (1)" })).toHaveAttribute("aria-expanded", "true");
    await user.click(within(card).getByRole("button", { name: "Đồng ý Applicant" }));
    expect(state().teams[0].members).toContain("Applicant");
    await user.click(screen.getByRole("link", { name: "Open overview" })); await ready("Tổng quan của tôi");
    expect(screen.queryByRole("link", { name: /Duyệt .* yêu cầu vào đội/ })).not.toBeInTheDocument();
  });

  it("tạo đội từ hướng dẫn cập nhật số đội, cộng đồng và không tạo giải mẫu", async () => {
    open("/dashboard"); const user = userEvent.setup(); await screen.findByRole("link", { name: "Tạo đội tuyển đầu tiên" });
    await user.click(screen.getByRole("link", { name: "Tạo đội tuyển đầu tiên" }));
    const dialog = await screen.findByRole("dialog", { name: "Tạo Đội Tuyển Mới" });
    await user.type(within(dialog).getByLabelText(/Tên Đội Tuyển/), "My new team");
    await user.selectOptions(within(dialog).getByLabelText(/Tựa Game Thi Đấu Chính/), "CS2");
    await user.click(within(dialog).getByRole("button", { name: "Lưu Đội Tuyển" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(within(screen.getByRole("region", { name: "Đội tuyển của tôi" })).getByRole("article", { name: "My new team" })).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Open overview" })); await ready("Tổng quan của tôi");
    expect(screen.getByRole("link", { name: "Đội của tôi: 1" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Giải tổ chức: 0" })).toBeInTheDocument();
  });

  it("đăng ký giải thật cập nhật tổng quan, Events và hồ sơ", async () => {
    const publicCup = cup(10, { ownerId: 8, status: "OPEN_REGISTRATION", regSettings: null });
    open("/tournament/view?id=10", { tournaments: [publicCup] }); const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Đăng ký tham gia" }));
    await user.click(screen.getByRole("link", { name: "Open overview" })); await ready("Tổng quan của tôi");
    expect(screen.getByRole("link", { name: "Giải tham gia: 1" })).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Giải tham gia: 1" })); await ready("Giải đấu của tôi");
    expect(screen.getByRole("link", { name: "Xem giải đấu Owned Cup 10" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Quản lý giải đấu Owned Cup 10/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Open profile" })); await ready("Captain");
    expect(screen.getByRole("link", { name: /Owned Cup 10/ })).toBeInTheDocument();
  });

  it("cộng đồng khách ưu tiên khám phá; đội có danh tính thành viên được gộp vào đội của tôi", async () => {
    const page = open("/community", { profile: null, teams: [team] }); await ready("Cộng đồng & Đội tuyển");
    expect(screen.queryByRole("region", { name: "Đội tuyển của tôi" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Khám phá Đội tuyển Cộng đồng" })).toBeInTheDocument();
    page.unmount(); open("/community", { teams: [{ ...team, sample: true }] }); await ready("Cộng đồng & Đội tuyển");
    expect(within(screen.getByRole("region", { name: "Đội tuyển của tôi" })).getByRole("article", { name: "Alpha" })).toBeInTheDocument();
    expect(screen.queryByText("Hoạt động ở đội mẫu")).not.toBeInTheDocument();
  });

  it("chỉ hiện trận đã lưu thuộc đội, mở đúng lịch và không sửa nhánh khi xem dashboard", async () => {
    const entry = cup(1, { tournamentTeams: [{ id: team.id, name: team.name, members: [] }, ...[2, 3, 4].map((id) => ({ id, name: `Opponent ${id}`, members: [] }))] });
    const bracket = generateBracket(entry, 4); const brackets = { [tournamentKey(entry)]: bracket };
    open("/dashboard", { tournaments: [entry], teams: [team], brackets }); await ready("Tổng quan của tôi");
    const matches = screen.getByRole("region", { name: "Trận sắp tới" });
    const link = within(matches).getByRole("link", { name: /Alpha vs Opponent 2/ });
    expect(link).toHaveAttribute("href", "/tournament/schedule?id=1#match-101");
    expect(state().brackets).toEqual(brackets);
    await userEvent.click(link); await ready("Lịch thi đấu");
    expect(document.getElementById("match-101")).toHaveTextContent("Alpha");
    expect(state().brackets).toEqual(brackets);
  });
});
