import { describe, expect, it } from "vitest";
import { loadState, mergeTournaments, parseState, profileData, STORE_KEY } from "@/lib/tourney-store";
import { isLegacyTournament } from "@/lib/tournaments";

describe("Tương thích dữ liệu dự án gốc", () => {
  it("phục hồi an toàn khi JSON cũ bị lỗi", () => {
    localStorage.setItem(STORE_KEY, "{broken");
    sessionStorage.setItem("btp_created_tournaments", "null");
    sessionStorage.setItem("btp_tournament_data", "{broken");
    expect(loadState(localStorage, sessionStorage)).toMatchObject({
      profile: null, tournaments: [], activeTournamentId: null,
    });
  });

  it("giữ giải đang chọn cùng ảnh, điều lệ, đăng ký và layout trang chủ", () => {
    sessionStorage.setItem("btp_user_profile", JSON.stringify({ tagName: "Đội trưởng", userCode: "VN01", bio: "Xin chào" }));
    sessionStorage.setItem("btp_created_tournaments", JSON.stringify([
      { id: "first", name: "Giải khác" }, { id: "active", name: "Tên cũ", customField: "giữ lại" },
    ]));
    sessionStorage.setItem("btp_active_tournament_id", "active");
    sessionStorage.setItem("btp_tournament_data", JSON.stringify({ id: "active", name: "Giải mùa thu", venueLat: 10.7 }));
    sessionStorage.setItem("btp_tournament_profile_img", "data:image/png;base64,logo");
    sessionStorage.setItem("btp_tournament_banner_img", "data:image/png;base64,banner");
    sessionStorage.setItem("btp_tournament_rules", "# Điều lệ");
    sessionStorage.setItem("btp_tournament_game_info", JSON.stringify({ game: "CS2" }));
    sessionStorage.setItem("btp_tournament_reg_settings", JSON.stringify({ maxTeams: 16 }));
    sessionStorage.setItem("btp_tournament_homepage_layout_v2", JSON.stringify({ sections: [{ id: 1 }] }));
    const state = loadState(localStorage, sessionStorage);
    expect(state.profile).toMatchObject({ tagName: "Đội trưởng", bio: "Xin chào" });
    expect(state.tournaments).toHaveLength(2);
    expect(isLegacyTournament(state.tournaments[0])).toBe(true);
    expect(state.tournaments[0].ownerId).toBeUndefined();
    expect(state.activeTournamentId).toBe("active");
    expect(state.tournaments[1]).toMatchObject({
      name: "Giải mùa thu", customField: "giữ lại", details: { venueLat: 10.7 },
      profileImg: "data:image/png;base64,logo", bannerImg: "data:image/png;base64,banner",
      rules: "# Điều lệ", gameInfo: { game: "CS2" }, regSettings: { maxTeams: 16 },
      homepageLayout: { sections: [{ id: 1 }] },
    });
  });

  it("ưu tiên state React đã lưu, kể cả hồ sơ đã đăng xuất", () => {
    localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, profile: null, tournaments: [], activeTournamentId: null }));
    sessionStorage.setItem("btp_user_profile", JSON.stringify({ tagName: "Cũ" }));
    expect(loadState(localStorage, sessionStorage).profile).toBeNull();
  });

  it("không lưu mật khẩu hoặc token trong hồ sơ hiển thị", () => {
    expect(profileData({ username: "btp", password: "secret", passwordHash: "hash", accessToken: "token", email: "btp@example.com" }))
      .toEqual({ username: "btp", email: "btp@example.com" });
  });

  it("kiểm tra cấu trúc cache và loại bản ghi hỏng", () => {
    expect(parseState({ version: 2, tournaments: [] })).toBeNull();
    expect(parseState({ version: 1, tournaments: {} })).toBeNull();
    expect(parseState({ version: 1, tournaments: [null, [], { id: 7, name: "Hợp lệ" }] }).tournaments)
      .toEqual([{ id: 7, name: "Hợp lệ" }]);
  });

  it("gộp API theo id số/chuỗi, giữ bản nháp và thông tin cục bộ", () => {
    expect(mergeTournaments(
      [{ id: "7", name: "Cũ", homepageLayout: [1] }, { id: "draft", name: "Bản nháp" }],
      [{ id: 7, name: "Mới" }, { id: 8, name: "API" }],
    )).toEqual([
      { id: 7, name: "Mới", homepageLayout: [1] }, { id: "draft", name: "Bản nháp" }, { id: 8, name: "API" },
    ]);
  });
});
