import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "@/App";
import { TourneyProvider, useTourney } from "@/context/TourneyContext";
import { STORE_KEY } from "@/lib/tourney-store";
import { safeReturnTo } from "@/lib/navigation";

const PROFILE = { id: 7, username: "Captain", userCode: "code0007" };
function Probe() {
  const location = useLocation();
  const { setProfile } = useTourney();
  return <><output data-testid="location">{location.pathname}{location.search}{location.hash}</output><button onClick={() => setProfile(PROFILE)}>Simulate login</button></>;
}
function open(path = "/", profile = null) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, rememberLogin: true, profile, tournaments: [{ id: "tourney_kept", name: "Giữ dữ liệu", source: "local" }] }));
  return render(<MemoryRouter initialEntries={[path]}><TourneyProvider><AppRoutes /><Probe /></TourneyProvider></MemoryRouter>);
}
beforeEach(() => vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response("[]", { headers: { "Content-Type": "application/json" } }))));

describe("UX-1: khung nền tảng dùng chung", () => {
  it("giữ nguyên header khi đi qua trang chủ, khám phá, cộng đồng, không gian cá nhân và hồ sơ", async () => {
    open("/", PROFILE);
    await screen.findByRole("heading", { level: 1 }, { timeout: 5000 });
    const header = screen.getByRole("banner", { name: "BTP Tournament" });
    const user = userEvent.setup();
    await user.click(within(header).getByRole("link", { name: "Khám phá giải đấu" }));
    await screen.findByRole("heading", { name: "Tìm kiếm giải đấu" }, { timeout: 5000 });
    expect(screen.getByRole("banner", { name: "BTP Tournament" })).toBe(header);
    expect(within(header).getByRole("link", { name: "Khám phá giải đấu" })).toHaveAttribute("aria-current", "page");
    const primary = within(header).getByRole("navigation", { name: "Điều hướng chính" });
    expect(within(primary).getAllByRole("link")).toHaveLength(3);
    expect(within(primary).getByRole("link", { name: "Tin tức" })).toHaveAttribute("href", "/news");
    expect(within(primary).queryByRole("link", { name: "Trang chủ", exact: true })).not.toBeInTheDocument();
    expect(within(primary).queryByRole("link", { name: "Tạo giải", exact: true })).not.toBeInTheDocument();
    expect(within(header).getByRole("link", { name: "Trang chủ BTP Tournament" })).toHaveAttribute("href", "/");
    await user.click(within(header).getByRole("link", { name: "Cộng đồng", exact: true }));
    await screen.findByRole("heading", { name: "Cộng đồng & Đội tuyển" }, { timeout: 5000 });
    expect(screen.getByRole("banner", { name: "BTP Tournament" })).toBe(header);
    await user.click(within(primary).getByRole("link", { name: "Tin tức" }));
    await screen.findByRole("heading", { name: "Tin tức", level: 1 }, { timeout: 5000 });
    expect(within(primary).getByRole("link", { name: "Tin tức" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("banner", { name: "BTP Tournament" })).toBe(header);
    await user.click(within(header).getByRole("link", { name: "Không gian của tôi" }));
    await screen.findByRole("heading", { name: "Tổng quan của tôi" }, { timeout: 5000 });
    const personal = screen.getByRole("navigation", { name: "Không gian cá nhân" });
    expect(within(personal).getByRole("link", { name: "Tổng quan" })).toHaveAttribute("aria-current", "page");
    await user.click(within(personal).getByRole("link", { name: "Giải đấu của tôi" }));
    await screen.findByRole("heading", { name: "Giải đấu của tôi" }, { timeout: 5000 });
    expect(within(screen.getByRole("navigation", { name: "Không gian cá nhân" })).getByRole("link", { name: "Giải đấu của tôi" })).toHaveAttribute("aria-current", "page");
    await user.click(within(header).getByRole("button", { name: "Tài khoản" }));
    await user.click(screen.getByRole("menuitem", { name: "Xem hồ sơ công khai" }));
    await screen.findByRole("heading", { name: "Captain" }, { timeout: 5000 });
    expect(screen.getByRole("banner", { name: "BTP Tournament" })).toBe(header);
    expect(screen.queryByRole("navigation", { name: "Không gian cá nhân" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });

  it("thay điều khiển khách bằng tài khoản mà không remount header; đăng xuất về trang chủ và giữ dữ liệu", async () => {
    open("/search");
    await screen.findByRole("heading", { name: "Tìm kiếm giải đấu" }, { timeout: 5000 });
    const header = screen.getByRole("banner", { name: "BTP Tournament" });
    expect(within(header).getByRole("link", { name: "Đăng nhập" })).toHaveAttribute("href", "/login?returnTo=%2Fsearch");
    expect(within(header).queryByRole("button", { name: "Tài khoản" })).not.toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Simulate login" }));
    expect(screen.getByRole("banner", { name: "BTP Tournament" })).toBe(header);
    expect(within(header).queryByRole("link", { name: "Đăng nhập" })).not.toBeInTheDocument();
    await user.click(within(header).getByRole("button", { name: "Tài khoản" }));
    expect(screen.getByText("code0007")).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "Đăng xuất" }));
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/));
    expect(screen.getByRole("banner", { name: "BTP Tournament" })).toBe(header);
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    expect(saved.profile).toBeNull();
    expect(saved.tournaments[0].name).toBe("Giữ dữ liệu");
  });

  it("menu mobile hỗ trợ bàn phím, đóng sau khi chọn trang và không thêm vùng main", async () => {
    open("/", PROFILE);
    await screen.findByRole("heading", { level: 1 });
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: "Mở menu" });
    trigger.focus(); await user.keyboard("{Enter}");
    const menu = screen.getByRole("dialog", { name: "Menu điều hướng" });
    const mobileNavigation = within(menu).getByRole("navigation", { name: "Điều hướng mobile" });
    expect(within(mobileNavigation).getAllByRole("link")).toHaveLength(3);
    const link = within(menu).getByRole("link", { name: "Tin tức" });
    link.focus(); await user.keyboard("{Enter}");
    await screen.findByRole("heading", { name: "Tin tức", level: 1 }, { timeout: 5000 });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole("heading", { name: "Tin tức", level: 1 })).toHaveFocus());
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(document.querySelectorAll("#main-content")).toHaveLength(1);
  });

  it("đóng menu mobile khi tăng viewport tới desktop", async () => {
    let resize;
    vi.spyOn(window, "matchMedia").mockImplementation((media) => ({ matches: false, media,
      addEventListener: (_type, callback) => { if (media === "(min-width: 1024px)") resize = callback; }, removeEventListener: vi.fn(),
    }));
    open(); await screen.findByRole("heading", { level: 1 });
    await userEvent.click(screen.getByRole("button", { name: "Mở menu" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    act(() => resize({ matches: true }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("không có rail quản lý ở trang công khai hoặc lịch public; vẫn có rail và đường về website trong quản lý", async () => {
    const rendered = open("/tournament/schedule?id=missing&view=public");
    await screen.findByRole("heading", { level: 1, name: "Lịch thi đấu" }, { timeout: 5000 });
    expect(screen.queryByRole("complementary", { name: "Thanh điều hướng không gian quản lý" })).not.toBeInTheDocument();
    rendered.unmount(); open("/tournament/details", PROFILE);
    await screen.findByRole("heading", { level: 1, name: "Chi tiết giải đấu" }, { timeout: 5000 });
    const rail = screen.getByRole("complementary", { name: "Thanh điều hướng không gian quản lý" });
    expect(within(rail).getByRole("link", { name: "Về website" })).toHaveAttribute("href", "/");
    expect(screen.getAllByRole("main")).toHaveLength(1);
    await userEvent.click(within(rail).getByRole("link", { name: "Về website" }));
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/));
  });

  it("header xác thực cho quay lại đúng query/hash trước đó", async () => {
    open("/login?returnTo=" + encodeURIComponent("/search?game=valorant#results"));
    expect(within(screen.getByRole("banner", { name: "BTP Tournament" })).getByRole("link", { name: "Quay lại" })).toHaveAttribute("href", "/search?game=valorant#results");
    await userEvent.click(screen.getByRole("link", { name: "Quay lại" }));
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/search?game=valorant#results"));
  });

  it.each(["https://example.com", "//example.com", "/%2Fexample.com", "/\\example.com", "/login?returnTo=/register", "/auth/verify", "/search%0A", "/%ZZ"])("bỏ đích quay lại không hợp lệ: %s", (path) => {
    expect(safeReturnTo(path)).toBe("/");
  });
});
