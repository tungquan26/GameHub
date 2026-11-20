import { GAME_ARTWORK } from "@/constants/games";
import logo from "@/assets/logo.png";

const fold = (value) => String(value || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]/g, "");
const rawGame = (value) => typeof value === "object" && value ? String(value.name || "") : String(value || "").split("·")[0].trim();
export function getGame(value) {
  const key = fold(rawGame(value));
  return key ? GAME_ARTWORK.find((game) => [game.id, game.name, game.slug, ...(game.aliases || [])].some((alias) => fold(alias) === key)) || null : null;
}
export function catalogGame(games, value) {
  if (!value) return null;
  const artwork = getGame(value);
  return games.find((game) => game.name === value)
    || (artwork && games.find((game) => getGame(game.name) === artwork))
    || null;
}
export function gameCarouselItem(game) {
  const artwork = getGame(game.name);
  return { id: game.gameId, name: artwork?.name || game.name, image: artwork?.image || logo, slug: artwork?.slug || String(game.gameId) };
}
export function canonicalGame(value) { return getGame(value)?.id || rawGame(value); }
export function gameLabel(value) { return getGame(value)?.name || rawGame(value); }
export function gameImage(value) { return getGame(value)?.image || null; }
export function gameDisplay(value, formatLabel = "") {
  const suffix = typeof value === "string" ? value.split("·").slice(1).map((part) => part.trim()).filter(Boolean).join(" · ") : "";
  return [gameLabel(value), suffix || formatLabel].filter(Boolean).join(" · ");
}
// Các số cũ là danh tính game cũ, không phải vị trí trong danh mục hiện tại.
const LEGACY_GAMES = { 1: "Liên Minh Huyền Thoại", 2: "Valorant", 3: "Teamfight Tactics", 4: "CS2", 5: "Delta Force" };
export function gameForArtwork(value) {
  const source = String(value || "").split(/[?#]/)[0];
  const direct = GAME_ARTWORK.find((game) => game.image.split(/[?#]/)[0] === source);
  if (direct) return direct;
  if (!/^\/(?:images|assets)\//.test(source)) return null;
  const legacy = source.match(/\/(?:game([1-6]))(?:-[\w-]+)?\.png$/i);
  if (legacy) return getGame(LEGACY_GAMES[legacy[1]]);
  return GAME_ARTWORK.find((game) => new RegExp(`/${game.slug}(?:-[\\w-]+)?\\.(?:png|webp|jpe?g)$`, "i").test(source)) || null;
}
export function isManagedGameArtwork(value) {
  return Boolean(gameForArtwork(value)) || /^\/(?:images|assets)\/game[1-6](?:-[\w-]+)?\.png(?:[?#].*)?$/i.test(String(value || ""));
}
export function resolveGameArtwork(value, game) {
  if (!isManagedGameArtwork(value)) return value;
  // Khi có metadata bộ môn, metadata quyết định ảnh; không dùng nhầm ảnh cũ đã gán sai.
  return (rawGame(game) ? gameImage(game) : gameForArtwork(value)?.image) || "";
}
