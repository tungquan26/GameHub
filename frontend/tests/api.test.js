import { describe, expect, it, vi } from "vitest";
import { authApi, request, tournamentApi } from "@/lib/api";

describe("API hiện có", () => {
  it("đọc đúng danh sách JSON", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ id: 1, name: "BTP" }]), { headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetch);
    expect(await tournamentApi.list()).toEqual([{ id: 1, name: "BTP" }]);
    expect(fetch).toHaveBeenCalledWith("/api/tournaments", expect.objectContaining({ credentials: "same-origin" }));
  });
  it("báo lỗi HTTP với thông báo máy chủ", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "Không được phép" }), { status: 403, headers: { "Content-Type": "application/json" } })));
    await expect(request("/api/tournaments")).rejects.toMatchObject({ name: "ApiError", status: 403, message: "Không được phép" });
  });
  it("không coi JSON hỏng là đồng bộ thành công", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{broken", { headers: { "Content-Type": "application/json" } })));
    await expect(tournamentApi.list()).rejects.toThrow("JSON không hợp lệ");
  });
  it.each([
    ["register", { username: "captain", email: "qa@example.invalid", password: "secret" }],
    ["verify", { email: "qa@example.invalid", code: "123456" }],
    ["resend", "qa@example.invalid"],
  ])("%s đọc được thông báo String từ Spring gắn nhãn JSON", async (method, values) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Thao tác thành công!", { headers: { "Content-Type": "application/json" } })));
    expect(await authApi[method](values)).toBe("Thao tác thành công!");
  });
  it("đọc được JSON thông báo mới và giữ đúng lỗi trùng tài khoản của backend cũ", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "Đăng ký thành công!" }), { headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response("ERROR: Username đã tồn tại!", { status: 400, headers: { "Content-Type": "application/json" } })));
    expect(await authApi.register({})).toEqual({ message: "Đăng ký thành công!" });
    await expect(authApi.register({})).rejects.toMatchObject({ status: 400, message: "ERROR: Username đã tồn tại!" });
  });
  it.each(["{broken", "[broken", '"unterminated', "<!DOCTYPE html><html>Proxy error</html>"])("không coi dữ liệu hỏng %s là đăng ký thành công", async (body) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { headers: { "Content-Type": "application/json" } })));
    await expect(authApi.register({})).rejects.toThrow("JSON không hợp lệ");
  });
  it("login vẫn yêu cầu JSON đúng, không dùng ngoại lệ dành cho thông báo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not a user", { headers: { "Content-Type": "application/json" } })));
    await expect(authApi.login({})).rejects.toThrow("JSON không hợp lệ");
  });
  it("không mở OTP khi proxy trả về trang HTML thay cho phản hồi đăng ký", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<!DOCTYPE html><html>Frontend fallback</html>", { headers: { "Content-Type": "text/html" } })));
    await expect(authApi.register({})).rejects.toThrow("JSON không hợp lệ");
  });
});
