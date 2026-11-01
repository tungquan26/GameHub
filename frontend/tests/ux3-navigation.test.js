import { describe, expect, it } from "vitest";
import { authPath, isManagementRoute, loginPath, requiresAuthentication, returnToFrom, safeReturnTo } from "@/lib/navigation";

describe("UX-3: đích quay lại nội bộ", () => {
  it.each([
    "https://evil.example", "//evil.example/path", "/\\evil.example", "/%2f%2fevil.example", "/%252f%252fevil.example",
    "/%255cevil.example", "/search%0A", "/search\n", "/%ZZ", "/login?returnTo=/create", "/REGISTER/", "/auth/verify",
    "/%6cogin", "/%256cogin", "/auth/%76erify", "/search/../login", "/%2e/auth/login",
  ])("bỏ URL ngoài, mã hóa nguy hiểm và đường quay lại xác thực: %s", (value) => {
    expect(safeReturnTo(value, "/dashboard")).toBe("/dashboard");
  });

  it.each(["/search?q=100%25&game=valorant#results", "/tournament/view?id=1&sample=1#rules", "/community?action=create-team#discoverTeamsSection", "/create?source=home#form"])("giữ đầy đủ đường dẫn, query và hash: %s", (destination) => {
    expect(safeReturnTo(destination)).toBe(destination);
    const location = { pathname: "/login", search: "?" + new URLSearchParams({ returnTo: destination }), hash: "" };
    expect(returnToFrom(location)).toBe(destination);
    for (const pathname of ["/register", "/verify", "/login"]) expect(new URLSearchParams(authPath(pathname, location).search).get("returnTo")).toBe(destination);
  });

  it("thiếu đích dùng fallback; đích sai không được chuyển tiếp qua auth", () => {
    expect(returnToFrom({ search: "" }, "/dashboard")).toBe("/dashboard");
    expect(returnToFrom({ search: "", state: { from: "/events?role=player#list" } })).toBe("/events?role=player#list");
    expect(authPath("/verify", { search: "?returnTo=https://evil.example" }, { email: "a+b@example.com" })).toEqual({ pathname: "/verify", search: "email=a%2Bb%40example.com" });
    expect(loginPath({ pathname: "/community", search: "action=create-team", hash: "form" })).toEqual({ pathname: "/login", search: "returnTo=%2Fcommunity%3Faction%3Dcreate-team%23form" });
  });

  it("phân biệt lịch công khai và route cá nhân/quản lý, kể cả URL viết hoa hoặc mã hóa", () => {
    for (const path of ["/dashboard", "/events", "/create", "/profile/settings?tab=account", "/tournament/details?id=1", "/tournament/schedule?id=1", "/DASHBOARD/", "/%64ashboard"]) expect(requiresAuthentication(path)).toBe(true);
    for (const path of ["/", "/search", "/community", "/profile?user=Other", "/tournament/view?id=1", "/tournament/schedule?id=1&view=public"]) expect(requiresAuthentication(path)).toBe(false);
    expect(isManagementRoute({ pathname: "/%ZZ", search: "" })).toBe(false);
  });
});
