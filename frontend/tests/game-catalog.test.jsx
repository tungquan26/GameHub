import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { SUPPORTED_GAMES } from "@/constants/games";
import { DASHBOARD_SAMPLES, SEARCH_SAMPLES, EVENT_SAMPLES, createInitialTeams } from "@/constants/fixtures";
import { canonicalGame, gameForArtwork, gameImage, gameLabel, getGame, resolveGameArtwork } from "@/lib/games";
import { buildCatalog, normalizeTournament, resolveTournamentImage } from "@/lib/tournaments";
import { normalizeTeams, validateTeam } from "@/lib/teams";
import { TourneyProvider } from "@/context/TourneyContext";
import { AppRoutes } from "@/App";
import { STORE_KEY } from "@/lib/tourney-store";

describe("Danh mục chín game theo assets mới", () => {
  it("mỗi game dùng đúng một file riêng, khớp toàn bộ chín ảnh trong thư mục game", () => {
    const files = readdirSync(resolve(process.cwd(), "assets/game")).filter((name) => name.endsWith(".png"));
    expect(SUPPORTED_GAMES).toHaveLength(9);
    expect(SUPPORTED_GAMES.map((game) => game.slug + ".png").sort()).toEqual(files.sort());
    expect(new Set(SUPPORTED_GAMES.map((game) => game.image)).size).toBe(9);
    for (const game of SUPPORTED_GAMES) expect(game.image).toContain(game.slug);
  });
  it("chuẩn hóa tên từ API, tên file, tên Việt và viết tắt mà không lẫn LoL với Tốc Chiến", () => {
    expect(canonicalGame({ name: "COUNTER STRIKE 2" })).toBe("CS2");
    expect(canonicalGame("lienquanmobile")).toBe("Liên Quân Mobile");
    expect(canonicalGame("PUBG")).toBe("PUBG Mobile");
    expect(canonicalGame("toc chien")).toBe("League of Legends: Wild Rift");
    expect(gameImage("Wild Rift")).not.toBe(gameImage("League of Legends"));
    expect(gameLabel("TFT")).toBe("Đấu Trường Chân Lý");
  });
  it("metadata game sửa được ảnh số đã gán nhầm trong cache cũ", () => {
    const pubg = normalizeTournament({ id: 1, name: "Cup", game: "PUBG", gameDisplay: "Liên Minh Huyền Thoại", image: "/images/game1.png" });
    expect(pubg).toMatchObject({ game: "PUBG Mobile", gameDisplay: "PUBG Mobile", image: gameImage("PUBG Mobile") });
    expect(resolveTournamentImage("/assets/game3-oldHash123.png", "Valorant")).toBe(gameImage("Valorant"));
    expect(resolveTournamentImage(gameImage("CS2"), "Free Fire")).toBe(gameImage("Free Fire"));
  });
  it("giữ danh tính ảnh số cũ khi thiếu metadata; ảnh game6 không bị đổi thành PUBG Mobile", () => {
    expect(gameForArtwork("/images/game4.png").id).toBe("CS2");
    expect(resolveGameArtwork("/assets/game3-oldHash123.png")).toBe(gameImage("Teamfight Tactics"));
    expect(gameForArtwork("/images/game6.png")).toBeNull();
    expect(resolveTournamentImage("/images/game6.png")).not.toBe(gameImage("PUBG Mobile"));
  });
  it("giữ ảnh upload/banner tùy chỉnh và không đổi game đã bỏ thành game khác", () => {
    for (const src of ["data:image/png;base64,YWJj", "https://example.com/valorant.png", "/uploads/banner.png"]) expect(resolveTournamentImage(src, "CS2")).toBe(src);
    const old = normalizeTournament({ id: 9, name: "Giải cũ", game: "Dota 2", image: "/images/game2.png" });
    expect(old.game).toBe("Dota 2"); expect(getGame(old.game)).toBeNull();
    expect(old.image).not.toBe(gameImage("Valorant"));
    expect(buildCatalog([old], [], null)).toEqual([]);
    expect(() => validateTeam({ name: "Team", game: "Dota 2" })).toThrow("9 tựa game");
    expect(normalizeTeams([{ id: 1, name: "Team", game: "PUBG" }])[0].game).toBe("PUBG Mobile");
  });
  it("toàn bộ giải và đội mẫu dùng danh mục mới với ảnh trùng metadata", () => {
    expect(new Set(DASHBOARD_SAMPLES.map((entry) => entry.game)).size).toBe(9);
    for (const entry of [...DASHBOARD_SAMPLES, ...SEARCH_SAMPLES, ...EVENT_SAMPLES]) {
      expect(getGame(entry.game)).not.toBeNull();
      expect(entry.image).toBe(gameImage(entry.game));
      expect(entry.gameDisplay).toContain(gameLabel(entry.game));
    }
    for (const team of createInitialTeams("Captain")) expect(getGame(team.game)).not.toBeNull();
  });
});

const ENTRY = { id: "tourney_catalog", name: "Catalog Cup", source: "local", ownerId: 7, gameInfo: { game: "Dota 2", format: "SINGLE_ELIMINATION" } };
function open(path, extra = {}) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, profile: { id: 7, tagName: "Captain" }, tournaments: [ENTRY], activeTournamentId: ENTRY.id, teams: [], ...extra }));
  return render(<MemoryRouter initialEntries={[path]}><TourneyProvider><AppRoutes /></TourneyProvider></MemoryRouter>);
}
function expectNine(select) {
  const options = within(select).getAllByRole("option").filter((option) => option.value);
  expect(options.map((option) => option.value)).toEqual(SUPPORTED_GAMES.map((game) => game.id));
  expect(options.map((option) => option.textContent)).toEqual(SUPPORTED_GAMES.map((game) => game.name));
}
describe("Các form dùng cùng chín lựa chọn", () => {
  it.each(["/community"])("bộ lọc %s thống nhất cả giá trị và nhãn", async (path) => {
    open(path); const select = await screen.findByRole("combobox", { name: "Lọc tựa game" }, { timeout: 5000 }); expectNine(select);
  });
  it("form bộ môn giữ dữ liệu cũ nhưng chỉ cho chọn từ chín game hiện tại", async () => {
    open("/tournament/game-info"); const select = await screen.findByLabelText(/Tựa game/, {}, { timeout: 5000 }); expectNine(select);
    expect(select).toHaveValue(""); expect(screen.getByText(/Bộ môn cũ: Dota 2/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeDisabled();
    expect(JSON.parse(localStorage.getItem(STORE_KEY)).tournaments[0].gameInfo.game).toBe("Dota 2");
  });
  it("form tạo đội dùng đủ chín game kể cả PUBG Mobile, Free Fire, Liên Quân và Tốc Chiến", async () => {
    open("/community", { profile: { id: 7, tagName: "Captain" }, teams: [
      { id: 1, name: "Legacy Team", game: "Dota 2", captain: "Captain", captainKey: "id:7", members: ["Captain"], pendingRequests: [] },
      { id: 2, name: "Mobile Team", game: "PUBG", captain: "Captain", captainKey: "id:7", members: ["Captain"], pendingRequests: [] },
    ] });
    await screen.findByRole("heading", { level: 1, name: "Cộng đồng & Đội tuyển" }, { timeout: 5000 });
    expect(within(screen.getByRole("region", { name: "Đội tuyển của tôi" })).getByRole("article", { name: "Legacy Team" })).toHaveTextContent("Bộ môn cũ");
    const discovery = screen.getByRole("region", { name: "Khám phá Đội tuyển Cộng đồng" });
    expect(within(discovery).queryByRole("article", { name: "Legacy Team" })).not.toBeInTheDocument();
    expect(within(discovery).getByRole("article", { name: "Mobile Team" })).toHaveTextContent("PUBG Mobile");
    await userEvent.click(screen.getByRole("button", { name: "Tạo Team mới" }));
    expectNine(within(screen.getByRole("dialog")).getByLabelText(/Tựa Game Thi Đấu Chính/));
  });
});
