import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LandingPage from "@/pages/dashboard/LandingPage";
import { HERO_SLIDES } from "@/constants/hero-slides";
import { TourneyProvider } from "@/context/TourneyContext";
import PlatformLayout from "@/components/layouts/PlatformLayout";

function openLanding() {
  return render(<MemoryRouter><TourneyProvider><PlatformLayout><LandingPage /></PlatformLayout></TourneyProvider></MemoryRouter>);
}

afterEach(() => vi.useRealTimers());
beforeEach(() => vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response("[]", { headers: { "Content-Type": "application/json" } }))));

describe("Landing", () => {
  it("tự chuyển đủ 8 ảnh hero mỗi 5 giây rồi nối vòng, không có điều khiển thủ công", async () => {
    vi.useFakeTimers();
    openLanding();
    await act(async () => {});
    const hero = screen.getByRole("region", { name: "Giới thiệu Tourney Pro" });
    expect(hero.querySelector("button")).toBeNull();
    expect(screen.queryByLabelText("Điều khiển ảnh giới thiệu")).not.toBeInTheDocument();
    expect(hero).not.toHaveTextContent(/\d{2} \/ 08/);
    for (let index = 0; index < HERO_SLIDES.length; index++) {
      await act(async () => { hero.querySelectorAll("img").forEach((image) => fireEvent.load(image)); });
      expect(screen.getByRole("img", { name: HERO_SLIDES[index].alt })).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(4999));
      expect(screen.getByRole("img", { name: HERO_SLIDES[index].alt })).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(1));
      expect(screen.getByRole("img", { name: HERO_SLIDES[(index + 1) % HERO_SLIDES.length].alt })).toBeInTheDocument();
    }
  });
  it("carousel có đúng 8 game chọn được và bàn phím cuộn vòng; footer cuộn lên đầu", () => {
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    openLanding();
    expect(screen.getAllByRole("button", { name: /^Chọn / })).toHaveLength(8);
    const carousel = screen.getByRole("region", { name: "Carousel 8 trò chơi" });
    fireEvent.keyDown(carousel, { key: "ArrowDown" });
    expect(screen.getByRole("button", { name: "Chọn Đấu Trường Chân Lý" })).toHaveFocus();
    for (let index = 0; index < 5; index++) fireEvent.keyDown(carousel, { key: "ArrowDown" });
    expect(screen.getByRole("button", { name: "Chọn Liên Minh Huyền Thoại: Tốc Chiến" })).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Trò chơi tiếp theo" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Trò chơi trước" })).not.toBeInTheDocument();
    fireEvent.keyDown(carousel, { key: "ArrowDown" });
    expect(screen.getByRole("button", { name: "Chọn Liên Minh Huyền Thoại" })).toHaveFocus();
    fireEvent.keyDown(carousel, { key: "ArrowUp" });
    expect(screen.getByRole("button", { name: "Chọn Liên Minh Huyền Thoại: Tốc Chiến" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "TỚI ĐẦU TRANG" }));
    expect(scroll).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
  it("tôn trọng chế độ giảm chuyển động", async () => {
    vi.useFakeTimers();
    vi.spyOn(window, "matchMedia").mockImplementation((media) => ({
      matches: media.includes("prefers-reduced-motion"), media, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    }));
    openLanding();
    await act(async () => {});
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByRole("img", { name: HERO_SLIDES[0].alt })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: HERO_SLIDES[1].alt })).not.toBeInTheDocument();
  });
});
