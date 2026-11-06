import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { transferableAbortController } from "node:util";
import { AppRoutes } from "@/App";
import { TourneyProvider } from "@/context/TourneyContext";
import { STORE_KEY } from "@/lib/tourney-store";
import { generateBracket } from "@/lib/bracket";
import { findSample } from "@/constants/tournament-catalog";

const layout = [{ id: "intro", title: "Thông báo", layout: "1col", columns: [[{ id: "intro-text", type: "MARKDOWN", content: "Thông tin công khai" }]] }];
const cup = { id: 61, ownerId: 7, name: "UX6 Winter Cup", game: "Valorant", source: "local", status: "OPEN_REGISTRATION", startDate: "2099-12-10T10:00", endDate: "2099-12-15T18:00", contact: "cup@example.com", rules: "## Luật thi đấu\n\n**Không gian lận**", homepageLayout: layout,
  tournamentTeams: Array.from({ length: 4 }, (_, index) => ({ id: index + 1, name: `UX6 Team ${index + 1}`, members: [`Player ${index + 1}`] })) };
const other = { ...cup, id: 62, name: "Another Cup", rules: "Secret rules", tournamentTeams: [{ id: 99, name: "Another Team", members: [] }] };
const state = () => JSON.parse(localStorage.getItem(STORE_KEY));
const storedCup = () => state().tournaments.find((entry) => entry.id === cup.id);
const reply = (data) => new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
function open(path, extra = {}, previous) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, rememberLogin: true, profile: { id: 7, username: "Captain" }, tournaments: [cup, other], activeTournamentId: other.id, ...extra }));
  const router = createMemoryRouter([{ path: "*", element: <TourneyProvider><AppRoutes /></TourneyProvider> }], { initialEntries: previous ? [previous, path] : [path], initialIndex: previous ? 1 : 0 });
  const result = render(<RouterProvider router={router} />);
  return { ...result, router };
}
const header = () => screen.getByRole("region", { name: "Thông tin giải đấu công khai" });
const nav = () => screen.getByRole("navigation", { name: "Nội dung giải đấu" });
const dirtyDialog = () => screen.getByRole("dialog", { name: "Rời trang khi chưa lưu?" });
const card = (title) => screen.getByRole("heading", { level: 2, name: title }).closest("section");
async function ready(name = cup.name) { return screen.findByRole("heading", { level: 1, name }, { timeout: 5000 }); }
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => reply([])));
  // Node Request validates its own signal type; JSDOM's controller belongs to
  // another realm. Use the native controller for data-router navigations.
  vi.stubGlobal("AbortController", class { constructor() { return transferableAbortController(); } });
});

describe("UX-6: không gian công khai", () => {
  it("giữ cùng đầu trang qua bốn mục, đúng ID và không nhận giải đang quản lý", async () => {
    const { router } = open("/tournament/view?id=61", { profile: null });
    await ready(); const originalHeader = header(); const user = userEvent.setup();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByText(cup.name)).toHaveLength(1);
    for (const [label, param] of [["Đội tuyển", "teams"], ["Thể lệ", "rules"], ["Lịch đấu", "schedule"], ["Tổng quan", "overview"]]) {
      await user.click(within(nav()).getByRole("link", { name: label }));
      await waitFor(() => expect(within(nav()).getByRole("link", { name: label })).toHaveAttribute("aria-current", "page"));
      expect(header()).toBe(originalHeader);
      expect(router.state.location.search).toContain("id=61");
      if (param === "teams") { expect(await screen.findByText("UX6 Team 1")).toBeInTheDocument(); expect(screen.queryByText("Another Team")).not.toBeInTheDocument(); }
      if (param === "rules") { expect(await screen.findByText("Không gian lận")).toHaveProperty("tagName", "STRONG"); expect(screen.queryByText("Secret rules")).not.toBeInTheDocument(); }
      if (param === "schedule") expect(await screen.findByText("Lịch thi đấu chưa được công bố")).toBeInTheDocument();
    }
    expect(state().activeTournamentId).toBe(other.id); expect(state().brackets).toEqual({});
    expect(screen.queryByRole("complementary", { name: "Quản lý giải đấu" })).not.toBeInTheDocument();
  });

  it.each([null, { id: 7 }, { id: 8, username: "Captain" }])("lịch công khai chỉ đọc với danh tính %j và không đổi bracket", async (profile) => {
    const bracket = generateBracket(cup, 4);
    const { router } = open("/tournament/schedule?id=61&view=public", { profile, brackets: { "tournament:61": bracket } });
    await ready(); await screen.findByRole("table");
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.queryByRole("combobox", { name: "Quy mô nhánh đấu" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Nhập kết quả|Đổi giờ đấu|Bốc thăm/ })).not.toBeInTheDocument();
    expect(state().brackets["tournament:61"]).toEqual(bracket); expect(state().activeTournamentId).toBe(other.id);
    if (profile?.id === 7) {
      await userEvent.click(screen.getByRole("button", { name: "Quản lý giải đấu" }));
      await ready("Chi tiết giải đấu"); expect(router.state.location.search).toBe("?id=61");
      expect(screen.getByLabelText(/^Tên giải đấu/)).toHaveValue(cup.name);
      expect(within(screen.getByRole("navigation", { name: "Cài đặt giải đấu" })).getAllByRole("link")).toHaveLength(6);
      await userEvent.click(screen.getByRole("link", { name: "Xem giải đấu công khai" }));
      await ready(); expect(router.state.location.search).toBe("?id=61");
    } else expect(screen.queryByRole("button", { name: "Quản lý giải đấu" })).not.toBeInTheDocument();
  });

  it("chủ giải xem lịch chưa lưu không khởi tạo bracket; mẫu trùng ID tách riêng", async () => {
    const { router } = open("/tournament/schedule?id=61&view=public"); await ready();
    expect(await screen.findByText("Lịch thi đấu chưa được công bố")).toBeInTheDocument(); expect(state().brackets).toEqual({});
    await act(() => router.navigate("/tournament/schedule?id=1&sample=1&view=public"));
    await ready(findSample(1).name);
    expect(await screen.findByText("Lịch thi đấu chưa được công bố")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quản lý giải đấu" })).not.toBeInTheDocument(); expect(state().brackets).toEqual({});
  });

  it("giải tải trực tiếp từ API giữ header và chỉ tải một lần khi đổi mục", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply({ ...cup, id: 80, ownerId: 8 })));
    open("/tournament/view?id=80", { profile: null }); await ready();
    const originalHeader = header();
    await userEvent.click(within(nav()).getByRole("link", { name: "Lịch đấu" }));
    await screen.findByText("Lịch thi đấu chưa được công bố");
    await userEvent.click(within(nav()).getByRole("link", { name: "Thể lệ" }));
    await screen.findByText("Không gian lận");
    expect(header()).toBe(originalHeader); expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("mở thẳng đội/thể lệ có trạng thái trống và API lỗi không dùng giải khác", async () => {
    const { router } = open("/tournament/view?id=61&tab=teams", { tournaments: [{ ...cup, tournamentTeams: [], rules: "" }, other], profile: null });
    await ready(); expect(await screen.findByText("Chưa có đội tuyển")).toBeInTheDocument();
    await userEvent.click(within(nav()).getByRole("link", { name: "Thể lệ" })); expect(await screen.findByText("Chưa có thể lệ")).toBeInTheDocument();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new TypeError("Offline")).mockImplementation(async () => reply({ ...cup, id: 80 })));
    await act(() => router.navigate("/tournament/schedule?id=80&view=public"));
    expect(await screen.findByText("Chưa thể tải giải đấu")).toBeInTheDocument(); expect(screen.queryByText(other.name)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" })); await ready();
  });
});

describe("UX-6: bảo vệ bản nháp", () => {
  it("đăng xuất chờ quyết định rời bản nháp trước khi xóa danh tính", async () => {
    open("/tournament/details?id=61"); await ready("Chi tiết giải đấu");
    fireEvent.change(screen.getByLabelText(/^Tên giải đấu/), { target: { value: "Logout draft" } });
    const user = userEvent.setup();
    async function logout() {
      await user.click(screen.getByRole("button", { name: "Tài khoản", exact: true }));
      await user.click(screen.getByRole("menuitem", { name: "Đăng xuất" }));
      expect(dirtyDialog()).toBeInTheDocument(); expect(state().profile.id).toBe(7);
    }
    await logout(); await user.click(within(dirtyDialog()).getByRole("button", { name: "Tiếp tục chỉnh sửa" }));
    expect(screen.getByLabelText(/^Tên giải đấu/)).toHaveValue("Logout draft");
    await logout(); await user.click(within(dirtyDialog()).getByRole("button", { name: "Bỏ thay đổi và rời trang" }));
    await screen.findByRole("link", { name: "Đăng nhập", exact: true });
    await waitFor(() => expect(state().profile).toBeNull()); expect(storedCup().name).toBe(cup.name);
  });
  it("đổi giải bị chặn trước khi active ID thay đổi; tiếp tục giữ form, bỏ mới điều hướng", async () => {
    const { router } = open("/tournament/details?id=61"); await ready("Chi tiết giải đấu");
    const user = userEvent.setup(); const input = screen.getByLabelText(/^Tên giải đấu/);
    await user.clear(input); await user.type(input, "Draft name");
    await user.selectOptions(screen.getByRole("combobox", { name: "Giải đấu đang quản lý" }), "62");
    expect(dirtyDialog()).toBeInTheDocument(); expect(router.state.location.search).toBe("?id=61"); expect(String(state().activeTournamentId)).toBe("61");
    await user.click(within(dirtyDialog()).getByRole("button", { name: "Tiếp tục chỉnh sửa" }));
    expect(input).toHaveValue("Draft name"); expect(storedCup().name).toBe(cup.name);
    await user.selectOptions(screen.getByRole("combobox", { name: "Giải đấu đang quản lý" }), "62");
    await user.click(within(dirtyDialog()).getByRole("button", { name: "Bỏ thay đổi và rời trang" }));
    await waitFor(() => expect(String(state().activeTournamentId)).toBe("62"));
    expect(screen.getByLabelText(/^Tên giải đấu/)).toHaveValue(other.name); expect(storedCup().name).toBe(cup.name);
  });

  it("Back bị chặn, hash cùng form giữ nháp; lưu một card không xóa nháp card khác", async () => {
    const { router } = open("/tournament/details?id=61", {}, "/events"); await ready("Chi tiết giải đấu");
    const user = userEvent.setup();
    fireEvent.change(screen.getByLabelText(/^Tên giải đấu/), { target: { value: "Draft details" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Điều lệ giải đấu" }), { target: { value: "**Draft rules**" } });
    await act(() => router.navigate("/tournament/details?id=61#rulesCard"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); expect(screen.getByLabelText(/^Tên giải đấu/)).toHaveValue("Draft details");
    await user.click(screen.getByRole("button", { name: "Xem trước Markdown" }));
    expect(await screen.findByText("Draft rules")).toHaveProperty("tagName", "STRONG");
    await user.click(screen.getByRole("button", { name: "Chỉnh sửa Markdown" }));
    expect(screen.getByRole("textbox", { name: "Điều lệ giải đấu" })).toHaveValue("**Draft rules**");
    await user.click(within(card("Điều lệ giải đấu")).getByRole("button", { name: "Lưu thay đổi" }));
    expect(storedCup().rules).toBe("**Draft rules**"); expect(storedCup().name).toBe(cup.name);
    await act(() => router.navigate(-2)); expect(dirtyDialog()).toBeInTheDocument();
    await user.click(within(dirtyDialog()).getByRole("button", { name: "Tiếp tục chỉnh sửa" }));
    expect(screen.getByLabelText(/^Tên giải đấu/)).toHaveValue("Draft details");
    await user.click(within(card("Chi tiết giải đấu")).getByRole("button", { name: "Lưu thay đổi" }));
    await waitFor(() => expect(storedCup().name).toBe("Draft details"));
    await user.click(screen.getByRole("link", { name: "Thông tin game", exact: true }));
    await ready("Thông tin game"); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("cảnh báo reload chỉ khi bẩn; URL xem công khai và menu quản trị đều bị chặn", async () => {
    open("/tournament/game-info?id=61"); await ready("Thông tin game");
    let event = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(event); expect(event.defaultPrevented).toBe(false);
    await userEvent.selectOptions(screen.getByLabelText(/Thể thức nhánh đấu/), "ROUND_ROBIN");
    event = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(event); expect(event.defaultPrevented).toBe(true);
    await userEvent.click(screen.getByRole("link", { name: "Xem giải đấu công khai" })); expect(dirtyDialog()).toBeInTheDocument();
    await userEvent.keyboard("{Escape}"); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeDisabled());
    event = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(event); expect(event.defaultPrevented).toBe(false);
  });

  it("xem trước builder giữ nháp, không tự lưu; cảnh báo rời trang và lưu rõ ràng", async () => {
    open("/tournament/home?id=61"); await ready("Trang chủ giải đấu");
    const user = userEvent.setup(); const editor = screen.getByRole("complementary", { name: "Trình chỉnh sửa trang chủ" });
    await user.click(within(editor).getByRole("button", { name: "Chỉnh sửa trang" }));
    fireEvent.change(screen.getByLabelText("Tiêu đề khu vực 1"), { target: { value: "Draft layout" } });
    await user.click(within(editor).getByRole("button", { name: "Xem trước bản nháp" }));
    expect(screen.getByRole("heading", { name: "Draft layout" })).toBeInTheDocument(); expect(screen.queryByLabelText("Tiêu đề khu vực 1")).not.toBeInTheDocument();
    expect(storedCup().homepageLayout).toEqual(layout);
    await user.click(within(editor).getByRole("button", { name: "Tiếp tục chỉnh sửa bố cục" }));
    expect(screen.getByLabelText("Tiêu đề khu vực 1")).toHaveValue("Draft layout");
    await user.click(screen.getByRole("link", { name: "Thông tin game", exact: true })); expect(dirtyDialog()).toBeInTheDocument();
    await user.click(within(dirtyDialog()).getByRole("button", { name: "Tiếp tục chỉnh sửa" }));
    await user.click(within(editor).getByRole("button", { name: "Lưu", exact: true }));
    await user.click(screen.getByRole("link", { name: "Thông tin game", exact: true })); await ready("Thông tin game");
    expect(storedCup().homepageLayout[0].title).toBe("Draft layout"); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
