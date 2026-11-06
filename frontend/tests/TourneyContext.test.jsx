import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TourneyProvider, useTourney } from "@/context/TourneyContext";
import { tournamentApi } from "@/lib/api";
import { LOGIN_SESSION_KEY, STORE_KEY } from "@/lib/tourney-store";

function Probe() {
  const store = useTourney();
  return <div>
    <span data-testid="name">{store.currentUser?.tagName || "Khách"}</span>
    <span data-testid="tournaments">{store.tournaments.map((item) => item.name).join(", ")}</span>
    <span data-testid="status">{store.apiStatus}</span>
    <span role="status">{store.storageError || store.apiError}</span>
    <button onClick={() => store.updateProfile({ tagName: "Tên mới" })}>Sửa hồ sơ</button>
    <button onClick={() => store.setProfile({ id: 7, tagName: "Captain" })}>Đăng nhập</button>
    <button onClick={() => store.setProfile({ id: 7, tagName: "Captain" }, { remember: true })}>Lưu đăng nhập</button>
    <button onClick={store.clearProfile}>Đăng xuất</button>
    <button onClick={() => { store.refreshTournaments().catch(() => {}); }}>Đồng bộ</button>
  </div>;
}

describe("TourneyContext", () => {
  it("đồng bộ state với component và LocalStorage, không gọi API khi khởi tạo", async () => {
    const api = vi.spyOn(tournamentApi, "list");
    localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, rememberLogin: true, profile: { id: 7, tagName: "Tên cũ" }, tournaments: [] }));
    render(<TourneyProvider><Probe /></TourneyProvider>);
    expect(screen.getByTestId("name")).toHaveTextContent("Tên cũ");
    await userEvent.click(screen.getByRole("button", { name: "Sửa hồ sơ" }));
    expect(screen.getByTestId("name")).toHaveTextContent("Tên mới");
    expect(JSON.parse(localStorage.getItem(STORE_KEY)).profile.tagName).toBe("Tên mới");
    expect(api).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Đăng xuất" }));
    expect(screen.getByTestId("name")).toHaveTextContent("Khách");
    expect(sessionStorage.getItem("btp_user_profile")).toBeNull();
  });

  it.each(["react", "legacy-local", "legacy-session"])("hồ sơ %s cũ không tự đăng nhập, vẫn giữ giải đấu", (source) => {
    const profile = { id: 7, tagName: "Captain" };
    if (source === "react") localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, profile, tournaments: [{ id: 1, name: "Giải cũ" }] }));
    else {
      (source === "legacy-local" ? localStorage : sessionStorage).setItem(source === "legacy-local" ? "btp_profile_data_v1" : "btp_user_profile", JSON.stringify(profile));
      sessionStorage.setItem("btp_created_tournaments", JSON.stringify([{ id: 1, name: "Giải cũ" }]));
    }
    render(<TourneyProvider><Probe /></TourneyProvider>);
    expect(screen.getByTestId("name")).toHaveTextContent("Khách");
    expect(screen.getByTestId("tournaments")).toHaveTextContent("Giải cũ");
  });

  it.each([false, true])("đăng nhập remember=%s giữ qua tải lại, mở phiên mới theo lựa chọn và đăng xuất xóa phiên", async (remember) => {
    const open = () => render(<TourneyProvider><Probe /></TourneyProvider>);
    let page = open();
    await userEvent.click(screen.getByRole("button", { name: remember ? "Lưu đăng nhập" : "Đăng nhập", exact: true }));
    expect(JSON.parse(localStorage.getItem(STORE_KEY)).rememberLogin).toBe(remember);
    expect(JSON.parse(sessionStorage.getItem(LOGIN_SESSION_KEY))).toBe("id:7");
    page.unmount(); page = open();
    expect(screen.getByTestId("name")).toHaveTextContent("Captain");
    page.unmount(); sessionStorage.clear(); page = open();
    expect(screen.getByTestId("name")).toHaveTextContent(remember ? "Captain" : "Khách");
    await userEvent.click(screen.getByRole("button", { name: "Đăng xuất" }));
    expect(sessionStorage.getItem(LOGIN_SESSION_KEY)).toBeNull();
    expect(JSON.parse(localStorage.getItem(STORE_KEY))).toMatchObject({ profile: null, rememberLogin: false });
    page.unmount(); open();
    expect(screen.getByTestId("name")).toHaveTextContent("Khách");
  });

  it("tab khách không tự đăng nhập hoặc ghi đè phiên của tab khác khi nhận dữ liệu", async () => {
    render(<TourneyProvider><Probe /></TourneyProvider>);
    const incoming = { version: 1, profile: { id: 7, tagName: "Captain" }, rememberLogin: false, tournaments: [{ id: 1, name: "Giải đồng bộ" }] };
    localStorage.setItem(STORE_KEY, JSON.stringify(incoming));
    await act(async () => window.dispatchEvent(new StorageEvent("storage", { key: STORE_KEY, storageArea: localStorage, newValue: JSON.stringify(incoming) })));
    expect(screen.getByTestId("name")).toHaveTextContent("Khách");
    expect(screen.getByTestId("tournaments")).toHaveTextContent("Giải đồng bộ");
    expect(JSON.parse(localStorage.getItem(STORE_KEY)).profile.id).toBe(7);
  });

  it("giữ dữ liệu cục bộ và báo lỗi khi API không kết nối được", async () => {
    sessionStorage.setItem("btp_created_tournaments", JSON.stringify([{ id: 1, name: "Giải cục bộ" }]));
    vi.spyOn(tournamentApi, "list").mockRejectedValue(new Error("Máy chủ đang ngoại tuyến"));
    render(<TourneyProvider><Probe /></TourneyProvider>);
    await userEvent.click(screen.getByRole("button", { name: "Đồng bộ" }));
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("error"));
    expect(screen.getByTestId("tournaments")).toHaveTextContent("Giải cục bộ");
    expect(screen.getByRole("status")).toHaveTextContent("Máy chủ đang ngoại tuyến");
  });

  it("bỏ phản hồi cũ nếu có hai lần đồng bộ chồng nhau", async () => {
    let finishFirst;
    vi.spyOn(tournamentApi, "list")
      .mockImplementationOnce(() => new Promise((resolve) => { finishFirst = resolve; }))
      .mockResolvedValueOnce([{ id: 1, name: "Phản hồi mới" }]);
    render(<TourneyProvider><Probe /></TourneyProvider>);
    await userEvent.click(screen.getByRole("button", { name: "Đồng bộ" }));
    await userEvent.click(screen.getByRole("button", { name: "Đồng bộ" }));
    await waitFor(() => expect(screen.getByTestId("tournaments")).toHaveTextContent("Phản hồi mới"));
    await act(async () => { finishFirst([{ id: 1, name: "Phản hồi cũ" }]); });
    expect(screen.getByTestId("tournaments")).toHaveTextContent("Phản hồi mới");
  });

  it("vẫn cho sửa state và báo lỗi khi Storage bị chặn hoặc đầy", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Quota exceeded", "QuotaExceededError"); });
    render(<TourneyProvider><Probe /></TourneyProvider>);
    await userEvent.click(screen.getByRole("button", { name: "Sửa hồ sơ" }));
    expect(screen.getByTestId("name")).toHaveTextContent("Tên mới");
    expect(screen.getByRole("status")).toHaveTextContent("Không thể lưu dữ liệu");
  });
});
