import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "@/App";
import { TourneyProvider } from "@/context/TourneyContext";
import { STORE_KEY } from "@/lib/tourney-store";
import OTPInputGroup from "@/components/shared/OTPInputGroup";
import { useState } from "react";

function Location() { const location = useLocation(); return <span data-testid="location">{location.pathname}{location.search}</span>; }
function open(path) { return render(<MemoryRouter initialEntries={[path]}><TourneyProvider><AppRoutes /><Location /></TourneyProvider></MemoryRouter>); }
function response(data, status = 200, json = false) {
  return new Response(json ? JSON.stringify(data) : data, { status, headers: { "Content-Type": json ? "application/json" : "text/plain" } });
}
afterEach(() => vi.useRealTimers());

describe("OTPInputGroup", () => {
  function Probe() {
    const [value, setValue] = useState(Array(6).fill(""));
    return <><OTPInputGroup value={value} onChange={setValue} /><output data-testid="otp">{value.join("")}</output></>;
  }
  it("chỉ nhận số, tự chuyển ô, hỗ trợ mũi tên và Backspace", async () => {
    render(<Probe />);
    const user = userEvent.setup();
    const inputs = screen.getAllByRole("textbox");
    expect(inputs[0]).toHaveFocus();
    await user.type(inputs[0], "a1");
    expect(inputs[0]).toHaveValue("1"); expect(inputs[1]).toHaveFocus();
    await user.keyboard("2{ArrowLeft}");
    expect(inputs[1]).toHaveFocus();
    await user.keyboard("{ArrowRight}{Backspace}");
    expect(inputs[1]).toHaveValue(""); expect(inputs[1]).toHaveFocus();
  });
  it("dán mã có khoảng trắng vào bất kỳ ô nào", async () => {
    render(<Probe />);
    const inputs = screen.getAllByRole("textbox");
    fireEvent.paste(inputs[3], { clipboardData: { getData: () => "12 34-56x" } });
    expect(screen.getByTestId("otp")).toHaveTextContent("123456");
    expect(inputs[5]).toHaveFocus();
  });
});

describe("Đăng nhập và đăng ký", () => {
  it("khóa form trống, báo lỗi 401 và giữ dữ liệu để thử lại", async () => {
    const fetch = vi.fn().mockResolvedValue(response("", 401));
    vi.stubGlobal("fetch", fetch); open("/login");
    const user = userEvent.setup();
    const button = screen.getByRole("button", { name: "Đăng nhập", exact: true });
    expect(button).toBeDisabled();
    await user.type(screen.getByLabelText("Tên người dùng", { exact: false }), "captain");
    await user.type(screen.getByLabelText("Mật khẩu", { exact: false, selector: "input" }), "wrong");
    await user.click(button);
    expect(await screen.findByRole("alert")).toHaveTextContent("Tên người dùng hoặc mật khẩu không chính xác.");
    expect(screen.getByLabelText("Tên người dùng", { exact: false })).toHaveValue("captain");
    expect(fetch.mock.calls[0][1]).toMatchObject({ method: "POST", body: "username=captain&password=wrong" });
  });
  it("đăng nhập thành công, thay hồ sơ và không cache mật khẩu máy chủ", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ userId: 9, username: "captain", email: "new@example.com", password: "SERVER_HASH" }, 200, true)));
    localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, profile: { id: 8, tagName: "Người khác", bio: "PRIVATE" }, tournaments: [] }));
    open("/login");
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Tên người dùng", { exact: false }), "captain");
    await user.type(screen.getByLabelText("Mật khẩu", { exact: false, selector: "input" }), "secret");
    await user.click(screen.getByRole("button", { name: "Đăng nhập", exact: true }));
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/dashboard"));
    const saved = localStorage.getItem(STORE_KEY);
    expect(JSON.parse(saved).profile).toMatchObject({ id: 9, tagName: "captain", email: "new@example.com", bio: "" });
    expect(saved).not.toContain("SERVER_HASH"); expect(saved).not.toContain("PRIVATE");
  });
  it("đăng ký kiểm tra khớp mật khẩu và gửi JSON, giữ email trong URL xác thực", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("SUCCESS: Đăng ký thành công!", { headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetch); open("/register");
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Tên người dùng", { exact: false }), "captain");
    await user.type(screen.getByLabelText("Email", { exact: false }), "a+b@example.com");
    await user.type(screen.getByLabelText(/^Mật khẩu/, { selector: "input" }), "secret");
    await user.type(screen.getByLabelText("Nhập lại mật khẩu", { exact: false, selector: "input" }), "different");
    expect(screen.getByRole("alert")).toHaveTextContent("Mật khẩu không khớp.");
    expect(screen.getByRole("button", { name: "Tạo tài khoản", exact: true })).toBeDisabled();
    await user.clear(screen.getByLabelText("Nhập lại mật khẩu", { exact: false, selector: "input" }));
    await user.type(screen.getByLabelText("Nhập lại mật khẩu", { exact: false, selector: "input" }), "secret");
    await user.click(screen.getByRole("button", { name: "Tạo tài khoản", exact: true }));
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/verify?email=a%2Bb%40example.com"));
    expect(fetch.mock.calls[0][0]).toBe("/api/users/register");
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ username: "captain", email: "a+b@example.com", password: "secret" });
  });
  it("lỗi trùng sau lần gửi trước cho tiếp tục OTP đúng email và ngữ cảnh", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("ERROR: Username đã tồn tại!", { status: 400, headers: { "Content-Type": "application/json" } })));
    open("/register?returnTo=" + encodeURIComponent("/tournament/view?id=41&tab=rules"));
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Tên người dùng", { exact: false }), "captain");
    await user.type(screen.getByLabelText("Email", { exact: false }), "a+b@example.com");
    await user.type(screen.getByLabelText(/^Mật khẩu/, { selector: "input" }), "secret");
    await user.type(screen.getByLabelText("Nhập lại mật khẩu", { exact: false, selector: "input" }), "secret");
    await user.click(screen.getByRole("button", { name: "Tạo tài khoản", exact: true }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Username đã tồn tại!");
    const link = screen.getByRole("link", { name: "Xác thực email", exact: true });
    const destination = new URL(link.getAttribute("href"), "https://btp.local");
    expect(destination.searchParams.get("email")).toBe("a+b@example.com");
    expect(destination.searchParams.get("returnTo")).toBe("/tournament/view?id=41&tab=rules");
    await user.click(link); expect(await screen.findByRole("heading", { name: "Xác thực mã OTP" })).toBeInTheDocument();
  });
  it.each(["/login", "/register"])("%s chỉ dùng tài khoản nội bộ, bỏ Google và giữ ngữ cảnh chuyển trang", (path) => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const returnTo = "/tournament/view?id=41&tab=rules";
    open(path + "?" + new URLSearchParams({ returnTo }));
    expect(screen.queryByRole("button", { name: "Tiếp tục với Google" })).not.toBeInTheDocument();
    expect(screen.queryByText("HOẶC", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "KHÔNG THỂ ĐĂNG NHẬP?" })).not.toBeInTheDocument();
    const label = path === "/login" ? "TẠO TÀI KHOẢN" : "ĐÃ CÓ TÀI KHOẢN? ĐĂNG NHẬP";
    const link = screen.getByRole("link", { name: label });
    const destination = new URL(link.getAttribute("href"), "https://btp.local");
    expect(destination.pathname).toBe(path === "/login" ? "/register" : "/login");
    expect(destination.searchParams.get("returnTo")).toBe(returnTo);
    if (path === "/login") expect(link.parentElement).toHaveClass("justify-end");
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("Xác thực email", () => {
  it("gửi đủ 6 số và rememberBrowser; thành công quay lại login", async () => {
    const fetch = vi.fn().mockResolvedValue(response("Xác thực thành công"));
    vi.stubGlobal("fetch", fetch); open("/verify?email=a%2Bb%40example.com");
    fireEvent.paste(screen.getByLabelText("Chữ số 1"), { clipboardData: { getData: () => "123456" } });
    await userEvent.click(screen.getByLabelText("Nhớ trình duyệt này trong 30 ngày"));
    await userEvent.click(screen.getByRole("button", { name: "Xác thực", exact: true }));
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/login"));
    expect(new URLSearchParams(fetch.mock.calls[0][1].body).get("code")).toBe("123456");
    expect(new URLSearchParams(fetch.mock.calls[0][1].body).get("email")).toBe("a+b@example.com");
    expect(new URLSearchParams(fetch.mock.calls[0][1].body).get("rememberBrowser")).toBe("true");
    expect(screen.getByRole("status")).toHaveTextContent("Xác thực email thành công");
  });
  it("mã sai cho phép sửa và thử lại", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response("ERROR: Mã đã hết hạn.", 400)));
    open("/verify?email=a@example.com");
    fireEvent.paste(screen.getByLabelText("Chữ số 1"), { clipboardData: { getData: () => "123456" } });
    await userEvent.click(screen.getByRole("button", { name: "Xác thực", exact: true }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Mã đã hết hạn.");
    expect(screen.getByRole("button", { name: "Xác thực", exact: true })).toBeEnabled();
  });
  it("không có email thì không gọi API", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch); open("/verify");
    await userEvent.click(screen.getByRole("button", { name: "GỬI LẠI MÃ" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tìm thấy email");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("gửi lại lỗi không giả báo thành công hoặc khóa nút", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response("ERROR: Gửi thư thất bại", 500)));
    open("/verify?email=a@example.com");
    await userEvent.click(screen.getByRole("button", { name: "GỬI LẠI MÃ" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Gửi thư thất bại");
    expect(screen.getByRole("button", { name: "GỬI LẠI MÃ" })).toBeEnabled();
  });
  it("gửi lại thành công có thời gian chờ đúng 30 giây", async () => {
    vi.useFakeTimers();
    const fetch = vi.fn().mockResolvedValue(response("Đã gửi lại"));
    vi.stubGlobal("fetch", fetch); open("/verify?email=a@example.com");
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "GỬI LẠI MÃ" })); });
    expect(screen.getByRole("button", { name: "GỬI LẠI MÃ (30S)" })).toBeDisabled();
    for (let count = 0; count < 30; count++) await act(async () => { vi.advanceTimersByTime(1000); });
    expect(screen.getByRole("button", { name: "GỬI LẠI MÃ", exact: true })).toBeEnabled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
