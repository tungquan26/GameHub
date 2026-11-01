import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppRoutes } from "@/App";
import { TourneyProvider } from "@/context/TourneyContext";
import { STORE_KEY } from "@/lib/tourney-store";
import { findMatch } from "@/lib/bracket";
import { findSample } from "@/constants/tournament-catalog";

const LAYOUT = [{ id: "intro", title: "Tổng quan", layout: "1col", columns: [[{ id: "text", type: "MARKDOWN", title: "", content: "Giới thiệu ban đầu" }]] }];
const ENTRY = { id: "tourney_one", name: "Autumn Cup", source: "local", ownerId: 7, startDate: "2026-11-10T10:00", endDate: "2026-11-15T18:00", contactType: "EMAIL", contact: "private@example.com", homepageLayout: LAYOUT, rules: "Private rules", gameInfo: { game: "Valorant", format: "SINGLE_ELIMINATION" }, tournamentTeams: Array.from({ length: 8 }, (_, index) => ({ id: index + 1, name: "Đội " + (index + 1), members: ["Captain"] })) };
const OTHER = { ...ENTRY, id: "tourney_two", name: "Winter Cup" };
const PUBLIC = { id: 71, name: "Public Cup", startDate: ENTRY.startDate, endDate: ENTRY.endDate, status: "open", contactType: "EMAIL", contact: "public@example.com", rules: "Public rules", homepageLayout: [{ id: "public", title: "Thông tin", layout: "1col", columns: [[{ id: "public-contact", type: "CONTACT", title: "" }, { id: "public-rules", type: "RULES", title: "" }]] }] };
function Location() { const value = useLocation(); return <output data-testid="location">{value.pathname}{value.search}</output>; }
function open(path, extra = {}) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, profile: { id: 7, tagName: "Captain" }, tournaments: [ENTRY, OTHER], activeTournamentId: ENTRY.id, ...extra }));
  return render(<MemoryRouter initialEntries={[path]}><TourneyProvider><AppRoutes /><Location /></TourneyProvider></MemoryRouter>);
}
const state = () => JSON.parse(localStorage.getItem(STORE_KEY));
const active = () => state().tournaments.find((entry) => String(entry.id) === String(state().activeTournamentId));
const savedBracket = (id = ENTRY.id) => state().brackets["tournament:" + id];
const editor = () => screen.getByRole("complementary", { name: "Trình chỉnh sửa trang chủ" });
const tree = () => screen.getByRole("region", { name: "Sơ đồ nhánh đấu" });
async function ready(name) { return screen.findByRole("heading", { level: 1, name }, { timeout: 5000 }); }

describe("Phiên 5: Homepage Builder", () => {
  it("chỉnh bản nháp, thêm Markdown, chuyển cột, lưu rồi xem công khai cùng nội dung", async () => {
    open("/tournament/home", { publicTournament: ENTRY }); await ready("Trang chủ giải đấu");
    const user = userEvent.setup();
    await user.click(within(editor()).getByRole("button", { name: "Chỉnh sửa trang" }));
    expect(within(editor()).getByRole("button", { name: "Lưu", exact: true })).toBeDisabled();
    const title = screen.getByLabelText("Tiêu đề khu vực 1"); await user.clear(title); await user.type(title, "Thông báo mới");
    expect(active().homepageLayout[0].title).toBe("Tổng quan");
    await user.click(screen.getByRole("button", { name: "Thêm tiện ích", exact: true }));
    const picker = screen.getByRole("dialog", { name: "Thêm tiện ích" });
    expect(within(picker).getAllByRole("button")).toHaveLength(7);
    await user.click(within(picker).getByRole("button", { name: "Văn bản / Markdown" }));
    const modal = screen.getByRole("dialog", { name: "Chỉnh sửa tiện ích Văn bản / Markdown" });
    const content = within(modal).getByRole("textbox", { name: "Nội dung (Hỗ trợ Markdown)" });
    await user.clear(content); await user.type(content, "**Cập nhật lịch thi đấu**");
    await user.click(within(modal).getByRole("button", { name: "Áp dụng" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await user.selectOptions(screen.getByLabelText("Bố cục khu vực 1"), "2col-66-33");
    await user.click(screen.getAllByRole("button", { name: "Chuyển sang cột bên cạnh" })[1]);
    await user.click(within(editor()).getByRole("button", { name: "Lưu", exact: true }));
    expect(active().homepageLayout[0]).toMatchObject({ title: "Thông báo mới", layout: "2col-66-33" });
    expect(active().homepageLayout[0].columns[1][0].content).toBe("**Cập nhật lịch thi đấu**");
    expect(state().publicTournament.homepageLayout).toEqual(active().homepageLayout);
    await user.click(screen.getAllByRole("link", { name: "Xem giải đấu công khai" })[0]);
    await ready("Autumn Cup");
    expect(screen.getByText("Cập nhật lịch thi đấu")).toHaveProperty("tagName", "STRONG");
    expect(screen.queryByRole("button", { name: "Chỉnh sửa trang" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sửa nội dung" })).not.toBeInTheDocument();
  });
  it("hủy không ghi bản nháp; xóa toàn bộ khu vực và tải lại vẫn giữ danh sách rỗng", async () => {
    const rendered = open("/tournament/home"); await ready("Trang chủ giải đấu"); const user = userEvent.setup();
    await user.click(within(editor()).getByRole("button", { name: "Chỉnh sửa trang" }));
    await user.click(screen.getByRole("button", { name: "Xóa khu vực" }));
    await user.click(within(editor()).getByRole("button", { name: "Hủy" }));
    expect(active().homepageLayout).toEqual(LAYOUT); expect(screen.getByText("Giới thiệu ban đầu")).toBeInTheDocument();
    await user.click(within(editor()).getByRole("button", { name: "Chỉnh sửa trang" }));
    await user.click(screen.getByRole("button", { name: "Xóa khu vực" }));
    await user.click(within(editor()).getByRole("button", { name: "Lưu", exact: true }));
    expect(active().homepageLayout).toEqual([]);
    const cache = state(); rendered.unmount(); open("/tournament/home", cache); await ready("Trang chủ giải đấu");
    expect(screen.getByRole("heading", { name: "Chưa có khu vực nội dung" })).toBeInTheDocument();
  });
  it("kéo tiện ích giữa khu vực rồi lưu đúng thứ tự, không thay giải khác", async () => {
    open("/tournament/home", { tournaments: [{ ...ENTRY, homepageLayout: [...LAYOUT, { id: "second", title: "Khu vực 2", layout: "1col", columns: [[]] }] }, OTHER] });
    await ready("Trang chủ giải đấu"); const user = userEvent.setup(); await user.click(within(editor()).getByRole("button", { name: "Chỉnh sửa trang" }));
    fireEvent.dragStart(screen.getByRole("button", { name: "Kéo tiện ích" }), { dataTransfer: { setData: vi.fn() } });
    fireEvent.drop(screen.getByLabelText("Cột 1 khu vực 2"));
    await user.click(within(editor()).getByRole("button", { name: "Lưu", exact: true }));
    expect(active().homepageLayout[0].columns[0]).toEqual([]);
    expect(active().homepageLayout[1].columns[0][0].id).toBe("text");
    expect(state().tournaments[1].homepageLayout).toEqual(LAYOUT);
  });
  it("hộp thoại ảnh yêu cầu nguồn, chặn link nguy hiểm và lưu đủ chú thích/liên kết", async () => {
    open("/tournament/home"); await ready("Trang chủ giải đấu"); const user = userEvent.setup();
    await user.click(within(editor()).getByRole("button", { name: "Chỉnh sửa trang" }));
    await user.click(screen.getByRole("button", { name: "Thêm tiện ích", exact: true }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Hình ảnh", exact: true }));
    const modal = screen.getByRole("dialog", { name: "Chỉnh sửa tiện ích Hình ảnh" });
    await user.click(within(modal).getByRole("button", { name: "Áp dụng" })); expect(within(modal).getByRole("alert")).toHaveTextContent("tải ảnh");
    await user.type(within(modal).getByLabelText("Hoặc URL hình ảnh"), "https://example.com/poster.png");
    const link = within(modal).getByLabelText("Liên kết khi nhấn vào ảnh (Không bắt buộc)");
    await user.type(link, "javascript:alert(1)"); await user.click(within(modal).getByRole("button", { name: "Áp dụng" })); expect(within(modal).getByRole("alert")).toHaveTextContent("HTTP");
    await user.clear(link); await user.type(link, "https://btp.example/prizes");
    await user.type(within(modal).getByLabelText("Chú thích ảnh (Không bắt buộc)"), "Cơ cấu giải thưởng");
    await user.click(within(modal).getByRole("button", { name: "Áp dụng" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(active().homepageLayout[0].columns[0]).toHaveLength(1);
    await user.click(within(editor()).getByRole("button", { name: "Lưu", exact: true }));
    expect(active().homepageLayout[0].columns[0][1]).toMatchObject({ type: "IMAGE", caption: "Cơ cấu giải thưởng", linkUrl: "https://btp.example/prizes" });
  });
});

describe("Phiên 5: trang công khai", () => {
  it("không lấy liên hệ/điều lệ của giải khác; đăng ký một lần và đi đúng lịch chỉ đọc", async () => {
    open("/tournament/view", { publicTournament: PUBLIC }); await ready("Public Cup"); const user = userEvent.setup();
    expect(screen.getAllByText("public@example.com")).toHaveLength(2); expect(screen.queryByText("private@example.com")).not.toBeInTheDocument();
    expect(screen.getByText("Public rules")).toBeInTheDocument(); expect(screen.queryByText("Private rules")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lịch đấu", exact: true })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Đăng ký tham gia" }));
    expect(screen.getByRole("button", { name: "Đã đăng ký" })).toBeDisabled(); expect(state().registeredTournaments).toHaveLength(1);
    expect(JSON.parse(sessionStorage.getItem("btp_registered_tournaments"))).toHaveLength(1);
    await user.click(screen.getByRole("link", { name: "Lịch đấu", exact: true })); await screen.findByRole("heading", { name: "Lịch thi đấu", level: 2 });
    expect(screen.getByTestId("location")).toHaveTextContent("id=71&view=public");
    expect(screen.getByRole("heading", { name: "Public Cup", level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: "Quản lý giải đấu" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Quy mô nhánh đấu" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nhập kết quả" })).not.toBeInTheDocument();
    expect(state().brackets).toEqual({}); expect(state().activeTournamentId).toBe(ENTRY.id);
    const nav = screen.getByRole("navigation", { name: "Nội dung giải đấu" }); expect(within(nav).getAllByRole("link")).toHaveLength(4);
  });
  it.each([["completed", "Đã kết thúc"], ["in_progress", "Đang diễn ra"], ["closed", "Đã đóng đăng ký"]])("khóa hành động khi trạng thái là %s", async (status, label) => {
    open("/tournament/view", { publicTournament: { ...PUBLIC, status } }); await ready("Public Cup");
    expect(screen.getByRole("button", { name: label, exact: true })).toBeDisabled(); expect(state().registeredTournaments).toEqual([]);
  });
  it("id không tồn tại không hiển thị nội dung riêng của giải đang quản lý", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Not found", { status: 404 })));
    open("/tournament/view?id=missing", { publicTournament: PUBLIC }); await ready("Xem giải đấu công khai");
    expect(await screen.findByRole("heading", { name: "Không tìm thấy giải đấu" })).toBeInTheDocument(); expect(screen.queryByText("Private rules")).not.toBeInTheDocument();
  });
  it("vai trò fixture không cấp quyền quản lý hoặc tạo bản sao giải mẫu", async () => {
    const real = { ...ENTRY, id: 1, name: "Real Cup" };
    open("/tournament/view", { tournaments: [real, OTHER], activeTournamentId: 1, publicTournament: { ...PUBLIC, id: 1, name: "Sample Managed Cup", sample: true, role: "Organizer" } });
    await ready(findSample(1).name);
    expect(screen.queryByRole("button", { name: "Quản lý giải đấu" })).not.toBeInTheDocument();
    expect(state().tournaments).toHaveLength(2);
    expect(active().id).toBe(1);
    expect(state().tournaments.find((entry) => entry.id === 1)).toMatchObject({ name: "Real Cup", contact: "private@example.com" });
  });
  it("URL quản lý mang cờ mẫu không ghi nhầm giải thật có cùng id", async () => {
    open("/tournament/details?id=1&sample=1", { tournaments: [{ ...ENTRY, id: 1 }, OTHER], activeTournamentId: OTHER.id });
    await ready("Chi tiết giải đấu");
    expect(screen.getByRole("heading", { name: "Không tìm thấy giải đấu được yêu cầu" })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Tên giải đấu/)).not.toBeInTheDocument(); expect(state().activeTournamentId).toBe(OTHER.id);
  });
});

describe("Phiên 5: lịch thi đấu", () => {
  it("đổi quy mô, nhập kết quả, đổi giờ riêng và sửa đội thắng để xóa vô địch cũ", async () => {
    open("/tournament/schedule"); await ready("Lịch thi đấu"); const user = userEvent.setup();
    await user.selectOptions(screen.getByRole("combobox", { name: "Quy mô nhánh đấu" }), "4");
    expect(screen.getByRole("progressbar", { name: "Tiến độ thi đấu" })).toHaveAttribute("aria-valuemax", "3");
    async function editMatch(number, a, b, tie = false) {
      const card = within(tree()).getByRole("article", { name: `Trận #${number}`, exact: true }); await user.click(within(card).getByRole("button"));
      const modal = screen.getByRole("dialog"); const scores = within(modal).getAllByRole("spinbutton");
      if (tie) { await user.click(within(modal).getByRole("button", { name: "Lưu kết quả" })); expect(within(modal).getByRole("alert")).toHaveTextContent("không thể có kết quả hòa"); }
      fireEvent.change(scores[0], { target: { value: a } }); fireEvent.change(scores[1], { target: { value: b } });
      await user.click(within(modal).getByRole("button", { name: "Lưu kết quả" })); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    }
    await editMatch(1, 2, 0, true); expect(findMatch(savedBracket(), 201).teamA.id).toBe(1);
    await editMatch(2, 2, 0); await editMatch(3, 3, 1);
    expect(screen.getByText("NHÀ VÔ ĐỊCH")).toBeInTheDocument(); expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "3");
    const first = within(tree()).getByRole("article", { name: "Trận #1", exact: true }); await user.click(within(first).getByRole("button"));
    let modal = screen.getByRole("dialog"); fireEvent.change(within(modal).getByLabelText("Thời gian thi đấu"), { target: { value: "2026-11-10T20:30" } });
    await user.click(within(modal).getByRole("button", { name: "Chỉ lưu giờ đấu" })); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(findMatch(savedBracket(), 101).scheduledTime).toBe("2026-11-10T20:30"); expect(screen.getByText("NHÀ VÔ ĐỊCH")).toBeInTheDocument();
    await editMatch(1, 0, 2); expect(screen.queryByText("NHÀ VÔ ĐỊCH")).not.toBeInTheDocument();
    expect(findMatch(savedBracket(), 201)).toMatchObject({ result: null, teamA: { id: 2 } });
  });
  it("trận chờ chỉ cho đổi giờ và nhánh đấu được lưu riêng từng giải", async () => {
    open("/tournament/schedule"); await ready("Lịch thi đấu"); const user = userEvent.setup();
    const final = within(tree()).getByRole("article", { name: "Trận #7", exact: true }); await user.click(within(final).getByRole("button", { name: "Đổi giờ đấu" }));
    const modal = screen.getByRole("dialog"); expect(within(modal).queryByRole("button", { name: "Lưu kết quả" })).not.toBeInTheDocument();
    expect(within(modal).getAllByRole("spinbutton")[0]).toBeDisabled();
    await user.click(within(modal).getByRole("button", { name: "Hủy" }));
    const firstId = savedBracket().bracketId;
    await user.selectOptions(screen.getByRole("combobox", { name: "Giải đấu đang quản lý" }), OTHER.id);
    await waitFor(() => expect(savedBracket(OTHER.id)).toBeDefined()); expect(savedBracket().bracketId).toBe(firstId);
    await user.click(screen.getByRole("button", { name: "Bốc thăm lại nhánh đấu" })); expect(savedBracket(OTHER.id).bracketId).not.toBe(firstId);
    expect(savedBracket().bracketId).toBe(firstId);
  });
});
