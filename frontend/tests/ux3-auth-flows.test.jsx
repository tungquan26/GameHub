import { StrictMode } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "@/App";
import { TourneyProvider } from "@/context/TourneyContext";
import { authApi } from "@/lib/api";
import { STORE_KEY } from "@/lib/tourney-store";
import { findSample } from "@/constants/tournament-catalog";

const profile = { id: 7, username: "Captain" };
const team = { id: "alpha", name: "Alpha", captain: "Other", captainKey: "id:8", members: ["Other"], pendingRequests: [], game: "Valorant", recruiting: true };
function Probe() {
  const location = useLocation(); const navigate = useNavigate();
  return <><span data-testid="location">{location.pathname}{location.search}{location.hash}</span><button onClick={() => navigate(-1)}>History back</button></>;
}
function open(path, extra = {}, { strict = false, previous } = {}) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, profile: null, tournaments: [], ...extra }));
  const content = <MemoryRouter initialEntries={previous ? [previous, path] : [path]} initialIndex={previous ? 1 : 0}><TourneyProvider><AppRoutes /><Probe /></TourneyProvider></MemoryRouter>;
  return render(strict ? <StrictMode>{content}</StrictMode> : content);
}
const state = () => JSON.parse(localStorage.getItem(STORE_KEY));
const current = () => screen.getByTestId("location").textContent;
const destination = () => new URLSearchParams(new URL(current(), "https://btp.local").search).get("returnTo");
async function login(user = userEvent.setup()) {
  await user.type(screen.getByLabelText(/Tên người dùng/), "Captain");
  await user.type(screen.getByLabelText(/^Mật khẩu/, { selector: "input" }), "secret");
  await user.click(screen.getByRole("button", { name: "Đăng nhập", exact: true }));
}
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response("[]", { headers: { "Content-Type": "application/json" } })));
  vi.spyOn(authApi, "login").mockResolvedValue({ userId: 7, username: "Captain" });
});

describe("UX-3: route yêu cầu đăng nhập", () => {
  it.each(["/dashboard", "/events?role=player#list", "/create?source=home#form", "/profile/settings?tab=account#email", "/tournament/home?id=31", "/tournament/details?id=31#rules", "/tournament/registration-settings?id=31", "/tournament/teams?id=31", "/tournament/game-info?id=31", "/tournament/schedule?id=31", "/DASHBOARD/", "/%64ashboard"])("khách vào %s được chuyển tới login trước khi hiển thị nội dung cá nhân", async (path) => {
    open(path);
    await screen.findByRole("heading", { level: 1, name: "Đăng nhập" });
    expect(destination()).toBe(path);
    expect(screen.queryByRole("navigation", { name: "Không gian cá nhân" })).not.toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: "Quản lý giải đấu" })).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("alias /tournament giữ ID/hash trong đích đăng nhập", async () => {
    open("/tournament?id=31#builder");
    await screen.findByRole("heading", { name: "Đăng nhập", level: 1 });
    expect(destination()).toBe("/tournament/home?id=31#builder");
  });

  it("alias /auth/login giữ đích và đăng nhập về đúng trang", async () => {
    const target = "/create?source=legacy#form";
    open("/auth/login?" + new URLSearchParams({ returnTo: target }));
    await screen.findByRole("heading", { name: "Đăng nhập", level: 1 });
    expect(current()).toBe("/login?" + new URLSearchParams({ returnTo: target }));
    await login();
    await screen.findByRole("heading", { name: "Tạo giải đấu", level: 1 });
    expect(current()).toBe(target);
  });

  it.each(["/search?q=VCT", "/community", "/profile?user=Other", "/tournament/view?id=1&sample=1", "/tournament/schedule?id=1&sample=1&view=public"])("khách vẫn xem được %s", async (path) => {
    open(path);
    await screen.findByRole("heading", { level: 1 }, { timeout: 5000 });
    expect(current()).toBe(path);
    expect(screen.queryByRole("heading", { level: 1, name: "Đăng nhập" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nhập kết quả" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bốc thăm lại nhánh đấu" })).not.toBeInTheDocument();
  });

  it("login thành công về đúng form tạo giải, giữ query/hash và chưa tạo giải", async () => {
    const target = "/create?source=home#form";
    open(target);
    await screen.findByRole("heading", { name: "Đăng nhập", level: 1 });
    expect(screen.getByRole("link", { name: "Về trang chủ", exact: true })).toHaveAttribute("href", "/");
    await login();
    await screen.findByRole("heading", { name: "Tạo giải đấu", level: 1 });
    expect(current()).toBe(target);
    expect(state().tournaments).toEqual([]);
    expect(screen.getByRole("button", { name: "Tạo giải đấu", exact: true })).toBeDisabled();
  });

  it("redirect thay entry hiện tại, Back vẫn trở về trang công khai trước đó", async () => {
    open("/create", {}, { previous: "/search?q=VCT#results" });
    await screen.findByRole("heading", { name: "Đăng nhập", level: 1 });
    await userEvent.click(screen.getByRole("button", { name: "History back" }));
    await screen.findByRole("heading", { name: "Tìm kiếm giải đấu" });
    expect(current()).toBe("/search?q=VCT#results");
  });

  it("lỗi login giữ form và đích để thử lại", async () => {
    authApi.login.mockRejectedValueOnce(Object.assign(new Error("Wrong password"), { status: 401 }));
    open("/profile/settings?tab=account#email");
    await screen.findByRole("heading", { name: "Đăng nhập", level: 1 });
    await login();
    expect(await screen.findByRole("alert")).toHaveTextContent("không chính xác");
    expect(destination()).toBe("/profile/settings?tab=account#email");
    expect(screen.getByLabelText(/Tên người dùng/)).toHaveValue("Captain");
    await userEvent.click(screen.getByRole("button", { name: "Đăng nhập", exact: true }));
    await screen.findByRole("heading", { name: "Cài đặt tài khoản", level: 1 });
    expect(current()).toBe("/profile/settings?tab=account#email");
  });

  it.each([undefined, "https://evil.example", "/LOGIN/", "/auth/%76erify"])("thiếu/sai returnTo (%s) về dashboard, không lặp auth", async (target) => {
    open("/login" + (target ? "?" + new URLSearchParams({ returnTo: target }) : ""));
    expect(screen.getByRole("link", { name: "TẠO TÀI KHOẢN" })).toHaveAttribute("href", "/register");
    await login();
    await screen.findByRole("heading", { name: "Tổng quan của tôi", level: 1 });
    expect(current()).toBe("/dashboard");
  });
});

describe("UX-3: tiếp tục thao tác sau đăng nhập", () => {
  it("đăng ký giải đi qua register/OTP/login về đúng giải, chờ xác nhận mới ghi đăng ký", async () => {
    vi.spyOn(authApi, "register").mockResolvedValue("Success");
    vi.spyOn(authApi, "verify").mockResolvedValue("Verified");
    const target = "/tournament/view?id=1&sample=1&utm=guest#overview";
    open(target);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Đăng ký tham gia" }));
    await screen.findByRole("heading", { name: "Đăng nhập", level: 1 });
    expect(destination()).toBe(target);
    await user.click(screen.getByRole("link", { name: "TẠO TÀI KHOẢN" }));
    expect(destination()).toBe(target);
    await user.type(screen.getByLabelText(/Tên người dùng/), "Captain");
    await user.type(screen.getByLabelText(/^Email/), "a+b@example.com");
    await user.type(screen.getByLabelText(/^Mật khẩu/, { selector: "input" }), "secret");
    await user.type(screen.getByLabelText(/^Nhập lại mật khẩu/, { selector: "input" }), "secret");
    await user.click(screen.getByRole("button", { name: "Tạo tài khoản", exact: true }));
    await screen.findByRole("heading", { name: "Xác thực mã OTP" });
    expect(destination()).toBe(target);
    expect(new URL(current(), "https://btp.local").searchParams.get("email")).toBe("a+b@example.com");
    fireEvent.paste(screen.getByLabelText("Chữ số 1"), { clipboardData: { getData: () => "123456" } });
    await user.click(screen.getByRole("button", { name: "Xác thực", exact: true }));
    await screen.findByRole("heading", { name: "Đăng nhập", level: 1 });
    expect(destination()).toBe(target);
    expect(screen.getByRole("status")).toHaveTextContent("Xác thực email thành công");
    await login(user);
    await screen.findByRole("heading", { name: findSample(1).name, level: 1 });
    expect(current()).toBe(target);
    expect(state().registeredTournaments).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Đăng ký tham gia" }));
    expect(state().registeredTournaments).toHaveLength(1);
    expect(state().registeredTournaments[0]).toMatchObject({ id: 1, sample: true, registrantKey: "id:7" });
  });

  it("liên kết cũ không có ID vẫn thêm định danh trước khi đi login", async () => {
    const cup = { id: 55, name: "Public Cup", status: "open" };
    open("/tournament/view#rules", { tournaments: [cup], activeTournamentId: 55 });
    await userEvent.click(await screen.findByRole("button", { name: "Đăng ký tham gia" }));
    await screen.findByRole("heading", { name: "Đăng nhập", level: 1 });
    expect(destination()).toBe("/tournament/view?id=55#rules");
  });

  it("khách mở lịch từ thông tin giải, giữ đúng ID và chỉ xem", async () => {
    open("/tournament/view?id=1&sample=1");
    const user = userEvent.setup();
    await user.click(await screen.findByRole("link", { name: "Lịch đấu", exact: true }));
    await screen.findByRole("heading", { name: "Lịch thi đấu", level: 2 });
    expect(current()).toContain("/tournament/schedule?id=1&sample=1");
    expect(new URL(current(), "https://btp.local").searchParams.get("view")).toBe("public");
    expect(screen.getByText("Lịch thi đấu chưa được công bố")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nhập kết quả" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Quy mô nhánh đấu" })).not.toBeInTheDocument();
    expect(state().brackets).toEqual({});
    const nav = screen.getByRole("navigation", { name: "Nội dung giải đấu" });
    expect(within(nav).getAllByRole("link")).toHaveLength(4);
  });

  it("tạo đội mở lại form một lần trong StrictMode, giữ chưa ghi và trả focus khi đóng", async () => {
    open("/community?game=valorant#discoverTeamsSection", { teams: [team] }, { strict: true });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Tạo Team mới" }));
    await screen.findByRole("heading", { name: "Đăng nhập", level: 1 });
    expect(destination()).toBe("/community?game=valorant&action=create-team#discoverTeamsSection");
    await login(user);
    const dialog = await screen.findByRole("dialog", { name: "Tạo Đội Tuyển Mới" });
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(state().teams).toHaveLength(1);
    await waitFor(() => expect(current()).toBe("/community?game=valorant#discoverTeamsSection"));
    await user.click(within(dialog).getByRole("button", { name: "Hủy", exact: true }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Tạo Team mới" })).toHaveFocus();
  });

  it("xin vào đội sau login vẫn chờ người dùng bấm xác nhận", async () => {
    open("/community?game=valorant#discoverTeamsSection", { teams: [team] });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Xin vào đội" }));
    await screen.findByRole("heading", { name: "Đăng nhập", level: 1 });
    expect(destination()).toBe("/community?game=valorant&action=join-team&team=alpha#discoverTeamsSection");
    await login(user);
    await screen.findByRole("heading", { name: "Cộng đồng & Đội tuyển", level: 1 });
    expect(await screen.findByRole("status")).toHaveTextContent('đội "Alpha"');
    await waitFor(() => expect(current()).toBe("/community?game=valorant#discoverTeamsSection"));
    expect(state().teams[0].pendingRequests).toEqual([]);
    await user.click(within(screen.getByRole("article", { name: "Alpha" })).getByRole("button", { name: "Xin vào đội" }));
    expect(state().teams[0]).toMatchObject({ pendingRequests: ["Captain"], requestIdentities: { "id:7": "Captain" } });
  });

  it("register quay lại login và OTP thiếu email vẫn chuyển tiếp đúng đích", async () => {
    const target = "/community?action=create-team";
    const page = open("/register?" + new URLSearchParams({ returnTo: target }));
    const link = screen.getByRole("link", { name: /ĐÃ CÓ TÀI KHOẢN/ });
    expect(link).toHaveAttribute("href", "/login?" + new URLSearchParams({ returnTo: target }));
    page.unmount();
    open("/verify?" + new URLSearchParams({ returnTo: target }));
    expect(screen.getByRole("link", { name: "Đăng ký lại" })).toHaveAttribute("href", "/register?" + new URLSearchParams({ returnTo: target }));
  });

  it("lỗi OTP/gửi lại không làm mất đích quay lại", async () => {
    vi.spyOn(authApi, "verify").mockRejectedValue(new Error("Mã đã hết hạn."));
    vi.spyOn(authApi, "resend").mockRejectedValue(new Error("Gửi thư thất bại."));
    const target = "/tournament/view?id=1&sample=1#rules";
    open("/verify?" + new URLSearchParams({ email: "a@example.com", returnTo: target }));
    const user = userEvent.setup();
    fireEvent.paste(screen.getByLabelText("Chữ số 1"), { clipboardData: { getData: () => "123456" } });
    await user.click(screen.getByRole("button", { name: "Xác thực", exact: true }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Mã đã hết hạn");
    expect(destination()).toBe(target);
    await user.click(screen.getByRole("button", { name: "GỬI LẠI MÃ" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Gửi thư thất bại");
    expect(destination()).toBe(target);
  });

  it("đích sửa đội không cấp quyền đội trưởng và không tự ghi dữ liệu", async () => {
    open("/community?action=edit-team&team=alpha", { profile, teams: [team] });
    await screen.findByRole("heading", { name: "Cộng đồng & Đội tuyển", level: 1 });
    await waitFor(() => expect(current()).toBe("/community"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(state().teams[0]).toMatchObject(team);
  });

  it("đăng xuất về trang chủ, giữ dữ liệu và Back không mở lại trang cá nhân", async () => {
    const cup = { id: 31, name: "Owned Cup", ownerId: 7 };
    open("/events", { profile, tournaments: [cup], teams: [team], registeredTournaments: [{ id: 41, name: "Joined", registrantKey: "id:7" }] });
    await screen.findByRole("heading", { name: "Giải đấu của tôi", level: 1 });
    const user = userEvent.setup();
    const header = screen.getByRole("banner", { name: "BTP Tournament" });
    await user.click(within(header).getByRole("button", { name: "Tài khoản" }));
    await user.click(screen.getByRole("menuitem", { name: "Đăng xuất" }));
    await waitFor(() => expect(current()).toBe("/"));
    // The location probe can commit before the lazy home route and sign-out effect.
    expect(await within(header).findByRole("link", { name: "Đăng nhập" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Không gian cá nhân" })).not.toBeInTheDocument();
    await waitFor(() => expect(state()).toMatchObject({ profile: null, tournaments: [cup], registeredTournaments: [{ id: 41 }], teams: [{ id: "alpha" }] }));
    await user.click(screen.getByRole("button", { name: "History back" }));
    await screen.findByRole("heading", { name: "Đăng nhập", level: 1 });
    expect(destination()).toBe("/events");
  });
});
