import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SettingsCard from "@/components/shared/SettingsCard";

describe("SettingsCard", () => {
  it("khóa cả nút và submit bằng bàn phím khi chưa thay đổi", () => {
    const onSave = vi.fn();
    const { container, rerender } = render(<SettingsCard title="Chi tiết giải đấu" onSave={onSave}>Nội dung</SettingsCard>);
    expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeDisabled();
    fireEvent.submit(container.querySelector("form"));
    expect(onSave).not.toHaveBeenCalled();
    rerender(<SettingsCard title="Chi tiết giải đấu" onSave={onSave} isDirty>Nội dung</SettingsCard>);
    expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeEnabled();
  });

  it("chống gửi lặp trong lúc lưu bất đồng bộ", async () => {
    let finish;
    const onSave = vi.fn(() => new Promise((resolve) => { finish = resolve; }));
    const { container } = render(<SettingsCard title="Điều lệ" onSave={onSave} isDirty />);
    await userEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(screen.getByRole("button", { name: "Đang lưu…" })).toBeDisabled();
    fireEvent.submit(container.querySelector("form"));
    expect(onSave).toHaveBeenCalledTimes(1);
    await act(async () => { finish(); });
    expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeEnabled();
  });

  it("hiển thị lỗi lưu và cho phép thử lại", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("Không thể kết nối máy chủ."));
    render(<SettingsCard title="Hình ảnh" onSave={onSave} isDirty />);
    await userEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Không thể kết nối máy chủ.");
    expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeEnabled();
  });

  it("tôn trọng trạng thái đang lưu từ trang cha", () => {
    render(<SettingsCard title="Đăng ký" onSave={vi.fn()} isDirty isSaving />);
    expect(screen.getByRole("button", { name: "Đang lưu…" })).toBeDisabled();
  });
});
