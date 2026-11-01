import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "@/App";
import { TourneyProvider } from "@/context/TourneyContext";
import { STORE_KEY } from "@/lib/tourney-store";
import { TOURNAMENT_SAMPLES } from "@/constants/tournament-catalog";

const PROFILE = { id: 7, tagName: "Captain", email: "captain@example.com" };
function location() { const value = useLocation(); return <span data-testid="location">{value.pathname}{value.search}</span>; }
const Location = location;
function open(path, extra = {}) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, profile: PROFILE, tournaments: [], ...extra }));
  return render(<MemoryRouter initialEntries={[path]}><TourneyProvider><AppRoutes /><Location /></TourneyProvider></MemoryRouter>);
}
function saved() { return JSON.parse(localStorage.getItem(STORE_KEY)); }
beforeEach(() => vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response("[]", { headers: { "Content-Type": "application/json" } }))));
afterEach(() => vi.useRealTimers());

describe("Dashboard", () => {
  it("tổng quan chỉ hiển thị 3 giải hoạt động, có đường tới danh sách đầy đủ", async () => {
    open("/dashboard", { tournaments: TOURNAMENT_SAMPLES.slice(0, 12).map((item) => ({ ...item, sample: false, ownerId: 7 })) });
    await screen.findByRole("heading", { level: 1, name: "Tổng quan của tôi" });
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Giải tổ chức: 12" })).toHaveAttribute("href", "/events?role=Organizer");
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Lọc tựa game" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: "Xem tất cả giải của tôi" }));
    await screen.findByRole("heading", { level: 1, name: "Giải đấu của tôi" });
    expect(screen.getAllByRole("article")).toHaveLength(5);
  });
  it("người mới có số liệu 0 và hướng dẫn, không có giải mẫu trong tổng quan", async () => {
    open("/dashboard");
    await screen.findByRole("heading", { level: 1, name: "Tổng quan của tôi" });
    await screen.findByRole("heading", { name: "Bắt đầu hành trình của bạn" });
    expect(screen.getByRole("link", { name: "Giải tổ chức: 0" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Giải tham gia: 0" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đội của tôi: 0" })).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(screen.queryByText("Giải mẫu để khám phá")).not.toBeInTheDocument();
  });
});

describe("Search", () => {
  it("đọc tournamentId từ API và phối hợp ba nhóm lọc; reset và đóng bằng Escape", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response(JSON.stringify([{
      tournamentId: 701, name: "Spring Cup API", game: { name: "Counter-Strike 2" }, status: "IN_PROGRESS",
      startDate: "2026-11-05T18:00", endDate: "2026-11-06T18:00",
    }]), { headers: { "Content-Type": "application/json" } })));
    open("/search");
    await screen.findByRole("heading", { level: 1, name: "Tìm kiếm giải đấu" }, { timeout: 5000 });
    const user = userEvent.setup();
    await user.type(screen.getByRole("searchbox"), "Spring Cup");
    expect(await screen.findByRole("link", { name: /Spring Cup API/ })).toBeInTheDocument();
    expect(saved().tournaments[0].id).toBe(701);
    await user.click(screen.getByRole("button", { name: "Bộ lọc", exact: true }));
    const popover = screen.getByRole("dialog", { name: "Bộ lọc giải đấu" });
    expect(within(within(popover).getByRole("group", { name: "TỰA GAME" })).getAllByRole("checkbox")).toHaveLength(9);
    await user.click(within(popover).getByLabelText("Đang diễn ra"));
    await user.click(within(popover).getByLabelText("Counter-Strike 2"));
    await user.click(within(popover).getByLabelText("Tùy chọn ngày"));
    fireEvent.change(within(popover).getByLabelText("Từ ngày"), { target: { value: "2026-11-01" } });
    fireEvent.change(within(popover).getByLabelText("Đến ngày"), { target: { value: "2026-11-05" } });
    expect(screen.getByRole("button", { name: "Bộ lọc (3)" })).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(1);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Đặt lại bộ lọc" }));
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(5));
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });
  it("API lỗi giữ danh sách và bộ lọc, không hiện thông báo hoặc nút thử lại", async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError("Offline"));
    vi.stubGlobal("fetch", fetch);
    open("/search");
    await screen.findByRole("heading", { name: "Tìm kiếm giải đấu", level: 1 });
    expect(screen.getAllByRole("article")).toHaveLength(5);
    await userEvent.type(screen.getByRole("searchbox"), "Valorant");
    expect(screen.queryByText(/Chưa thể tải thêm giải đấu/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Thử lại" })).not.toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toHaveValue("Valorant");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe("Events và Create", () => {
  it("phân trang 5 giải, lọc đúng vai trò và giữ giải đã chọn khi xem công khai", async () => {
    open("/events", {
      tournaments: [{ id: "tourney_own", ownerId: 7, name: "Giải tự tạo", details: { name: "Giải tự tạo" }, gameInfo: { game: "Valorant" } }, ...Array.from({ length: 4 }, (_, index) => ({ id: `extra_${index}`, name: `Giải riêng ${index}`, ownerId: 7 }))],
      registeredTournaments: [{ id: 91, registrantId: 7, name: "Giải tham gia", game: "CS2" }],
    });
    await screen.findByRole("heading", { level: 1, name: "Giải đấu của tôi" });
    expect(screen.getAllByRole("article")).toHaveLength(5);
    const pagination = screen.getByRole("navigation", { name: "Phân trang giải đấu của tôi" });
    await userEvent.click(within(pagination).getByRole("button", { name: "Trang 2", exact: true }));
    expect(screen.getAllByRole("article")).toHaveLength(1);
    await userEvent.click(within(screen.getByRole("group", { name: "Vai trò tham gia" })).getByRole("button", { name: "Ban tổ chức" }));
    expect(screen.getAllByRole("article")).toHaveLength(5);
    expect(screen.queryByRole("navigation", { name: "Phân trang giải đấu của tôi" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: "Xem giải đấu Giải tự tạo" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Giải tự tạo" }, { timeout: 5000 })).toBeInTheDocument();
    expect(saved()).toMatchObject({ activeTournamentId: "tourney_own", publicTournament: { name: "Giải tự tạo", role: "Organizer" } });
  });
  it("kiểm tra thứ tự ngày, tạo bản nháp sạch và giữ giải cũ", async () => {
    const old = { id: "tourney_old", name: "Cũ", details: { name: "Cũ" }, bannerImg: "old-banner", rules: "old-rules" };
    open("/create", { tournaments: [old], activeTournamentId: old.id, publicTournament: { name: "Đang xem" } });
    await screen.findByRole("heading", { level: 1, name: "Tạo giải đấu" });
    const user = userEvent.setup();
    const submit = screen.getByRole("button", { name: "Tạo giải đấu", exact: true });
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText(/Tên giải đấu/), "Giải mùa mới");
    await user.selectOptions(screen.getByLabelText(/Phương thức liên hệ/), "PHONE");
    expect(screen.getByLabelText(/Thông tin liên hệ/)).toHaveAttribute("placeholder", "0901234567");
    await user.type(screen.getByLabelText(/Thông tin liên hệ/), "0901234567");
    fireEvent.change(screen.getByLabelText(/Ngày bắt đầu/), { target: { value: "2026-11-01T10:00" } });
    fireEvent.change(screen.getByLabelText(/Ngày kết thúc/), { target: { value: "2026-11-01T10:00" } });
    expect(screen.getByRole("alert")).toHaveTextContent("Ngày kết thúc phải diễn ra sau ngày bắt đầu.");
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Ngày kết thúc/), { target: { value: "2026-11-02T10:00" } });
    await user.click(submit);
    expect(await screen.findByRole("heading", { level: 1, name: "Chi tiết giải đấu" })).toBeInTheDocument();
    expect(saved().tournaments).toHaveLength(2);
    expect(saved().tournaments[0]).toMatchObject({ name: "Giải mùa mới", contactType: "PHONE", profileImg: "", bannerImg: "", rules: "", gameInfo: { game: "" } });
    expect(saved().tournaments[1]).toMatchObject(old);
    expect(saved().activeTournamentId).toBe(saved().tournaments[0].id);
    expect(saved().publicTournament).toBeNull();
    await user.click(within(screen.getByRole("navigation", { name: "Lối tắt không gian quản lý" })).getByRole("link", { name: "Tổng quan" }));
    expect(await screen.findByRole("link", { name: "Xem giải đấu Giải mùa mới" })).toBeInTheDocument();
  });
});

const TEAM_A = { id: 1, name: "Alpha", game: "Valorant", captain: "Captain", captainKey: "id:7", memberIdentities: { "id:7": "Captain", "id:8": "Member" }, requestIdentities: { "id:9": "Applicant", "id:10": "Rejected" }, members: ["Captain", "Member"], pendingRequests: ["Applicant", "Rejected"], recruiting: true, logo: "" };
const TEAM_B = { id: 2, name: "Beta", game: "CS2", captain: "Other", captainKey: "id:8", members: ["Other"], pendingRequests: [], recruiting: true, logo: "" };
const TEAM_C = { id: 3, name: "Closed", game: "PUBG", captain: "Other", captainKey: "id:8", members: ["Other"], pendingRequests: [], recruiting: false, logo: "" };
const TEAM_D = { id: 4, name: "MemberTeam", game: "CS2", captain: "Other", captainKey: "id:8", memberIdentities: { "id:8": "Other", "id:7": "Captain" }, members: ["Other", "Captain"], pendingRequests: [], recruiting: true, logo: "" };
async function community(teams = [TEAM_A, TEAM_B, TEAM_C, TEAM_D]) {
  const result = open("/community", { teams });
  await screen.findByRole("heading", { level: 1, name: "Cộng đồng & Đội tuyển" });
  return result;
}
const mine = () => screen.getByRole("region", { name: "Đội tuyển của tôi" });
const discover = () => screen.getByRole("region", { name: "Khám phá Đội tuyển Cộng đồng" });

describe("Cộng đồng đội tuyển", () => {
  it("modal kiểm tra tên/game, tạo đội và lưu qua lần mở trang tiếp theo", async () => {
    const page = await community();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Tạo Team mới" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Lưu Đội Tuyển" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Vui lòng nhập Tên Đội Tuyển.");
    await user.type(within(dialog).getByLabelText(/Tên Đội Tuyển/), "New Team");
    await user.click(within(dialog).getByRole("button", { name: "Lưu Đội Tuyển" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Vui lòng chọn Tựa Game");
    await user.selectOptions(within(dialog).getByLabelText(/Tựa Game Thi Đấu Chính/), "CS2");
    await user.click(within(dialog).getByRole("button", { name: "Lưu Đội Tuyển" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(within(mine()).getByRole("article", { name: "New Team" })).toBeInTheDocument();
    expect(saved().teams[0]).toMatchObject({ name: "New Team", captain: "Captain", members: ["Captain"], pendingRequests: [] });
    expect(JSON.parse(sessionStorage.getItem("btp_tournament_teams"))[0].name).toBe("New Team");
    const state = saved(); page.unmount();
    open("/community", state);
    const region = await screen.findByRole("region", { name: "Đội tuyển của tôi" });
    expect(within(region).getByRole("heading", { name: "New Team", level: 3 })).toBeInTheDocument();
  });
  it("xin vào/hủy yêu cầu, và đội đã chốt không có nút xin vào", async () => {
    await community();
    const beta = within(discover()).getByRole("article", { name: "Beta" });
    const user = userEvent.setup();
    await user.click(within(beta).getByRole("button", { name: "Xin vào đội" }));
    expect(saved().teams.find((team) => team.id === 2).pendingRequests).toEqual(["Captain"]);
    await user.click(within(beta).getByRole("button", { name: "Đang chờ duyệt (Hủy)" }));
    expect(saved().teams.find((team) => team.id === 2).pendingRequests).toEqual([]);
    expect(within(within(discover()).getByRole("article", { name: "Closed" })).queryByRole("button", { name: "Xin vào đội" })).not.toBeInTheDocument();
  });
  it("đội trưởng duyệt/từ chối; thành viên thường chỉ được rời đội", async () => {
    await community();
    const alpha = within(mine()).getByRole("article", { name: "Alpha" });
    const user = userEvent.setup();
    await user.click(within(alpha).getByRole("button", { name: "Thành viên (2)" }));
    await user.click(within(alpha).getByRole("button", { name: "Đồng ý Applicant" }));
    await user.click(within(alpha).getByRole("button", { name: "Từ chối Rejected" }));
    expect(saved().teams[0]).toMatchObject({ members: ["Captain", "Member", "Applicant"], pendingRequests: [] });
    const memberTeam = within(mine()).getByRole("article", { name: "MemberTeam" });
    expect(within(memberTeam).queryByRole("button", { name: "Chỉnh sửa Team" })).not.toBeInTheDocument();
    await user.click(within(memberTeam).getByRole("button", { name: "Rời đội" }));
    expect(within(mine()).queryByRole("article", { name: "MemberTeam" })).not.toBeInTheDocument();
    expect(saved().teams.find((team) => team.id === 4).members).toEqual(["Other"]);
  });
  it("chỉnh sửa giữ thành viên/yêu cầu, lọc thành viên và giải tán không tự tạo lại đội", async () => {
    const page = await community([TEAM_A]);
    const user = userEvent.setup();
    await user.click(within(within(mine()).getByRole("article", { name: "Alpha" })).getByRole("button", { name: "Chỉnh sửa Team" }));
    const dialog = screen.getByRole("dialog");
    const name = within(dialog).getByLabelText(/Tên Đội Tuyển/);
    await user.clear(name); await user.type(name, "Alpha 2");
    await user.selectOptions(within(dialog).getByLabelText("Trạng Thái Đội Hình"), "false");
    await user.click(within(dialog).getByRole("button", { name: "Lưu Đội Tuyển" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(saved().teams[0]).toMatchObject({ name: "Alpha 2", members: ["Captain", "Member"], pendingRequests: ["Applicant", "Rejected"], recruiting: false });
    await user.type(screen.getByRole("searchbox", { name: "Tìm đội hoặc thành viên" }), "Member");
    expect(within(discover()).getAllByRole("article")).toHaveLength(1);
    await user.selectOptions(screen.getByRole("combobox", { name: "Trạng thái đội" }), "RECRUITING");
    expect(within(discover()).queryByRole("article")).not.toBeInTheDocument();
    await user.click(within(within(mine()).getByRole("article", { name: "Alpha 2" })).getByRole("button", { name: "Giải tán" }));
    expect(saved().teams).toEqual([]);
    const state = saved(); page.unmount(); open("/community", state);
    expect(await screen.findByText("Bạn chưa thuộc đội tuyển nào")).toBeInTheDocument();
    expect(saved().teams).toEqual([]);
  });
  it("logo quá 4MB bị từ chối và Escape đóng modal, khôi phục focus", async () => {
    await community();
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: "Tạo Team mới" });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog");
    await user.upload(within(dialog).getByLabelText("Tải ảnh Logo đội"), new File([new Uint8Array(4 * 1024 * 1024 + 1)], "large.png", { type: "image/png" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("tối đa là 4MB");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
