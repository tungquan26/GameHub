import { DATE_FILTERS, EMPTY_FILTERS, STATUS_FILTERS } from "./tournaments";
import { getGame } from "./games";

const KEYS = ["q", "game", "status", "range", "from", "to", "page"];
const unique = (items) => [...new Set(items)];
const allowed = (values, options) => unique(values.filter((value) => options.some((option) => option.value === value)));
function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return "";
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : "";
}

export function readTournamentSearch(params) {
  const from = validDate(params.get("from")); const to = validDate(params.get("to"));
  const dateRanges = allowed(params.getAll("range"), DATE_FILTERS);
  if ((from || to) && !dateRanges.includes("custom")) dateRanges.push("custom");
  const rawPage = params.get("page");
  const page = /^[1-9]\d*$/.test(rawPage || "") && Number.isSafeInteger(Number(rawPage)) ? Number(rawPage) : 1;
  return { keyword: params.get("q") || "", page, filters: {
    games: unique(params.getAll("game").map((value) => getGame(value)?.id).filter(Boolean)),
    statuses: allowed(params.getAll("status"), STATUS_FILTERS), dateRanges, from, to,
  } };
}

export function writeTournamentSearch({ keyword = "", filters = EMPTY_FILTERS, page = 1 }, previous = new URLSearchParams()) {
  const params = new URLSearchParams(previous);
  KEYS.forEach((key) => params.delete(key));
  if (keyword) params.set("q", keyword);
  unique(filters.games.map((value) => getGame(value)?.slug).filter(Boolean)).forEach((game) => params.append("game", game));
  allowed(filters.statuses, STATUS_FILTERS).forEach((status) => params.append("status", status));
  const ranges = allowed(filters.dateRanges, DATE_FILTERS);
  ranges.forEach((range) => params.append("range", range));
  if (ranges.includes("custom")) {
    if (validDate(filters.from)) params.set("from", filters.from);
    if (validDate(filters.to)) params.set("to", filters.to);
  }
  if (Number.isSafeInteger(page) && page > 1) params.set("page", String(page));
  return params;
}

export function discoveryPath({ game, status } = {}) {
  return { pathname: "/search", search: writeTournamentSearch({ filters: { ...EMPTY_FILTERS, games: game ? [game] : [], statuses: status ? [status] : [] } }).toString() };
}
