import { useState } from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ImageUploadField from "@/components/shared/ImageUploadField";
import VenueLocationPicker from "@/components/shared/VenueLocationPicker";
import MarkdownEditorBox from "@/components/shared/MarkdownEditorBox";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
import { readImageFile } from "@/lib/images";
import { geocoder } from "@/lib/geocoder";

afterEach(() => { delete navigator.geolocation; });
function decodeImage(width = 280, height = 280, broken = false) {
  vi.stubGlobal("Image", class {
    naturalWidth = width; naturalHeight = height;
    set src(value) { queueMicrotask(() => broken ? this.onerror?.() : this.onload?.()); }
  });
}
function ImageProbe() {
  const [value, setValue] = useState("");
  return <ImageUploadField label="Ảnh đại diện giải đấu" value={value} onChange={setValue} />;
}
function VenueProbe() {
  const [value, setValue] = useState({ address: "", lat: null, lon: null });
  return <><VenueLocationPicker value={value} onChange={setValue} /><span data-testid="venue">{JSON.stringify(value)}</span></>;
}

describe("ImageUploadField", () => {
  it("4MB được chấp nhận; vượt 4MB, sai MIME hoặc lỗi giải mã bị từ chối", async () => {
    decodeImage();
    const valid = new File(["image"], "valid.png", { type: "image/png" });
    Object.defineProperty(valid, "size", { value: 4 * 1024 * 1024 });
    expect(await readImageFile(valid)).toMatchObject({ width: 280, height: 280 });
    const large = new File(["image"], "large.png", { type: "image/png" });
    Object.defineProperty(large, "size", { value: 4 * 1024 * 1024 + 1 });
    await expect(readImageFile(large)).rejects.toThrow("4MB");
    await expect(readImageFile(new File(["x"], "test.svg", { type: "image/svg+xml" }))).rejects.toThrow("PNG");
    decodeImage(280, 280, true);
    await expect(readImageFile(valid)).rejects.toThrow("ảnh hợp lệ");
  });
  it("cảnh báo kích thước không chặn xem trước/xóa và có thể chọn lại cùng file", async () => {
    decodeImage(100, 100);
    render(<ImageProbe />);
    const user = userEvent.setup();
    const file = new File(["image"], "small.png", { type: "image/png" });
    const input = screen.getByLabelText("Tải ảnh đại diện giải đấu");
    await user.upload(input, file);
    expect(await screen.findByAltText("Xem trước ảnh đại diện giải đấu")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("100x100");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Xóa ảnh" }));
    expect(screen.queryByAltText("Xem trước ảnh đại diện giải đấu")).not.toBeInTheDocument();
    await user.upload(input, file);
    expect(await screen.findByAltText("Xem trước ảnh đại diện giải đấu")).toBeInTheDocument();
  });
});

describe("Markdown", () => {
  it("hiển thị GFM, bảng và liên kết an toàn; không thực thi HTML hoặc javascript URL", () => {
    const content = "# Điều lệ\n\n**Bắt buộc** và *nghiêng*\n\n- Có mặt đúng giờ\n\n| Đội | Điểm |\n|---|---|\n| A | 2 |\n\n[Trang chủ](https://example.com) [Xấu](javascript:alert(1))\n\n<script>window.hacked=true</script>\n<img src=x onerror=alert(1)>";
    const { container } = render(<MarkdownRenderer value={content} />);
    expect(screen.getByRole("heading", { name: "Điều lệ" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toHaveTextContent("Điểm");
    expect(screen.getByRole("link", { name: "Trang chủ" })).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("Xấu").closest("a")?.getAttribute("href") || "").not.toMatch(/^javascript:/i);
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img[onerror]")).toBeNull();
  });
  it("chuyển sửa/xem trước không mất nội dung, có hướng dẫn cú pháp", async () => {
    function Probe() { const [value, setValue] = useState("## Nội quy"); return <MarkdownEditorBox value={value} onChange={setValue} />; }
    render(<Probe />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Xem trước Markdown" }));
    expect(await screen.findByRole("heading", { name: "Nội quy" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Chỉnh sửa Markdown" }));
    expect(screen.getByRole("textbox")).toHaveValue("## Nội quy");
    await user.click(screen.getByRole("button", { name: "Hướng dẫn định dạng" }));
    expect(within(screen.getByRole("region", { name: "Hướng dẫn định dạng Markdown" })).getByRole("table")).toHaveTextContent("In đậm / In nghiêng");
    await user.click(screen.getByRole("button", { name: "Đóng hướng dẫn" }));
    expect(screen.queryByRole("region", { name: "Hướng dẫn định dạng Markdown" })).not.toBeInTheDocument();
  });
});

describe("VenueLocationPicker", () => {
  it("gõ/focus chỉ gợi ý cục bộ, chọn bằng bàn phím và không gọi Nominatim", async () => {
    const search = vi.spyOn(geocoder, "search");
    render(<VenueProbe />);
    const user = userEvent.setup();
    const input = screen.getByRole("combobox", { name: "Địa điểm thi đấu" });
    await user.type(input, "Cầu Giấy");
    expect(screen.getByRole("option", { name: /Nhà thi đấu Cầu Giấy/ })).toBeInTheDocument();
    expect(search).not.toHaveBeenCalled();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(input.value).toContain("Nhà thi đấu Cầu Giấy");
    expect(screen.getByTestId("venue")).toHaveTextContent('"lat":21.0368');
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(search).not.toHaveBeenCalled();
  });
  it("tìm theo nút, chọn kết quả và giữ nhãn chứa ký tự HTML như văn bản", async () => {
    vi.spyOn(geocoder, "search").mockResolvedValue([{ main: "<img onerror=x>", sub: "Địa chỉ", address: "Kết quả, Địa chỉ", lat: 10, lon: 106 }]);
    const { container } = render(<VenueProbe />);
    const user = userEvent.setup();
    await user.type(screen.getByRole("combobox"), "New stadium");
    await user.click(screen.getByRole("button", { name: "Tìm địa điểm" }));
    const option = await screen.findByRole("option", { name: /<img onerror=x>/ });
    expect(container.querySelector("img[onerror]")).toBeNull();
    await user.click(option);
    expect(screen.getByRole("combobox")).toHaveValue("Kết quả, Địa chỉ");
    expect(screen.getByTestId("venue")).toHaveTextContent('"lat":10');
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
  it("bỏ phản hồi cũ nếu người dùng đã gõ địa chỉ khác", async () => {
    let finish;
    vi.spyOn(geocoder, "search").mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    render(<VenueProbe />);
    const user = userEvent.setup();
    const input = screen.getByRole("combobox");
    await user.type(input, "Old stadium");
    await user.click(screen.getByRole("button", { name: "Tìm địa điểm" }));
    await user.clear(input); await user.type(input, "New stadium");
    await act(async () => { finish([{ main: "OLD RESULT", sub: "", address: "Old", lat: 1, lon: 2 }]); });
    expect(input).toHaveValue("New stadium");
    expect(screen.queryByText("OLD RESULT")).not.toBeInTheDocument();
  });
  it("dịch vụ lỗi vẫn cho nhập địa chỉ thủ công", async () => {
    vi.spyOn(geocoder, "search").mockRejectedValue(new Error("Offline"));
    render(<VenueProbe />);
    const user = userEvent.setup();
    await user.type(screen.getByRole("combobox"), "Manual address");
    await user.click(screen.getByRole("button", { name: "Tìm địa điểm" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("vẫn có thể nhập địa chỉ trực tiếp");
    expect(screen.getByRole("combobox")).toHaveValue("Manual address");
  });
  it("GPS bị từ chối hiện lỗi và mở lại nút", async () => {
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition: (success, failure) => failure({ code: 1 }) } });
    render(<VenueProbe />);
    await userEvent.click(screen.getByRole("button", { name: "Định vị", exact: true }));
    expect(screen.getByRole("alert")).toHaveTextContent("cấp quyền định vị");
    expect(screen.getByRole("button", { name: "Định vị", exact: true })).toBeEnabled();
  });
  it("GPS 0/0 vẫn hiển thị map; reverse lỗi dùng tọa độ dự phòng", async () => {
    vi.spyOn(geocoder, "reverse").mockRejectedValue(new Error("Offline"));
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition: (success) => success({ coords: { latitude: 0, longitude: 0 } }) } });
    render(<VenueProbe />);
    await userEvent.click(screen.getByRole("button", { name: "Định vị", exact: true }));
    await waitFor(() => expect(screen.getByRole("combobox")).toHaveValue("0.000000, 0.000000"));
    expect(screen.getByTestId("venue")).toHaveTextContent('"lat":0,"lon":0');
    const map = await screen.findByTitle("Bản đồ địa điểm thi đấu");
    expect(new URL(map.src).searchParams.get("q")).toBe("0,0");
  });
});
