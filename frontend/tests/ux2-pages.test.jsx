import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "@/App";
import { TourneyProvider, useTourney } from "@/context/TourneyContext";
import { STORE_KEY } from "@/lib/tourney-store";
import { findSample } from "@/constants/tournament-catalog";

const alice = { id: 7, tagName: "Captain" };
const bob = { id: 8, tagName: "Captain" };
const reply = (entry) => new Response(JSON.stringify(entry), { headers: { "Content-Type": "application/json" } });
function Controls() {
  const { setProfile } = useTourney();
  return <><button onClick={() => setProfile(bob)}>Switch account</button><Link to="/tournament/view?id=902">Another tournament</Link></>;
}
function open(path, extra = {}) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, profile: alice, tournaments: [], ...extra }));
  return render(<MemoryRouter initialEntries={[path]}><TourneyProvider><AppRoutes /><Controls /></TourneyProvider></MemoryRouter>);
}
const state = () => JSON.parse(localStorage.getItem(STORE_KEY));
beforeEach(() => vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => reply([]))));

describe("UX-2: mở giải độc lập và dữ liệu cá nhân", () => {
  it("tài khoản mới có danh sách trống; giải có sẵn nằm ở khám phá và không có nhãn mẫu", async () => {
    const view = open("/events");
    await screen.findByRole("heading", { name: "Bạn chưa có giải đấu nào" });
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    view.unmount(); open("/search");
    const link = await screen.findByRole("link", { name: `Xem giải đấu ${findSample(1).name}` });
    expect(link).toHaveAttribute("href", expect.stringContaining("id=1&sample=1"));
    expect(link).not.toHaveTextContent("Giải mẫu");
    expect(within(link).queryByText("Ban tổ chức")).not.toBeInTheDocument();
  });

  it("reload liên kết mẫu không cần publicTournament và không mở nhầm giải thật trùng ID", async () => {
    open("/tournament/view?id=1&sample=1", { tournaments: [{ id: 1, name: "Real Cup", ownerId: 7 }], activeTournamentId: 1 });
    const sidebar = await screen.findByRole("region", { name: "Thông tin giải đấu công khai" });
    expect(sidebar).toHaveTextContent(findSample(1).name);
    expect(sidebar).not.toHaveTextContent("Real Cup");
    expect(screen.queryByRole("button", { name: "Quản lý giải đấu" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Đăng ký tham gia" }));
    expect(state().registeredTournaments[0]).toMatchObject({ sample: true, registrantKey: "id:7" });
    expect(screen.getByRole("button", { name: "Đã đăng ký" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Switch account" }));
    expect(screen.getByRole("button", { name: "Đăng ký tham gia" })).toBeEnabled();
  });

  it("tải giải backend theo ID khi mở trực tiếp và giữ cache khác nguyên vẹn", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => reply({ tournamentId: 808, name: "API Cup", game: { name: "Valorant" }, organizer: { userId: 9 } })));
    const stored = { id: "tourney_saved", name: "Saved", ownerId: 7, rules: "Keep me", tournamentTeams: [] };
    open("/tournament/view?id=808", { tournaments: [stored], activeTournamentId: stored.id });
    expect(await screen.findByRole("region", { name: "Thông tin giải đấu công khai" })).toHaveTextContent("API Cup");
    expect(fetch).toHaveBeenCalledWith("/api/tournaments/808", expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(state().tournaments).toEqual([stored]);
    expect(screen.queryByRole("button", { name: "Quản lý giải đấu" })).not.toBeInTheDocument();
  });

  it("API lỗi có Thử lại; không dùng giải đang chọn làm kết quả thay thế", async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new TypeError("Offline")).mockImplementation(async () => reply({ id: 808, name: "Recovered Cup" }));
    vi.stubGlobal("fetch", fetch);
    const stored = { id: "tourney_saved", name: "Saved", ownerId: 7, tournamentTeams: [] };
    open("/tournament/view?id=808", { tournaments: [stored], activeTournamentId: stored.id });
    expect(await screen.findByRole("heading", { name: "Chưa thể tải giải đấu" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Thông tin giải đấu công khai" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByRole("region", { name: "Thông tin giải đấu công khai" })).toHaveTextContent("Recovered Cup");
    expect(state().tournaments).toEqual([stored]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("404 hiển thị không tìm thấy thay vì giải đang quản lý", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response("Not found", { status: 404 })));
    open("/tournament/view?id=missing", { tournaments: [{ id: 1, name: "Private Cup", ownerId: 7 }], activeTournamentId: 1 });
    expect(await screen.findByRole("heading", { name: "Không tìm thấy giải đấu" })).toBeInTheDocument();
    expect(screen.queryByText("Private Cup")).not.toBeInTheDocument();
  });

  it("bỏ phản hồi cũ khi đổi liên kết trong lúc đang tải", async () => {
    let complete;
    vi.stubGlobal("fetch", vi.fn().mockImplementationOnce(() => new Promise((resolve) => { complete = resolve; })).mockImplementation(async () => reply({ id: 902, name: "New Cup" })));
    open("/tournament/view?id=901");
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    await userEvent.click(screen.getByRole("link", { name: "Another tournament" }));
    expect(await screen.findByRole("region", { name: "Thông tin giải đấu công khai" })).toHaveTextContent("New Cup");
    await act(async () => complete(reply({ id: 901, name: "Old Cup" })));
    expect(screen.queryByText("Old Cup")).not.toBeInTheDocument();
  });

  it("đổi tài khoản cùng GamerTag không nhận giải và đăng ký của tài khoản trước", async () => {
    open("/events", { tournaments: [{ id: 31, name: "Alice Cup", ownerId: 7 }], registeredTournaments: [{ id: 32, name: "Alice joined", registrantKey: "id:7" }] });
    await screen.findByRole("link", { name: "Xem giải đấu Alice Cup" });
    expect(screen.getAllByRole("article")).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "Switch account" }));
    expect(await screen.findByRole("heading", { name: "Bạn chưa có giải đấu nào" })).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(state().registeredTournaments).toHaveLength(1);
    expect(state().tournaments).toHaveLength(1);
  });

  it("giải cũ chưa có chủ sở hữu được giữ riêng và không mở form chỉnh sửa", async () => {
    const legacy = { id: "tourney_old", name: "Old Cup", source: "local", details: { name: "Old Cup" }, tournamentTeams: [] };
    const page = open("/events", { tournaments: [legacy], activeTournamentId: legacy.id });
    await screen.findByRole("heading", { name: "Bạn chưa có giải đấu nào" });
    await userEvent.click(screen.getByText("Giải đấu khác"));
    expect(await screen.findByRole("link", { name: "Xem giải đấu Old Cup" })).toBeInTheDocument();
    const snapshot = state(); page.unmount();
    open("/tournament/details?id=tourney_old", snapshot);
    expect(await screen.findByRole("heading", { name: "Giải đấu chỉ được xem" })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Tên giải đấu/)).not.toBeInTheDocument();
    expect(state().tournaments).toEqual([legacy]);
  });

  it("khách xem đội mẫu mà không nhận đội mẫu thành đội của mình", async () => {
    open("/community", { profile: null });
    const discovery = await screen.findByRole("region", { name: "Khám phá Đội tuyển Cộng đồng" });
    expect(await within(discovery).findAllByRole("article")).toHaveLength(5);
    expect(within(discovery).queryByText("Đội mẫu")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Đội tuyển của tôi" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Chỉnh sửa Team" })).not.toBeInTheDocument();
  });
});
