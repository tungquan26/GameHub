import { lazy, StrictMode, useState } from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "@/App";
import { TourneyProvider } from "@/context/TourneyContext";
import NavigationExperience from "@/components/shared/NavigationExperience";
import PageContent from "@/components/shared/PageContent";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
import { STORE_KEY } from "@/lib/tourney-store";
import { generateBracket } from "@/lib/bracket";
import { pageViewKey } from "@/lib/page-navigation";

const profile = { id: 7, username: "Captain" };
const entries = Array.from({ length: 12 }, (_, index) => ({ id: index + 1, name: `UX7 Cup ${String(index + 1).padStart(2,"0")}`, ownerId: 7, game: "Valorant", startDate: "2099-11-10T10:00", endDate: "2099-11-15T10:00", homepageLayout: [] }));
let y, height, animate;
function Probe() { const navigate = useNavigate(); return <><button onClick={() => navigate(-1)}>History back</button><button onClick={() => navigate(1)}>History forward</button></>; }
function open(path, data = {}) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, rememberLogin: true, profile, tournaments: entries, ...data }));
  return render(<MemoryRouter initialEntries={[path]}><TourneyProvider><AppRoutes /><Probe /></TourneyProvider></MemoryRouter>);
}
async function scrolled(top) { y = top; await act(async () => { window.dispatchEvent(new Event("scroll")); }); }
async function settled() { await act(async () => { await new Promise((done) => setTimeout(done, 45)); }); }
beforeEach(() => {
  y = 0; height = 6000;
  Object.defineProperty(window, "scrollY", { configurable: true, get: () => y });
  Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, get: () => height });
  window.scrollTo = vi.fn((options) => { y = options.top; });
  animate = vi.fn(() => ({ cancel: vi.fn() })); HTMLElement.prototype.animate = animate;
  vi.stubGlobal("fetch", vi.fn(async () => new Response("[]", { headers: { "Content-Type": "application/json" } })));
});

describe("UX-7: chuyển cảnh, cuộn và focus", () => {
  it("khóa chuyển cảnh bỏ bộ lọc/phân trang nhưng tách đúng giải và mục trình bày", () => {
    const location = (path) => new URL(path, "https://btp.local");
    expect(pageViewKey(location("/search?q=one&page=2"))).toBe(pageViewKey(location("/search?q=two&game=valorant#results")));
    expect(pageViewKey(location("/events?role=Organizer"))).toBe(pageViewKey(location("/events?page=2")));
    expect(pageViewKey(location("/tournament/view?id=1"))).not.toBe(pageViewKey(location("/tournament/view?id=1&sample=1")));
    expect(pageViewKey(location("/tournament/view?id=1&tab=teams"))).not.toBe(pageViewKey(location("/tournament/view?id=1&tab=rules")));
  });

  it("gõ tìm kiếm giữ focus/cuộn và không phát lại hiệu ứng toàn trang", async () => {
    open("/search"); await screen.findByRole("heading", { name: "Tìm kiếm giải đấu" }); await settled();
    const user = userEvent.setup(); const input = screen.getByRole("searchbox");
    await user.click(input); await scrolled(210); animate.mockClear(); window.scrollTo.mockClear();
    await user.type(input, "UX7"); await settled();
    expect(input).toHaveFocus(); expect(y).toBe(210); expect(animate).not.toHaveBeenCalled(); expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("Back/Forward giữ trang 2, cuộn và focus về đúng thẻ; header nằm ngoài hiệu ứng", async () => {
    open("/search?q=UX7&game=valorant&page=2#results");
    const link = await screen.findByRole("link", { name: "Xem giải đấu UX7 Cup 06" }); await settled();
    const header = screen.getByRole("banner", { name: "BTP Tournament" });
    link.focus(); await scrolled(670); await userEvent.click(link);
    await screen.findByRole("heading", { level: 1, name: "UX7 Cup 06" }); await settled();
    expect(y).toBe(0); expect(screen.getByRole("heading", { name: "Tổng quan", level: 2 })).toHaveFocus();
    expect(screen.getByRole("banner", { name: "BTP Tournament" })).toBe(header);
    expect(header.closest("[data-page-content]")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "History back" }));
    const returned = await screen.findByRole("link", { name: "Xem giải đấu UX7 Cup 06" }); await settled();
    expect(y).toBe(670); expect(returned).toHaveFocus(); expect(screen.getByRole("searchbox")).toHaveValue("UX7");
    expect(screen.getByRole("button", { name: "Trang 2", exact: true })).toHaveAttribute("aria-current", "page");
    await userEvent.click(screen.getByRole("button", { name: "History forward" })); await screen.findByRole("heading", { name: "UX7 Cup 06", level: 1 }); await settled();
    expect(y).toBe(0);
  });

  it("phân trang đưa tới đầu kết quả mà không chạy lại slide; gõ sau đó giữ focus", async () => {
    open("/search?q=UX7"); await screen.findByRole("link", { name: "Xem giải đấu UX7 Cup 01" }); await settled();
    animate.mockClear(); await userEvent.click(screen.getByRole("button", { name: "Trang 2", exact: true }));
    await screen.findByRole("link", { name: "Xem giải đấu UX7 Cup 06" }); await settled();
    const results = document.getElementById("results"); expect(results.scrollIntoView).toHaveBeenCalled(); expect(results).toHaveFocus(); expect(animate).not.toHaveBeenCalled();
    const input = screen.getByRole("searchbox"); await userEvent.click(input); await userEvent.type(input, " Cup"); await settled(); expect(input).toHaveFocus();
  });

  it("hash đến trận sau khi route tải xong; focus đúng trận và cuộn trong khung", async () => {
    open("/tournament/schedule?id=1&sample=1&view=public#match-201", { profile: null, brackets: { "sample:1": generateBracket({ name: "Saved schedule" }, 8) } });
    const match = await screen.findByRole("article", { name: "Trận #5", exact: true }); await settled();
    expect(match).toHaveAttribute("id", "match-201"); expect(match.scrollIntoView).toHaveBeenCalledWith({ block: "start", inline: "nearest", behavior: "instant" });
    expect(match).toHaveFocus();
  });

  it("StrictMode không lấy vị trí tạm lúc mount để ghi đè hash; reload vẫn dùng snapshot thật", async () => {
    function Content() { return <PageContent><h1>Page</h1><section id="deep">Deep content</section></PageContent>; }
    const first = render(<StrictMode><MemoryRouter initialEntries={["/deep#deep"]}><NavigationExperience><main><Content /></main></NavigationExperience></MemoryRouter></StrictMode>);
    await settled(); expect(document.getElementById("deep").scrollIntoView).toHaveBeenCalled(); expect(document.getElementById("deep")).toHaveFocus(); first.unmount();
    sessionStorage.setItem("btp_navigation_v1", JSON.stringify([["default", { url: "/deep#deep", x: 0, y: 900 }]]));
    window.scrollTo.mockClear();
    render(<StrictMode><MemoryRouter initialEntries={["/deep#deep"]}><NavigationExperience><main><Content /></main></NavigationExperience></MemoryRouter></StrictMode>);
    await settled(); expect(window.scrollTo).toHaveBeenCalledWith({ left: 0, top: 900, behavior: "instant" });
  });

  it("đợi nội dung chậm rồi mới phục hồi cuộn; không giành cuộn sau khi người dùng thao tác", async () => {
    let finish;
    function SlowPage() { const [loading, setLoading] = useState(true); finish = () => setLoading(false); return <><h1>Slow page</h1>{loading ? <div data-navigation-pending>Loading</div> : <p>Ready</p>}</>; }
    sessionStorage.setItem("btp_navigation_v1", JSON.stringify([["slow", { url: "/slow", x: 0, y: 900 }]]));
    height = 700;
    const rendered = render(<MemoryRouter initialEntries={[{ pathname: "/slow", key: "slow" }]}><NavigationExperience><main><PageContent><SlowPage /></PageContent></main></NavigationExperience></MemoryRouter>);
    await settled(); expect(window.scrollTo).not.toHaveBeenCalled();
    height = 6000; await act(async () => finish()); await settled(); expect(y).toBe(900);
    rendered.unmount(); window.scrollTo.mockClear();
    render(<MemoryRouter initialEntries={[{ pathname: "/slow", key: "slow" }]}><NavigationExperience><main><PageContent><SlowPage /></PageContent></main></NavigationExperience></MemoryRouter>);
    await settled(); fireEvent.wheel(window); await act(async () => finish()); await settled();
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("giảm chuyển động bỏ hiệu ứng slide nhưng vẫn focus tiêu đề", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation((media) => ({ matches: media === "(prefers-reduced-motion: reduce)", media, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    open("/search"); await screen.findByRole("heading", { name: "Tìm kiếm giải đấu" }); await settled();
    expect(animate).not.toHaveBeenCalled(); expect(screen.getByRole("heading", { name: "Tìm kiếm giải đấu" })).toHaveFocus();
  });

  it("slide vẫn chạy 350ms khi CSS production rút gọn thời gian thành .35s", () => {
    render(<MemoryRouter>
      <style>{"[data-page-ready] { --dp-page-slide-duration: .35s; }"}</style>
      <PageContent><h1>Production slide</h1></PageContent>
    </MemoryRouter>);
    expect(animate).toHaveBeenCalledWith(
      [{ transform: "translateX(100%)" }, { transform: "translateX(0)" }],
      { duration: 350, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
  });

  it("lazy content dùng skeleton, giữ shell; khi tải xong mới slide nội dung 350ms", async () => {
    let resolve;
    const LazyPage = lazy(() => new Promise((done) => { resolve = done; }));
    render(<MemoryRouter><NavigationExperience><header data-testid="shell">Shell</header><main><PageContent page={{ title: "Chi tiết", layout: "tournament" }}><LazyPage /></PageContent></main></NavigationExperience></MemoryRouter>);
    expect(screen.getByRole("status", { name: "Đang tải Chi tiết" })).toBeInTheDocument();
    expect(screen.getByTestId("shell").closest("[data-page-content]")).toBeNull(); expect(animate).not.toHaveBeenCalled();
    await act(async () => resolve({ default: () => <h1>Loaded page</h1> })); await settled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument(); expect(screen.getByRole("heading", { name: "Loaded page" })).toHaveFocus();
    expect(animate).toHaveBeenCalledWith([{ transform: "translateX(100%)" }, { transform: "translateX(0)" }], { duration: 350, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
    expect(animate.mock.instances.at(-1)).toHaveAttribute("data-page-ready");
  });

  it("chuyển liên tiếp hủy animation trang cũ; unmount hủy animation đang chạy", async () => {
    const rendered = render(<MemoryRouter initialEntries={["/first"]}><Routes>
      <Route path="/first" element={<PageContent><h1>First</h1><Link to="/second">Next page</Link></PageContent>} />
      <Route path="/second" element={<PageContent><h1>Second</h1></PageContent>} />
    </Routes></MemoryRouter>);
    const first = animate.mock.results.at(-1).value;
    await userEvent.click(screen.getByRole("link", { name: "Next page" }));
    expect(screen.getByRole("heading", { name: "Second" })).toBeInTheDocument();
    expect(first.cancel).toHaveBeenCalledTimes(1);
    const second = animate.mock.results.at(-1).value;
    expect(second).not.toBe(first);
    rendered.unmount();
    expect(second.cancel).toHaveBeenCalledTimes(1);
  });

  it("mục lưu trữ mở và số thẻ vẫn giữ khi Back từ chi tiết", async () => {
    open("/events", { tournaments: Array.from({ length: 8 }, (_, index) => ({ id: `tourney_old_${index}`, name: `Archived Cup ${index}`, source: "local" })) }); await screen.findByRole("heading", { name: "Bạn chưa có giải đấu nào" }); await settled();
    await userEvent.click(screen.getByText("Giải đấu khác"));
    const link = await screen.findAllByRole("link", { name: /^Xem giải đấu / }); await userEvent.click(link[0]);
    await screen.findByRole("navigation", { name: "Nội dung giải đấu" });
    await userEvent.click(screen.getByRole("button", { name: "History back" }));
    const summary = await screen.findByText("Giải đấu khác"); await settled();
    expect(summary.closest("details")).toHaveAttribute("open"); expect(screen.getAllByRole("article").length).toBeGreaterThan(5);
  });

  it("phân trang hồ sơ được giữ sau khi mở giải rồi Back", async () => {
    open("/profile");
    const title = await screen.findByRole("heading", { name: "GIẢI ĐẤU ĐÃ TỔ CHỨC" }); await settled(); const list = title.closest("section");
    await userEvent.click(within(list).getByRole("button", { name: "Trang 2", exact: true }));
    const link = within(list).getByRole("link", { name: /UX7 Cup 04/ }); await userEvent.click(link);
    await screen.findByRole("heading", { name: "Trang chủ giải đấu", level: 1 });
    await userEvent.click(screen.getByRole("button", { name: "History back" }));
    const returnedTitle = await screen.findByRole("heading", { name: "GIẢI ĐẤU ĐÃ TỔ CHỨC" });
    expect(within(returnedTitle.closest("section")).getByRole("link", { name: /UX7 Cup 04/ })).toBeInTheDocument();
    expect(within(returnedTitle.closest("section")).queryByRole("link", { name: /UX7 Cup 01/ })).not.toBeInTheDocument();
  });

  it("Escape trả focus về nút mở menu mobile", async () => {
    open("/search"); await screen.findByRole("heading", { name: "Tìm kiếm giải đấu" }); await settled();
    const trigger = screen.getByRole("button", { name: "Mở menu" }); await userEvent.click(trigger); await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("bảng Markdown có vùng cuộn dùng bàn phím và ảnh lỗi có fallback", () => {
    render(<MarkdownRenderer value={"| Đội | Điểm |\n|---|---|\n| Alpha | 2 |\n\n![Poster](https://example.test/missing.png)"} />);
    const region = screen.getByRole("region", { name: "Bảng nội dung" }); expect(region).toHaveAttribute("tabindex", "0"); expect(within(region).getByRole("table")).toBeInTheDocument();
    fireEvent.error(screen.getByRole("img", { name: "Poster" })); expect(screen.getByRole("img", { name: "Poster" }).tagName).toBe("SPAN");
  });
});
