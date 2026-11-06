import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "@/App";
import { PAGE_ROUTES } from "@/constants/routes";
import { TourneyProvider } from "@/context/TourneyContext";
import { STORE_KEY } from "@/lib/tourney-store";
import { requiresAuthentication } from "@/lib/navigation";

function signIn() { localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, rememberLogin: true, profile: { id: 7, username: "Captain" }, tournaments: [] })); }

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}{location.hash}</output>;
}
function openRoute(path) {
  return render(<MemoryRouter initialEntries={[path]}><TourneyProvider><AppRoutes /><LocationProbe /></TourneyProvider></MemoryRouter>);
}

describe("Routes và layouts", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("[]", { headers: { "Content-Type": "application/json" } }))));
  it.each(PAGE_ROUTES)("truy cập trực tiếp $path bằng đúng layout", async (page) => {
    if (requiresAuthentication({ pathname: page.path, search: "" })) signIn();
    openRoute(page.path);
    const headings = { "/": /SIMPLIFIED.*TOURNAMENT.*MANAGEMENT/, "/register": "Tạo tài khoản", "/profile": "tungquan", "/profile/settings": "Cài đặt hồ sơ", "/community": "Cộng đồng & Đội tuyển" };
    expect(await screen.findByRole("heading", { level: 1, name: headings[page.path] || page.title }, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.queryAllByRole("navigation", { name: "Điều hướng chính" })).toHaveLength(
      page.layout === "auth" ? 0 : 1,
    );
    expect(screen.queryAllByRole("navigation", { name: "Cài đặt giải đấu" })).toHaveLength(page.layout === "tournament" ? 1 : 0);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("banner", { name: "BTP Tournament" })).toHaveLength(1);
    expect(document.querySelectorAll("[data-platform-header]")).toHaveLength(1);
    expect(document.querySelectorAll("#main-content")).toHaveLength(1);
    expect(screen.queryAllByRole("complementary", { name: "Thanh điều hướng không gian quản lý" })).toHaveLength(page.layout === "tournament" ? 1 : 0);
  });

  it.each(["login", "register", "verify"])("giữ alias /auth/%s và query/hash", async (page) => {
    openRoute(`/auth/${page}?email=test%40example.com#form`);
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent(`/${page}?email=test%40example.com#form`));
  });

  it("chuyển /tournament sang trang chủ và giữ id giải", async () => {
    signIn();
    openRoute("/tournament?id=42");
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/tournament/home?id=42"));
  });

  it("giữ query khi chuyển mục quản lý giải đấu", async () => {
    signIn();
    openRoute("/tournament/details?id=42&name=Autumn");
    const nav = screen.getByRole("navigation", { name: "Cài đặt giải đấu" });
    const link = [...nav.querySelectorAll("a")].find((node) => node.textContent === "Lịch thi đấu");
    await userEvent.click(link);
    expect(screen.getByTestId("location")).toHaveTextContent("/tournament/schedule?id=42&name=Autumn");
  });

  it("menu tài khoản điều hướng đúng tab cài đặt", async () => {
    localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, rememberLogin: true, profile: { id: 7, username: "Captain" }, tournaments: [] }));
    openRoute("/dashboard");
    await userEvent.click(screen.getByRole("button", { name: "Tài khoản", exact: true }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Cài đặt tài khoản" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/profile/settings?tab=account");
  });

  it("menu mobile mở được và đóng bằng Escape", async () => {
    openRoute("/search");
    await userEvent.click(screen.getByRole("button", { name: "Mở menu" }));
    expect(screen.getByRole("dialog", { name: "Menu điều hướng" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("hiển thị 404 cho đường dẫn không tồn tại", () => {
    openRoute("/khong-ton-tai");
    expect(screen.getByRole("heading", { name: "Không tìm thấy trang" })).toBeInTheDocument();
  });
});
