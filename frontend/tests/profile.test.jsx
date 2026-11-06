import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppRoutes } from "@/App";
import { TourneyProvider } from "@/context/TourneyContext";
import { STORE_KEY } from "@/lib/tourney-store";

const PROFILE = { id: 7, tagName: "Captain", userCode: "BTP007", email: "private@example.com", country: "Việt Nam", city: "Hà Nội", displayCityMode: "Hiển thị thành phố", birthday: "2002-01-10" };
function Location() { const location = useLocation(); return <span data-testid="location">{location.pathname}{location.search}</span>; }
function open(path, tournaments = []) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, rememberLogin: true, profile: PROFILE, tournaments }));
  return render(<MemoryRouter initialEntries={[path]}><TourneyProvider><AppRoutes /><Location /></TourneyProvider></MemoryRouter>);
}

describe("Hồ sơ công khai", () => {
  it("hồ sơ người khác không lộ thông tin riêng và ẩn nút cài đặt", () => {
    open("/profile?user=Other", [{ id: "tourney_1", name: "Giải riêng tư" }]);
    expect(screen.getByRole("heading", { level: 1, name: "Other" })).toBeInTheDocument();
    expect(screen.queryByText("private@example.com")).not.toBeInTheDocument();
    expect(screen.queryByText("Giải riêng tư")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Cài đặt hồ sơ", exact: true })).not.toBeInTheDocument();
    expect(screen.getByText("HỒ SƠ XEM TRƯỚC")).toBeInTheDocument();
  });
  it("phân trang riêng cho hai danh sách, mỗi trang 3 giải và chọn đúng giải", async () => {
    const organized = Array.from({ length: 4 }, (_, index) => ({ id: `tourney_${index}`, name: `Giải tổ chức ${index + 1}`, ownerId: 7 }));
    sessionStorage.setItem("btp_registered_tournaments", JSON.stringify(Array.from({ length: 4 }, (_, index) => ({
      id: `registered_${index}`, registrantId: 7, name: `Giải tham gia ${index + 1}`, endDate: "2099-10-30",
    }))));
    open("/profile", organized);
    expect(screen.getByRole("heading", { name: "Captain", level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Giải tổ chức 4/ })).not.toBeInTheDocument();
    const ownPagination = screen.getByRole("navigation", { name: "Phân trang giải đấu đã tổ chức" });
    await userEvent.click(within(ownPagination).getByRole("button", { name: "Trang 2", exact: true }));
    expect(screen.getByRole("link", { name: /Giải tổ chức 4/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Giải tham gia 1/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: /Giải tổ chức 4/ }));
    expect(screen.getByTestId("location")).toHaveTextContent("/tournament/home");
    expect(JSON.parse(localStorage.getItem(STORE_KEY)).activeTournamentId).toBe("tourney_3");
  });
});

describe("Cài đặt hồ sơ", () => {
  it("giữ đủ trường, lưu thay đổi và áp dụng tùy chọn ẩn thành phố", async () => {
    open("/profile/settings?tab=profile");
    const user = userEvent.setup();
    const save = screen.getByRole("button", { name: "Cập nhật hồ sơ" });
    expect(save).toBeDisabled();
    const name = screen.getByLabelText(/Tên hiển thị/);
    await user.clear(name); await user.type(name, "Captain Mới");
    await user.type(screen.getByLabelText(/Nhập tiểu sử/), "Xin chào cộng đồng");
    await user.click(screen.getByLabelText("Hiển thị đại từ nhân xưng"));
    await user.type(screen.getByLabelText("Đại từ nhân xưng", { selector: "input" }), "Anh ấy");
    await user.type(screen.getByLabelText("Mã bưu chính"), "10000");
    await user.type(screen.getByLabelText("Số điện thoại"), "0901234567");
    await user.selectOptions(screen.getByLabelText("Hiển thị địa điểm"), "Ẩn thành phố");
    await user.click(save);
    expect(await screen.findByRole("status")).toHaveTextContent("Đã cập nhật hồ sơ cá nhân thành công");
    expect(save).toBeDisabled();
    const saved = JSON.parse(localStorage.getItem(STORE_KEY)).profile;
    expect(saved).toMatchObject({ tagName: "Captain Mới", gamerTag: "Captain Mới", pronouns: "Anh ấy", zipCode: "10000", phone: "0901234567", displayCityMode: "Ẩn thành phố" });
    await user.click(screen.getByText("Xem hồ sơ").closest("a"));
    expect(screen.getByRole("heading", { level: 1, name: "Captain Mới" })).toBeInTheDocument();
    expect(screen.getByText("Xin chào cộng đồng")).toBeInTheDocument();
    expect(screen.queryByText("Hà Nội, Việt Nam")).not.toBeInTheDocument();
  });
  it("avatar vượt 4MB bị từ chối; ảnh hợp lệ có thể xem trước và xóa", async () => {
    open("/profile/settings");
    const input = screen.getByLabelText("Tải ảnh đại diện");
    const user = userEvent.setup();
    await user.upload(input, new File([new Uint8Array(4 * 1024 * 1024 + 1)], "large.png", { type: "image/png" }));
    expect(screen.getByRole("alert")).toHaveTextContent("không được vượt quá 4MB");
    expect(screen.getByRole("button", { name: "Cập nhật hồ sơ" })).toBeDisabled();
    await user.upload(input, new File(["image"], "avatar.png", { type: "image/png" }));
    expect(await screen.findByAltText("Ảnh đại diện xem trước")).toHaveAttribute("src", expect.stringContaining("data:image/png;base64,"));
    await user.click(screen.getByRole("button", { name: "Xóa ảnh", exact: true }));
    expect(screen.queryByAltText("Ảnh đại diện xem trước")).not.toBeInTheDocument();
  });
  it("tên toàn khoảng trắng bị từ chối", async () => {
    open("/profile/settings");
    const user = userEvent.setup();
    const input = screen.getByLabelText(/Tên hiển thị/);
    await user.clear(input); await user.type(input, "   ");
    await user.click(screen.getByRole("button", { name: "Cập nhật hồ sơ" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("không được để trống");
    expect(JSON.parse(localStorage.getItem(STORE_KEY)).profile.tagName).toBe("Captain");
  });
});

describe("Cài đặt tài khoản", () => {
  it("query chọn đúng tab và đổi email liên hệ, bảo toàn các trường hồ sơ", async () => {
    open("/profile/settings?tab=account&source=menu");
    expect(screen.getByRole("heading", { level: 1, name: "Cài đặt tài khoản" })).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Đổi địa chỉ email" }));
    await user.clear(screen.getByLabelText(/Email mới/)); await user.type(screen.getByLabelText(/Email mới/), "invalid");
    await user.click(screen.getByRole("button", { name: "Lưu Email" }));
    expect(screen.getByRole("alert")).toHaveTextContent("địa chỉ email hợp lệ");
    await user.clear(screen.getByLabelText(/Email mới/)); await user.type(screen.getByLabelText(/Email mới/), "new@example.com");
    await user.click(screen.getByRole("button", { name: "Lưu Email" }));
    expect(screen.getByText("new@example.com")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORE_KEY)).profile).toMatchObject({ tagName: "Captain", email: "new@example.com", birthday: "2002-01-10" });
    const nav = screen.getByRole("navigation", { name: "Cài đặt cá nhân" });
    await user.click(within(nav).getByRole("button", { name: "Cài đặt hồ sơ" }));
    expect(screen.getByTestId("location")).toHaveTextContent("tab=profile");
    expect(screen.getByTestId("location")).toHaveTextContent("source=menu");
  });
  it("đổi mật khẩu kiểm tra 6 ký tự và không giả báo thành công khi chưa có API", async () => {
    open("/profile/settings?tab=account");
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Mật khẩu hiện tại/, { selector: "input" }), "old-secret");
    await user.type(screen.getByLabelText(/Mật khẩu mới/, { selector: "input" }), "123");
    await user.click(screen.getByRole("button", { name: "Hiện mật khẩu mới" }));
    expect(screen.getByLabelText(/Mật khẩu mới/, { selector: "input" })).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Lưu mật khẩu" }));
    expect(screen.getByRole("alert")).toHaveTextContent("ít nhất 6 ký tự");
    await user.type(screen.getByLabelText(/Mật khẩu mới/, { selector: "input" }), "456");
    await user.click(screen.getByRole("button", { name: "Lưu mật khẩu" }));
    expect(screen.getByRole("alert")).toHaveTextContent("chưa được máy chủ hỗ trợ");
    expect(localStorage.getItem(STORE_KEY)).not.toContain("old-secret");
    expect(localStorage.getItem(STORE_KEY)).not.toContain("123456");
  });
  it("hủy xóa giữ nguyên dữ liệu; xác nhận xóa hồ sơ rồi chuyển login", async () => {
    open("/profile/settings?tab=account");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Xóa tài khoản", exact: true }));
    let dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("không xóa tài khoản trên máy chủ");
    await user.click(within(dialog).getByRole("button", { name: "Hủy", exact: true }));
    expect(JSON.parse(localStorage.getItem(STORE_KEY)).profile.tagName).toBe("Captain");
    await user.click(screen.getByRole("button", { name: "Xóa tài khoản", exact: true }));
    dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Xóa hồ sơ trên thiết bị", exact: true }));
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/login"));
    expect(JSON.parse(localStorage.getItem(STORE_KEY)).profile).toBeNull();
  });
});
