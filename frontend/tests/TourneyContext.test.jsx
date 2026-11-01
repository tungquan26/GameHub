import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TourneyProvider, useTourney } from "@/context/TourneyContext";
import { tournamentApi } from "@/lib/api";
import { STORE_KEY } from "@/lib/tourney-store";

function Probe() {
  const store = useTourney();
  return <div>
    <span data-testid="name">{store.currentUser?.tagName || "Khách"}</span>
    <span data-testid="tournaments">{store.tournaments.map((item) => item.name).join(", ")}</span>
    <span data-testid="status">{store.apiStatus}</span>
    <span role="status">{store.storageError || store.apiError}</span>
    <button onClick={() => store.updateProfile({ tagName: "Tên mới" })}>Sửa hồ sơ</button>
    <button onClick={store.clearProfile}>Đăng xuất</button>
    <button onClick={() => { store.refreshTournaments().catch(() => {}); }}>Đồng bộ</button>
  </div>;
}

describe("TourneyContext", () => {
  it("đồng bộ state với component và LocalStorage, không gọi API khi khởi tạo", async () => {
    const api = vi.spyOn(tournamentApi, "list");
    sessionStorage.setItem("btp_user_profile", JSON.stringify({ tagName: "Tên cũ" }));
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
