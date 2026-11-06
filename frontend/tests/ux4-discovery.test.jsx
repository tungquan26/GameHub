import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "@/App";
import { TourneyProvider, useTourney } from "@/context/TourneyContext";
import { STORE_KEY } from "@/lib/tourney-store";
import { SUPPORTED_GAMES } from "@/constants/games";
import TournamentHighlights from "@/components/shared/TournamentHighlights";

const entries = Array.from({ length: 12 }, (_, index) => ({ id: `ux4_${index + 1}`, name: `UX4 Cup ${String(index + 1).padStart(2, "0")}`, game: index % 2 ? "Valorant" : "CS2", status: "ONGOING", startDate: "2026-11-05", endDate: "2026-11-06" }));
const response = (data) => new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
function Probe() {
  const { apiStatus } = useTourney();
  const location = useLocation(); const navigate = useNavigate();
  return <><span data-testid="api-status">{apiStatus}</span><span data-testid="location">{location.pathname}{location.search}{location.hash}</span><button onClick={() => navigate(-1)}>History back</button><button onClick={() => navigate(1)}>History forward</button></>;
}
function open(path, tournaments = []) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, profile: null, tournaments, teams: [] }));
  return render(<MemoryRouter initialEntries={[path]}><TourneyProvider><AppRoutes /><Probe /></TourneyProvider></MemoryRouter>);
}
const current = () => screen.getByTestId("location").textContent;
const url = () => new URL(current(), "https://btp.local");
const cardNames = () => screen.queryAllByRole("link", { name: /^Xem giải đấu / }).map((item) => item.getAttribute("aria-label"));
beforeEach(() => vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => response([]))));

describe("UX-4: trang chủ dẫn vào khám phá", () => {
  it("hero có hai CTA thật, giữ thương hiệu và không tuyên bố quy mô chưa chứng minh", async () => {
    open("/");
    const hero = await screen.findByRole("region", { name: "Giới thiệu Tourney Pro" });
    expect(within(hero).getByRole("link", { name: "Tìm giải tham gia" })).toHaveAttribute("href", "/search?status=open_registration");
    expect(within(hero).getByRole("link", { name: "Tổ chức giải đấu" })).toHaveAttribute("href", "/create");
    expect(within(hero).getByRole("heading", { level: 1 })).toHaveTextContent("SIMPLIFIEDTOURNAMENTMANAGEMENT");
    expect(screen.queryByText(/Hàng triệu/)).not.toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tôi muốn tham gia" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tôi muốn tổ chức" })).toBeInTheDocument();
    await userEvent.click(within(hero).getByRole("link", { name: "Tổ chức giải đấu" }));
    await screen.findByRole("heading", { name: "Đăng nhập", level: 1 });
    expect(url().searchParams.get("returnTo")).toBe("/create");
  });

  it("mỗi nhóm tối đa 4 giải và Xem tất cả mở đúng trạng thái", async () => {
    open("/", [...entries, ...entries.map((entry) => ({ ...entry, id: "open_" + entry.id, name: "Open " + entry.name, status: "OPEN_REGISTRATION" }))]);
    const ongoing = await screen.findByRole("region", { name: "Đang diễn ra" });
    const registering = screen.getByRole("region", { name: "Đang mở đăng ký" });
    expect(within(ongoing).getAllByRole("article")).toHaveLength(4);
    expect(within(registering).getAllByRole("article")).toHaveLength(4);
    expect(within(ongoing).getByRole("link", { name: /Xem tất cả/ })).toHaveAttribute("href", "/search?status=in_progress");
    expect(within(registering).getByRole("link", { name: /Xem tất cả/ })).toHaveAttribute("href", "/search?status=open_registration");
    await userEvent.click(within(ongoing).getByRole("link", { name: /Xem tất cả/ }));
    // This is the first lazy SearchPage import; allow its modules to load on a cold run.
    await screen.findByRole("heading", { name: "Tìm kiếm giải đấu", level: 1 }, { timeout: 5000 });
    expect(url().searchParams.get("status")).toBe("in_progress");
    expect(screen.getAllByRole("article")).toHaveLength(5);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("nhóm trống hiển thị thông báo, vẫn có đường khám phá", () => {
    render(<MemoryRouter><TournamentHighlights id="empty" title="Đang diễn ra" description="Theo dõi giải" status="in_progress" items={[]} /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Chưa có giải đang diễn ra" })).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Xem tất cả/ })).toHaveAttribute("href", "/search?status=in_progress");
  });

  it("8 game đổi nền tại chỗ, không mở trang tìm kiếm", async () => {
    open("/");
    const carousel = await screen.findByRole("region", { name: "Carousel 8 trò chơi" });
    for (const game of SUPPORTED_GAMES) expect(within(carousel).getByRole("button", { name: `Chọn ${game.name}` })).not.toHaveAttribute("href");
    const user = userEvent.setup();
    await user.click(within(carousel).getByRole("button", { name: "Chọn Free Fire" }));
    expect(current()).toBe("/");
    expect(within(carousel).getByRole("button", { name: "Chọn Free Fire" })).toHaveAttribute("aria-pressed", "true");
    expect(document.querySelector('[data-game-background][data-current="true"]')).toHaveAttribute("data-game-background", "freefire");
  });

  it("xem giải rồi Back giữ danh sách đã lọc theo game", async () => {
    open("/search?game=valorant");
    const user = userEvent.setup();
    await screen.findByRole("heading", { name: "Tìm kiếm giải đấu" });
    expect(current()).toBe("/search?game=valorant");
    const before = cardNames();
    expect(before).toHaveLength(2);
    await user.click(screen.getByRole("link", { name: before[0] }));
    await screen.findByRole("heading", { name: before[0].replace("Xem giải đấu ", ""), level: 1 });
    await user.click(screen.getByRole("button", { name: "History back" }));
    await screen.findByRole("heading", { name: "Tìm kiếm giải đấu" });
    expect(current()).toBe("/search?game=valorant");
    expect(cardNames()).toEqual(before);
  });

  it.each(["mouse", "touch"])("kéo bằng %s không kích hoạt nút; click/Enter tiếp theo chọn game tại chỗ", async (pointerType) => {
    vi.stubGlobal("PointerEvent", class extends MouseEvent { constructor(type, options) { super(type, options); this.pointerType = options.pointerType; this.pointerId = options.pointerId; } });
    open("/");
    const carousel = await screen.findByRole("region", { name: "Carousel 8 trò chơi" });
    const link = within(carousel).getByRole("button", { name: "Chọn Free Fire" });
    fireEvent.pointerDown(link, { pointerType, pointerId: 1, button: 0, clientX: 100, clientY: 300 });
    fireEvent.pointerMove(carousel, { pointerType, pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerUp(carousel, { pointerType, pointerId: 1 });
    fireEvent.click(link, { detail: 1 });
    expect(current()).toBe("/");
    const user = userEvent.setup();
    if (pointerType === "mouse") await user.click(link); else { link.focus(); await user.keyboard("{Enter}"); }
    expect(current()).toBe("/");
    expect(link).toHaveAttribute("aria-pressed", "true");
  });

  it("mũi tên và Enter chọn game và nền tương ứng, không chuyển trang", async () => {
    open("/");
    const carousel = await screen.findByRole("region", { name: "Carousel 8 trò chơi" });
    fireEvent.keyDown(carousel, { key: "ArrowDown" });
    expect(within(carousel).getByRole("button", { name: "Chọn Đấu Trường Chân Lý" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(current()).toBe("/");
    expect(document.querySelector('[data-game-background][data-current="true"]')).toHaveAttribute("data-game-background", "teamfighttactics");
  });
});

describe("UX-4: URL là trạng thái của danh sách khám phá", () => {
  const path = "/search?utm=home&q=UX4&game=valorant&game=counterstrike2&status=in_progress&status=completed&range=custom&from=2026-11-01&to=2026-11-10&page=2#results";
  it("mở/reload URL giữ đầy đủ bộ lọc và trang đang xem", async () => {
    const page = open(path, entries);
    await screen.findByRole("heading", { name: "Tìm kiếm giải đấu" });
    expect(screen.getByRole("searchbox")).toHaveValue("UX4");
    expect(screen.getByRole("button", { name: "Trang 2", exact: true })).toHaveAttribute("aria-current", "page");
    const before = cardNames(); expect(before).toHaveLength(5); expect(before[0]).toBe("Xem giải đấu UX4 Cup 06");
    await userEvent.click(screen.getByRole("button", { name: "Bộ lọc (3)" }));
    expect(screen.getByLabelText("Valorant")).toBeChecked(); expect(screen.getByLabelText("Counter-Strike 2")).toBeChecked();
    expect(screen.getByLabelText("Đang diễn ra")).toBeChecked(); expect(screen.getByLabelText("Đã kết thúc")).toBeChecked();
    expect(screen.getByLabelText("Từ ngày")).toHaveValue("2026-11-01"); expect(screen.getByLabelText("Đến ngày")).toHaveValue("2026-11-10");
    page.unmount(); open(path, entries);
    await screen.findByRole("heading", { name: "Tìm kiếm giải đấu" });
    expect(cardNames()).toEqual(before);
  });

  it("đổi bộ lọc đưa về trang đầu, giữ query khác và hash", async () => {
    open(path, entries);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Bộ lọc (3)" }));
    await user.click(screen.getByLabelText("Valorant"));
    await waitFor(() => expect(url().searchParams.has("page")).toBe(false));
    expect(url().searchParams.getAll("game")).toEqual(["counterstrike2"]);
    expect(url().searchParams.getAll("status")).toEqual(["in_progress", "completed"]);
    expect(url().searchParams.get("utm")).toBe("home"); expect(url().hash).toBe("#results");
    expect(cardNames()[0]).toBe("Xem giải đấu UX4 Cup 01");
  });

  it("từ khóa/reset cập nhật URL ngay, không có tác vụ trễ ghi đè Back", async () => {
    open(path, entries);
    await screen.findByRole("heading", { name: "Tìm kiếm giải đấu" });
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "UX4 Cup 12" } });
    await waitFor(() => expect(url().searchParams.get("q")).toBe("UX4 Cup 12"));
    expect(url().searchParams.has("page")).toBe(false);
    expect(cardNames()).toEqual(["Xem giải đấu UX4 Cup 12"]);
    await userEvent.click(screen.getByRole("button", { name: "Đặt lại bộ lọc" }));
    await waitFor(() => expect(current()).toBe("/search?utm=home#results"));
    expect(screen.getByRole("searchbox")).toHaveValue("");
    await userEvent.click(screen.getByRole("button", { name: "History back" }));
    await waitFor(() => expect(url().searchParams.get("q")).toBe("UX4 Cup 12"));
    expect(cardNames()).toEqual(["Xem giải đấu UX4 Cup 12"]);
  });

  it("phân trang, Back/Forward và Back từ chi tiết giữ đúng bộ lọc/kết quả", async () => {
    open("/search?q=UX4&game=counterstrike2&game=valorant#results", entries);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Trang 2", exact: true }));
    await waitFor(() => expect(url().searchParams.get("page")).toBe("2"));
    const before = cardNames();
    await user.click(screen.getByRole("link", { name: before[0] }));
    await screen.findByRole("heading", { name: before[0].replace("Xem giải đấu ", ""), level: 1 });
    await user.click(screen.getByRole("button", { name: "History back" }));
    await screen.findByRole("heading", { name: "Tìm kiếm giải đấu" });
    expect(cardNames()).toEqual(before); expect(url().searchParams.get("page")).toBe("2"); expect(url().hash).toBe("#results");
    await user.click(screen.getByRole("button", { name: "History back" }));
    await waitFor(() => expect(url().searchParams.has("page")).toBe(false));
    expect(cardNames()[0]).toBe("Xem giải đấu UX4 Cup 01");
    await user.click(screen.getByRole("button", { name: "History forward" }));
    await waitFor(() => expect(url().searchParams.get("page")).toBe("2"));
    expect(cardNames()).toEqual(before);
  });

  it("chờ API trước khi giới hạn trang; dữ liệu về không làm mất trang URL hợp lệ", async () => {
    let complete;
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise((resolve) => { complete = resolve; })));
    open("/search?q=UX4&page=3#results");
    await screen.findByRole("status", { name: "Đang tải danh sách giải đấu" });
    expect(url().searchParams.get("page")).toBe("3");
    await act(async () => complete(response(entries)));
    expect(await screen.findByRole("link", { name: "Xem giải đấu UX4 Cup 11" })).toBeInTheDocument();
    expect(cardNames()).toHaveLength(2); expect(url().searchParams.get("page")).toBe("3");
  });

  it("trang vượt quá số kết quả được giới hạn sau khi tải, không làm trống danh sách", async () => {
    open("/search?q=UX4&page=99#results", entries);
    await screen.findByRole("heading", { name: "Tìm kiếm giải đấu" });
    await waitFor(() => expect(url().searchParams.get("page")).toBe("3"));
    expect(cardNames()).toEqual(["Xem giải đấu UX4 Cup 11", "Xem giải đấu UX4 Cup 12"]);
  });

  it("API lỗi giữ cache, URL, bộ lọc và trang mà không hiện thông báo hoặc thử lại", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Offline")));
    open(path, entries);
    await waitFor(() => expect(screen.getByTestId("api-status")).toHaveTextContent("error"));
    await screen.findByRole("heading", { name: "Tìm kiếm giải đấu" });
    expect(screen.queryByText(/Chưa thể tải thêm giải đấu/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Thử lại" })).not.toBeInTheDocument();
    expect(current()).toBe(path);
    expect(screen.getByRole("searchbox")).toHaveValue("UX4");
    expect(cardNames()).toEqual(entries.slice(5, 10).map((item) => `Xem giải đấu ${item.name}`));
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
