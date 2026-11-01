import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NewsPage from "@/pages/dashboard/NewsPage";
import { TourneyProvider, useTourney } from "@/context/TourneyContext";
import { STORE_KEY } from "@/lib/tourney-store";
import { normalizeNotifications, notificationTime } from "@/lib/notifications";

const profile = { id: 7, username: "Player" };
const update = { notificationId: 10, title: "Lịch thi đấu mới đã được cập nhật", message: "Chi tiết trận đấu:\n- Giải đấu: November Cup\n- Cặp đấu: Alpha VS Beta\n- Thời gian: 05/11/2026 14:00\n- Địa điểm: Hà Nội", createdAt: "2026-11-01T14:00:00", read: false };
const reminder = { ...update, notificationId: 11, title: "Nhắc nhở: Trận đấu của bạn sẽ diễn ra vào ngày mai", createdAt: "2026-11-02T09:00:00", isRead: true, read: undefined };
const response = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
function Controls() {
  const { setProfile, clearProfile } = useTourney();
  return <><button onClick={() => setProfile({ id: 8, username: "Player" })}>Switch account</button><button onClick={clearProfile}>Log out</button></>;
}
function open(user = profile) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, profile: user, tournaments: [], teams: [] }));
  return render(<MemoryRouter initialEntries={["/news"]}><TourneyProvider><NewsPage /><Controls /></TourneyProvider></MemoryRouter>);
}
beforeEach(() => vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => response([]))));
afterEach(() => vi.useRealTimers());

describe("Tin tức từ thông báo backend", () => {
  it("chuẩn hóa read/isRead, mới nhất trước, bỏ user nhạy cảm và không nhận phản hồi sai", () => {
    expect(normalizeNotifications([update, reminder, { ...update, user: { password: "secret" } }, null])).toEqual([
      { id: "11", title: reminder.title, message: reminder.message, createdAt: reminder.createdAt, read: true },
      { id: "10", title: update.title, message: update.message, createdAt: update.createdAt, read: false },
    ]);
    expect(() => normalizeNotifications({ message: "error" })).toThrow();
    expect(notificationTime(update.createdAt)).toContain("14:00");
  });
  it.each([null, { username: "Legacy player" }])("khách hoặc hồ sơ thiếu ID cần đăng nhập, không tải tin của người khác", (user) => {
    open(user);
    expect(screen.getByRole("heading", { level: 1, name: "Tin tức" })).toHaveClass("uppercase");
    expect(screen.getByRole("link", { name: "Đăng nhập" })).toHaveAttribute("href", "/login?returnTo=%2Fnews");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("tải đúng tài khoản, hiện toàn bộ chi tiết lịch, thứ tự và trạng thái đọc", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => response([update, reminder])));
    open();
    expect(screen.getByRole("status", { name: "Đang tải thông báo" })).toBeInTheDocument();
    const items = await screen.findAllByRole("article");
    expect(items.map((item) => item.getAttribute("aria-label"))).toEqual([reminder.title, update.title]);
    expect(items[1]).toHaveTextContent("Alpha VS Beta"); expect(items[1]).toHaveTextContent("Hà Nội");
    expect(within(items[0]).getByText("Đã đọc")).toBeInTheDocument();
    expect(screen.getByText("2 thông báo · 1 chưa đọc")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/notifications/user/7", expect.objectContaining({ credentials: "same-origin", signal: expect.any(AbortSignal) }));
  });
  it("danh sách trống không tạo thông báo giả từ giải cục bộ", async () => {
    open();
    expect(await screen.findByRole("heading", { name: "Bạn chưa có thông báo lịch thi đấu" })).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });
  it("lỗi tải có thể làm mới và hồi phục", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new TypeError("Offline")).mockImplementation(async () => response([update])));
    open(); await screen.findByRole("alert");
    expect(screen.queryByRole("heading", { name: "Bạn chưa có thông báo lịch thi đấu" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Làm mới" }));
    expect(await screen.findByRole("article", { name: update.title })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("PUT đánh dấu đã đọc, không gửi lặp khi đang chờ và giữ focus tại thông báo", async () => {
    let finish;
    const fetchMock = vi.fn().mockImplementation((url) => url.endsWith('/read') ? new Promise((resolve) => { finish = resolve; }) : Promise.resolve(response([update])));
    vi.stubGlobal("fetch", fetchMock); open();
    const button = await screen.findByRole("button", { name: `Đánh dấu đã đọc: ${update.title}` });
    fireEvent.click(button); fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/read'))).toHaveLength(1);
    await act(async () => finish(new Response(null, { status: 200 })));
    expect(fetchMock).toHaveBeenCalledWith("/api/notifications/10/read", expect.objectContaining({ method: "PUT" }));
    expect(screen.getByRole("article")).toHaveFocus();
    expect(screen.getByText("1 thông báo · 0 chưa đọc")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Đánh dấu đã đọc/ })).not.toBeInTheDocument();
  });
  it("PUT lỗi giữ chưa đọc và cho thử lại", async () => {
    let failed = true;
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url) => {
      if (!url.endsWith('/read')) return response([update]);
      if (failed) { failed = false; return response({ message: "Failed" }, 500); }
      return new Response(null, { status: 200 });
    }));
    open(); const button = await screen.findByRole("button", { name: /Đánh dấu đã đọc/ });
    await userEvent.click(button); expect(await screen.findByRole("alert")).toHaveTextContent("Không thể đánh dấu");
    expect(button).toBeEnabled(); expect(screen.getByText("Chưa đọc")).toBeInTheDocument();
    await userEvent.click(button); await screen.findByText("Đã đọc");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("phản hồi GET cũ không ghi đè trạng thái đọc đã PUT thành công", async () => {
    let finishRefresh; let calls = 0;
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url) => {
      if (url.endsWith('/read')) return new Response(null, { status: 200 });
      if (++calls === 1) return response([update]);
      return new Promise((resolve) => { finishRefresh = resolve; });
    }));
    open(); await screen.findByRole("article");
    await userEvent.click(screen.getByRole("button", { name: "Làm mới" }));
    await userEvent.click(screen.getByRole("button", { name: /Đánh dấu đã đọc/ }));
    await screen.findByText("Đã đọc");
    await act(async () => finishRefresh(response([update])));
    expect(screen.getByText("Đã đọc")).toBeInTheDocument();
  });
  it("đổi tài khoản hủy yêu cầu cũ và không lộ tin dù hai tài khoản trùng tên", async () => {
    let oldResponse; let oldSignal;
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url, options) => url.endsWith('/7') ? new Promise((resolve) => { oldResponse = resolve; oldSignal = options.signal; }) : Promise.resolve(response([reminder]))));
    open(); await userEvent.click(screen.getByRole("button", { name: "Switch account" }));
    await screen.findByRole("article", { name: reminder.title }); expect(oldSignal.aborted).toBe(true);
    await act(async () => oldResponse(response([update])));
    expect(screen.queryByRole("article", { name: update.title })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });
  it("tự tải sau 30 giây, giữ danh sách khi lỗi, dừng tải khi ẩn tab và unmount", async () => {
    vi.useFakeTimers();
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(false);
    const fetchMock = vi.fn().mockResolvedValueOnce(response([update])).mockRejectedValueOnce(new TypeError('Offline')).mockImplementation(async () => response([update, reminder]));
    vi.stubGlobal("fetch", fetchMock); const page = open(); await act(async () => {});
    expect(screen.getAllByRole("article")).toHaveLength(1);
    await act(async () => { vi.advanceTimersByTime(30000); });
    expect(screen.getAllByRole("article")).toHaveLength(1); expect(screen.getByRole("alert")).toBeInTheDocument();
    hidden.mockReturnValue(true);
    await act(async () => { vi.advanceTimersByTime(60000); }); expect(fetchMock).toHaveBeenCalledTimes(2);
    hidden.mockReturnValue(false); await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(screen.getAllByRole("article")).toHaveLength(2);
    page.unmount(); await act(async () => { vi.advanceTimersByTime(60000); }); expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
