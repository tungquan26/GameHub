import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS, filterTournaments, landingHighlights, matchesDates, normalizeTournament, registrationStatus } from "@/lib/tournaments";
import { discoveryPath, readTournamentSearch, writeTournamentSearch } from "@/lib/tournament-search";
import { tournamentAccess } from "@/lib/public-tournament";
import { TOURNAMENT_SAMPLES } from "@/constants/tournament-catalog";

const now = new Date("2026-10-31T03:00:00Z");
describe("UX-4: bộ lọc trong URL", () => {
  it("đọc/ghi đầy đủ các lựa chọn lặp, slug game, ngày, từ khóa và trang", () => {
    const search = { keyword: "Cúp Việt & SEA", page: 3, filters: { games: ["Valorant", "CS2"], statuses: ["in_progress", "completed"], dateRanges: ["next_7_days", "custom"], from: "2026-11-01", to: "2026-11-30" } };
    const params = writeTournamentSearch(search, new URLSearchParams("utm=home&tag=one&tag=two&page=99&game=tft"));
    expect(params.getAll("game")).toEqual(["valorant", "counterstrike2"]);
    expect(params.getAll("status")).toEqual(search.filters.statuses);
    expect(params.getAll("range")).toEqual(search.filters.dateRanges);
    expect(params.getAll("tag")).toEqual(["one", "two"]);
    expect(params.get("utm")).toBe("home");
    expect(readTournamentSearch(params)).toEqual(search);
  });

  it("đọc tên/alias game cũ nhưng ghi link mới bằng slug, bỏ lựa chọn trùng", () => {
    const state = readTournamentSearch(new URLSearchParams("game=CS2&game=counterstrike2&game=Wild+Rift&status=in_progress&status=in_progress"));
    expect(state.filters.games).toEqual(["CS2", "League of Legends: Wild Rift"]);
    expect(writeTournamentSearch(state).getAll("game")).toEqual(["counterstrike2", "leagueoflegendswildrift"]);
    expect(state.filters.statuses).toEqual(["in_progress"]);
  });

  it.each(["-1", "0", "1.5", "abc", "1e9", "999999999999999999999"])("trang không hợp lệ (%s) trở về trang 1", (page) => {
    expect(readTournamentSearch(new URLSearchParams({ page })).page).toBe(1);
  });

  it("bỏ game/trạng thái/khoảng ngày không hỗ trợ và ngày không có thật", () => {
    const state = readTournamentSearch(new URLSearchParams("game=Dota2&status=made-up&range=forever&from=2026-02-30&to=2026-13-01"));
    expect(state.filters).toEqual(EMPTY_FILTERS);
    expect(readTournamentSearch(new URLSearchParams("from=2028-02-29")).filters).toMatchObject({ dateRanges: ["custom"], from: "2028-02-29" });
  });

  it("link ngày tự chọn nhận khoảng ngày; bỏ ngày cũ khi tắt khoảng tự chọn", () => {
    const state = readTournamentSearch(new URLSearchParams("from=2026-11-01&to=2026-11-05"));
    expect(state.filters.dateRanges).toEqual(["custom"]);
    const params = writeTournamentSearch({ ...state, filters: { ...state.filters, dateRanges: [] } });
    expect(params.has("from")).toBe(false); expect(params.has("to")).toBe(false);
  });

  it("đường khám phá game/trạng thái dùng cùng quy tắc với trang search", () => {
    expect(discoveryPath({ game: "CS2", status: "open_registration" })).toEqual({ pathname: "/search", search: "game=counterstrike2&status=open_registration" });
    expect(discoveryPath()).toEqual({ pathname: "/search", search: "" });
  });
});

describe("UX-4: nhóm nổi bật phản ánh trạng thái thật", () => {
  const entry = (id, values = {}) => normalizeTournament({ id, name: `Cup ${id}`, game: "Valorant", status: "open", ...values });
  it("chỉ lấy tối đa 4 giải mỗi nhóm và không sửa dữ liệu để lấp nội dung", () => {
    const catalog = [...Array.from({ length: 7 }, (_, id) => entry(id)), ...Array.from({ length: 6 }, (_, id) => entry(id + 10, { status: "ONGOING" }))];
    const before = structuredClone(catalog);
    const highlights = landingHighlights(catalog, now);
    expect(highlights.open).toHaveLength(4); expect(highlights.ongoing).toHaveLength(4);
    expect(catalog).toEqual(before);
    expect(landingHighlights([entry(99, { status: "completed" })], now)).toEqual({ open: [], ongoing: [] });
  });

  it("nhóm mở đăng ký dùng cùng điều kiện với nút đăng ký, loại đóng/chưa mở/hủy/cũ", () => {
    const entries = [entry(1), entry(2, { status: "REGISTRATION_CLOSED" }), entry(3, { regSettings: { registrationStartDate: "2026-11-15" } }), entry(4, { regSettings: { registrationEndDate: "2026-10-01" } }), entry(5, { status: "CANCELLED" }), entry(6, { badgeLabel: "Sắp diễn ra" }), entry("tourney_old", { source: "local" }), entry(8, { status: "ONGOING" })];
    expect(landingHighlights(entries, now).open.map((item) => item.id)).toEqual([1]);
    expect(filterTournaments(entries, "", { ...EMPTY_FILTERS, statuses: ["open_registration"] }, now).map((item) => item.id)).toEqual([1]);
    expect(registrationStatus(entries[1], now)).toBe("REGISTRATION_CLOSED");
    expect(tournamentAccess(entries[4], null, [], now)).toMatchObject({ label: "Đã hủy", disabled: true });
  });

  it("mẫu đang diễn ra giữ nguyên số lượng thật, không tạo thêm fixture", () => {
    const catalog = TOURNAMENT_SAMPLES.map((sample) => normalizeTournament(sample));
    expect(landingHighlights(catalog, now).ongoing).toHaveLength(catalog.filter((item) => item.status === "in_progress").length);
  });

  it("lọc ngày không nhận giải thiếu ngày hoặc ngày lỗi, vẫn gồm hai đầu khoảng", () => {
    const filters = { ...EMPTY_FILTERS, dateRanges: ["custom"], from: "2026-11-01", to: "2026-11-05" };
    for (const startDate of [undefined, "bad", "2026-02-30", "2026-11-06"]) expect(matchesDates({ startDate }, filters, now)).toBe(false);
    for (const startDate of ["2026-11-01T00:00", "2026-11-05T23:59"]) expect(matchesDates({ startDate }, filters, now)).toBe(true);
  });
});
