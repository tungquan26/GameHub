export function hasCoordinates(lat, lon) {
  return lat !== null && lon !== null && lat !== undefined && lon !== undefined && String(lat).trim() !== "" && String(lon).trim() !== ""
    && Number.isFinite(Number(lat)) && Number.isFinite(Number(lon)) && Math.abs(Number(lat)) <= 90 && Math.abs(Number(lon)) <= 180;
}
function abortError() { return new DOMException("Đã hủy tìm địa điểm.", "AbortError"); }
function delay(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(abortError()); return; }
    const timer = setTimeout(() => { signal?.removeEventListener("abort", abort); resolve(); }, milliseconds);
    const abort = () => { clearTimeout(timer); reject(abortError()); };
    signal?.addEventListener("abort", abort, { once: true });
  });
}
export function normalizePlace(place) {
  const address = typeof place?.display_name === "string" ? place.display_name : "";
  const parts = address.split(",").map((part) => part.trim());
  return { main: typeof place?.name === "string" && place.name ? place.name : parts[0] || "",
    sub: parts.slice(1).join(", "), address,
    lat: hasCoordinates(place?.lat, place?.lon) ? Number(place.lat) : null,
    lon: hasCoordinates(place?.lat, place?.lon) ? Number(place.lon) : null };
}
export function createGeocoder({
  fetchImpl = (...args) => fetch(...args),
  getBaseUrl = () => window.BTP_CONFIG?.geocoderBaseUrl || "https://nominatim.openstreetmap.org",
  minInterval = 1100,
} = {}) {
  const cache = new Map();
  let queue = Promise.resolve();
  let nextStart = 0;
  function request(endpoint, params, signal) {
    const base = getBaseUrl().replace(/\/$/, "");
    const url = new URL(base + "/" + endpoint, window.location.origin);
    for (const [key, value] of Object.entries({ format: "jsonv2", "accept-language": "vi", ...params })) url.searchParams.set(key, String(value));
    const key = url.toString();
    const task = async () => {
      if (signal?.aborted) throw abortError();
      const cached = cache.get(key);
      if (cached && Date.now() - cached.at < 3600000) return cached.data;
      const wait = nextStart - Date.now();
      if (wait > 0) await delay(wait, signal);
      if (signal?.aborted) throw abortError();
      nextStart = Date.now() + minInterval;
      const response = await fetchImpl(key, { signal, headers: { Accept: "application/json" }, credentials: "omit", referrerPolicy: "strict-origin-when-cross-origin" });
      if (!response.ok) throw new Error("Không thể tìm địa điểm. Bạn vẫn có thể nhập địa chỉ trực tiếp.");
      const data = await response.json();
      if (endpoint === "search" ? !Array.isArray(data) : !data || typeof data.display_name !== "string") throw new Error("Không thể đọc kết quả tìm địa điểm.");
      cache.set(key, { at: Date.now(), data });
      if (cache.size > 100) cache.delete(cache.keys().next().value);
      return data;
    };
    const result = queue.then(task, task);
    queue = result.catch(() => {});
    return result;
  }
  return {
    async search(query, signal) {
      if (query.trim().length < 2) return [];
      const data = await request("search", { q: query.trim(), addressdetails: 1, limit: 6 }, signal);
      if (!Array.isArray(data)) throw new Error("Không thể đọc kết quả tìm địa điểm.");
      return data.map(normalizePlace).filter((place) => place.address).slice(0, 6);
    },
    async reverse(lat, lon, signal) {
      if (!hasCoordinates(lat, lon)) throw new Error("Tọa độ vị trí không hợp lệ.");
      const data = await request("reverse", { lat, lon }, signal);
      if (!data || typeof data.display_name !== "string") throw new Error("Không tìm thấy địa chỉ của vị trí này.");
      return normalizePlace(data);
    },
  };
}
export const geocoder = createGeocoder();
