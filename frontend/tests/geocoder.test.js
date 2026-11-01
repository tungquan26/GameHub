import { afterEach, describe, expect, it, vi } from "vitest";
import { createGeocoder, hasCoordinates } from "@/lib/geocoder";

const json = (value) => new Response(JSON.stringify(value), { headers: { "Content-Type": "application/json" } });
const place = { display_name: "Nhà thi đấu, Hà Nội", name: "Nhà thi đấu", lat: "21.03", lon: "105.79" };
const base = () => "https://geocoder.example.test";
afterEach(() => vi.useRealTimers());

describe("Nominatim service", () => {
  it("mã hóa truy vấn, cache kết quả và nhận đổi endpoint runtime", async () => {
    let endpoint = base();
    const fetchImpl = vi.fn().mockImplementation(async () => json([place]));
    const service = createGeocoder({ fetchImpl, getBaseUrl: () => endpoint, minInterval: 0 });
    expect(await service.search(" Hà Nội ")).toEqual([{ main: "Nhà thi đấu", sub: "Hà Nội", address: place.display_name, lat: 21.03, lon: 105.79 }]);
    await service.search("Hà Nội");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(new URL(fetchImpl.mock.calls[0][0]).searchParams.get("q")).toBe("Hà Nội");
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({ credentials: "omit", referrerPolicy: "strict-origin-when-cross-origin" });
    endpoint = "https://other.example.test";
    await service.search("Hà Nội");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
  it("giới hạn tần suất mặc định ít nhất 1 giây, nối tiếp các yêu cầu", async () => {
    vi.useFakeTimers();
    const starts = [];
    const fetchImpl = vi.fn().mockImplementation(async () => { starts.push(Date.now()); return json([]); });
    const service = createGeocoder({ fetchImpl, getBaseUrl: base });
    await service.search("Hanoi");
    const second = service.search("Saigon");
    await vi.advanceTimersByTimeAsync(1099);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await second;
    expect(starts[1] - starts[0]).toBeGreaterThanOrEqual(1000);
  });
  it("yêu cầu đã hủy trong hàng đợi không tạo request", async () => {
    let finish;
    const fetchImpl = vi.fn().mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const service = createGeocoder({ fetchImpl, getBaseUrl: base, minInterval: 0 });
    const first = service.search("Hanoi");
    await Promise.resolve();
    const controller = new AbortController();
    const second = service.search("Saigon", controller.signal);
    const assertion = expect(second).rejects.toMatchObject({ name: "AbortError" });
    controller.abort(); finish(json([]));
    await first; await assertion;
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it("không cache HTTP lỗi hoặc phản hồi sai cấu trúc", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response("Unavailable", { status: 503 }))
      .mockImplementationOnce(async () => json({ error: "Malformed" })).mockImplementation(async () => json([place]));
    const service = createGeocoder({ fetchImpl, getBaseUrl: base, minInterval: 0 });
    await expect(service.search("Hanoi")).rejects.toThrow();
    await expect(service.search("Hanoi")).rejects.toThrow();
    expect(await service.search("Hanoi")).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });
  it("tọa độ 0 là hợp lệ, tọa độ ngoài miền bị từ chối", async () => {
    expect(hasCoordinates(0, 0)).toBe(true);
    expect(hasCoordinates("", 0)).toBe(false);
    expect(hasCoordinates(91, 0)).toBe(false);
    const fetchImpl = vi.fn().mockImplementation(async () => json({ display_name: "Equator", lat: "0", lon: "0" }));
    const service = createGeocoder({ fetchImpl, getBaseUrl: base, minInterval: 0 });
    expect(await service.reverse(0, 0)).toMatchObject({ address: "Equator", lat: 0, lon: 0 });
    await expect(service.reverse(91, 0)).rejects.toThrow("Tọa độ");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it("chuỗi quá ngắn không gọi dịch vụ", async () => {
    const fetchImpl = vi.fn();
    const service = createGeocoder({ fetchImpl, getBaseUrl: base, minInterval: 0 });
    expect(await service.search("a")).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
