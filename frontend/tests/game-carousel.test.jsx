import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GameCarousel from "@/components/shared/GameCarousel";
import { LANDING_GAMES } from "@/constants/games";

let frames;
let frameId;
let viewport;
const STRIDE = 220;
const LOOP = LANDING_GAMES.length * STRIDE;

function advance(ms) {
  act(() => {
    vi.advanceTimersByTime(ms);
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach((callback) => callback(performance.now()));
  });
}
function open() {
  const view = render(<MemoryRouter><GameCarousel /></MemoryRouter>);
  return { ...view, carousel: screen.getByRole("region", { name: "Carousel 9 trò chơi" }) };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  frames = new Map(); frameId = 0; viewport = 1440;
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback) => { frames.set(++frameId, callback); return frameId; }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn((id) => frames.delete(id)));
  vi.stubGlobal("PointerEvent", class extends MouseEvent {
    constructor(type, options) { super(type, options); this.pointerType = options.pointerType; this.pointerId = options.pointerId; }
  });
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function () { return this.classList.contains("game-carousel") ? viewport : 0; });
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(function () { return this.classList.contains("game-carousel-card") ? 200 : 0; });
  vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockImplementation(function () {
    return this.classList.contains("game-carousel-card") ? [...this.parentElement.children].indexOf(this) * STRIDE : 0;
  });
});
afterEach(() => vi.useRealTimers());

describe("Carousel poster chuyển lần lượt", () => {
  it("chỉ có poster, không nút điều hướng; bản sao không có trong thứ tự Tab", () => {
    const { carousel } = open();
    expect(within(carousel).getAllByRole("link")).toHaveLength(9);
    expect(carousel.children).toHaveLength(27);
    expect(carousel.textContent).toBe("");
    for (const clone of carousel.querySelectorAll('[aria-hidden="true"]')) expect(clone.tabIndex).toBe(-1);
    for (const game of LANDING_GAMES) {
      expect(within(carousel).getByRole("link", { name: `Khám phá giải đấu ${game.name}` })).toHaveAttribute("href", `/search?game=${game.slug}`);
    }
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("đứng yên 3 giây, trượt một game trong 450ms rồi chờ lại đủ 3 giây", () => {
    const { carousel } = open();
    const start = carousel.scrollLeft;
    expect(frames.size).toBe(0);
    advance(2999);
    expect(carousel.scrollLeft).toBe(start);
    expect(frames.size).toBe(0);
    advance(1);
    expect(carousel.scrollLeft).toBe(start);
    advance(225);
    expect(carousel.scrollLeft).toBeGreaterThan(start);
    expect(carousel.scrollLeft).toBeLessThan(start + STRIDE);
    advance(225);
    expect(carousel.scrollLeft).toBe(start + STRIDE);
    expect(frames.size).toBe(0);
    advance(2999);
    expect(carousel.scrollLeft).toBe(start + STRIDE);
    advance(1); advance(450);
    expect(carousel.scrollLeft).toBe(start + STRIDE * 2);
  });

  it("hover cả tiêu đề lẫn poster không dừng hoặc đặt lại thời gian chuyển", () => {
    const { carousel } = open();
    const start = carousel.scrollLeft;
    advance(2000);
    fireEvent.mouseEnter(carousel.closest("section"));
    fireEvent.mouseEnter(carousel);
    advance(1000); advance(450);
    expect(carousel.scrollLeft).toBe(start + STRIDE);
    fireEvent.mouseLeave(carousel); fireEvent.mouseLeave(carousel.closest("section"));
    advance(3000); advance(450);
    expect(carousel.scrollLeft).toBe(start + STRIDE * 2);
  });

  it("tự chuyển qua game cuối nối tiếp game đầu", () => {
    const { carousel } = open();
    const start = carousel.scrollLeft;
    for (let step = 0; step < 8; step++) { advance(3000); advance(450); }
    expect(carousel.children[9]).toHaveClass("is-active");
    expect(carousel.scrollLeft).toBe(start - STRIDE);
    advance(3000); advance(450);
    expect(carousel.children[10]).toHaveClass("is-active");
    expect(carousel.scrollLeft).toBe(start);
  });

  it("chuẩn hóa vị trí ở cả hai đầu bằng đúng một lượt", () => {
    const { carousel } = open();
    const start = carousel.scrollLeft;
    carousel.scrollLeft = start + LOOP; fireEvent.scroll(carousel);
    expect(carousel.scrollLeft).toBe(start);
    carousel.scrollLeft = start - LOOP; fireEvent.scroll(carousel);
    expect(carousel.scrollLeft).toBe(start);
  });

  it("bàn phím đi qua game cuối/đầu và focus vẫn mở được đúng game", () => {
    const { carousel } = open();
    for (let step = 0; step < 8; step++) fireEvent.keyDown(carousel, { key: "ArrowRight" });
    expect(within(carousel).getByRole("link", { name: `Khám phá giải đấu ${LANDING_GAMES[0].name}` })).toHaveFocus();
    advance(450);
    fireEvent.keyDown(carousel, { key: "ArrowLeft" });
    expect(within(carousel).getByRole("link", { name: `Khám phá giải đấu ${LANDING_GAMES[8].name}` })).toHaveFocus();
    advance(450);
    expect(carousel.children[17]).toHaveClass("is-active");
  });

  it("focus bàn phím tạm dừng; blur bắt đầu lại thời gian chờ 3 giây", () => {
    const { carousel } = open();
    const start = carousel.scrollLeft;
    advance(2000);
    act(() => carousel.focus());
    advance(10000);
    expect(carousel.scrollLeft).toBe(start);
    act(() => carousel.blur());
    advance(2999);
    expect(carousel.scrollLeft).toBe(start);
    advance(1); advance(450);
    expect(carousel.scrollLeft).toBe(start + STRIDE);
  });

  it("kéo xong căn game gần nhất và chờ đủ 3 giây trước khi tự chuyển", () => {
    const { carousel } = open();
    const start = carousel.scrollLeft;
    fireEvent.pointerDown(carousel.children[10], { pointerType: "mouse", pointerId: 1, button: 0, clientX: 500, clientY: 100 });
    fireEvent.pointerMove(carousel, { pointerType: "mouse", pointerId: 1, clientX: 200, clientY: 100 });
    expect(carousel.scrollLeft).toBe(start + 300);
    advance(5000);
    expect(carousel.scrollLeft).toBe(start + 300);
    fireEvent.pointerUp(carousel, { pointerType: "mouse", pointerId: 1 });
    advance(450);
    expect(carousel.scrollLeft).toBe(start + STRIDE);
    advance(2999);
    expect(carousel.scrollLeft).toBe(start + STRIDE);
    advance(1); advance(450);
    expect(carousel.scrollLeft).toBe(start + 2 * STRIDE);
  });

  it("đợi cuộn cảm ứng kết thúc mới căn lại game", () => {
    const { carousel } = open();
    const start = carousel.scrollLeft;
    carousel.scrollLeft = start + 130; fireEvent.scroll(carousel);
    advance(150);
    carousel.scrollLeft = start + 170; fireEvent.scroll(carousel);
    advance(179);
    expect(carousel.scrollLeft).toBe(start + 170);
    advance(1); advance(450);
    expect(carousel.scrollLeft).toBe(start + STRIDE);
  });

  it("giữ game đang xem khi resize", () => {
    const { carousel } = open();
    const start = carousel.scrollLeft;
    viewport = 390; fireEvent(window, new Event("resize"));
    expect(carousel.children[10]).toHaveClass("is-active");
    expect(carousel.scrollLeft - start).toBe((1440 - 390) / 2);
  });

  it("giảm chuyển động tắt tự chuyển, bàn phím chuyển ngay lập tức", () => {
    vi.spyOn(window, "matchMedia").mockImplementation((media) => ({ matches: true, media, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const { carousel } = open();
    const start = carousel.scrollLeft;
    advance(10000);
    expect(carousel.scrollLeft).toBe(start);
    expect(frames.size).toBe(0);
    fireEvent.keyDown(carousel, { key: "ArrowRight" });
    expect(carousel.scrollLeft).toBe(start + STRIDE);
    expect(carousel.children[11]).toHaveClass("is-active");
  });

  it("tab ẩn dừng tự chuyển; quay lại chờ đủ 3 giây, không chạy bù", () => {
    let hidden = false;
    vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
    const { carousel } = open();
    const start = carousel.scrollLeft;
    advance(2000);
    hidden = true; fireEvent(document, new Event("visibilitychange"));
    advance(10000);
    expect(carousel.scrollLeft).toBe(start);
    hidden = false; fireEvent(document, new Event("visibilitychange"));
    advance(2999);
    expect(carousel.scrollLeft).toBe(start);
    advance(1); advance(450);
    expect(carousel.scrollLeft).toBe(start + STRIDE);
  });

  it("hủy cả bộ hẹn giờ và animation khi unmount", () => {
    const { unmount } = open();
    advance(3000); advance(200);
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    advance(10000);
    expect(frames.size).toBe(0);
  });
});
