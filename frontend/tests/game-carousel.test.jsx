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
  return { ...view, carousel: screen.getByRole("region", { name: `Carousel ${LANDING_GAMES.length} trò chơi` }) };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  frames = new Map(); frameId = 0; viewport = 900;
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback) => { frames.set(++frameId, callback); return frameId; }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn((id) => frames.delete(id)));
  vi.stubGlobal("PointerEvent", class extends MouseEvent {
    constructor(type, options) { super(type, options); this.pointerType = options.pointerType; this.pointerId = options.pointerId; }
  });
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(function () { return this.classList.contains("game-carousel") ? viewport : 0; });
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function () { return this.classList.contains("game-carousel-card") ? 200 : 0; });
  vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function () {
    return this.classList.contains("game-carousel-card") ? [...this.parentElement.children].indexOf(this) * STRIDE : 0;
  });
});
afterEach(() => vi.useRealTimers());

describe("Carousel game kiểu PS5", () => {
  it("có ảnh và tên của 8 game; bản sao không có trong thứ tự Tab", () => {
    const { carousel } = open();
    expect(within(carousel).getAllByRole("button")).toHaveLength(LANDING_GAMES.length);
    expect(carousel.children).toHaveLength(LANDING_GAMES.length * 3);
    for (const clone of carousel.querySelectorAll('[aria-hidden="true"]')) expect(clone.tabIndex).toBe(-1);
    for (const game of LANDING_GAMES) {
      const button = within(carousel).getByRole("button", { name: `Chọn ${game.name}` });
      expect(button).toHaveTextContent(game.name);
      expect(button).not.toHaveAttribute("href");
      expect(button.querySelector("img")).toHaveAttribute("src", game.image);
    }
    expect(screen.getAllByRole("button")).toHaveLength(LANDING_GAMES.length);
  });

  it("đứng yên 8 giây, trượt một game trong 450ms rồi chờ lại đủ 8 giây", () => {
    const { carousel } = open();
    const start = carousel.scrollTop;
    expect(frames.size).toBe(0);
    advance(7999);
    expect(carousel.scrollTop).toBe(start);
    expect(frames.size).toBe(0);
    advance(1);
    expect(carousel.scrollTop).toBe(start);
    advance(225);
    expect(carousel.scrollTop).toBeGreaterThan(start);
    expect(carousel.scrollTop).toBeLessThan(start + STRIDE);
    advance(225);
    expect(carousel.scrollTop).toBe(start + STRIDE);
    expect(frames.size).toBe(0);
    advance(7999);
    expect(carousel.scrollTop).toBe(start + STRIDE);
    advance(1); advance(450);
    expect(carousel.scrollTop).toBe(start + STRIDE * 2);
  });

  it("hover cả tiêu đề lẫn poster không dừng hoặc đặt lại thời gian chuyển", () => {
    const { carousel } = open();
    const start = carousel.scrollTop;
    advance(2000);
    fireEvent.mouseEnter(carousel.closest("section"));
    fireEvent.mouseEnter(carousel);
    advance(6000); advance(450);
    expect(carousel.scrollTop).toBe(start + STRIDE);
    fireEvent.mouseLeave(carousel); fireEvent.mouseLeave(carousel.closest("section"));
    advance(8000); advance(450);
    expect(carousel.scrollTop).toBe(start + STRIDE * 2);
  });

  it("tự chuyển qua game cuối nối tiếp game đầu", () => {
    const { carousel } = open();
    const start = carousel.scrollTop;
    for (let step = 0; step < LANDING_GAMES.length - 1; step++) { advance(8000); advance(450); }
    expect(carousel.children[8]).toHaveClass("is-active");
    expect(carousel.scrollTop).toBe(start - STRIDE);
    advance(8000); advance(450);
    expect(carousel.children[9]).toHaveClass("is-active");
    expect(carousel.scrollTop).toBe(start);
  });

  it("chuẩn hóa vị trí ở cả hai đầu bằng đúng một lượt", () => {
    const { carousel } = open();
    const start = carousel.scrollTop;
    carousel.scrollTop = start + LOOP; fireEvent.scroll(carousel);
    expect(carousel.scrollTop).toBe(start);
    carousel.scrollTop = start - LOOP; fireEvent.scroll(carousel);
    expect(carousel.scrollTop).toBe(start);
  });

  it("bàn phím đi qua game cuối/đầu và focus vẫn mở được đúng game", () => {
    const { carousel } = open();
    for (let step = 0; step < LANDING_GAMES.length - 1; step++) fireEvent.keyDown(carousel, { key: "ArrowDown" });
    expect(within(carousel).getByRole("button", { name: `Chọn ${LANDING_GAMES[0].name}` })).toHaveFocus();
    advance(450);
    fireEvent.keyDown(carousel, { key: "ArrowUp" });
    expect(within(carousel).getByRole("button", { name: `Chọn ${LANDING_GAMES[7].name}` })).toHaveFocus();
    advance(450);
    expect(carousel.children[15]).toHaveClass("is-active");
  });

  it("focus bàn phím tạm dừng; blur bắt đầu lại thời gian chờ 8 giây", () => {
    const { carousel } = open();
    const start = carousel.scrollTop;
    advance(2000);
    act(() => carousel.focus());
    advance(10000);
    expect(carousel.scrollTop).toBe(start);
    act(() => carousel.blur());
    advance(7999);
    expect(carousel.scrollTop).toBe(start);
    advance(1); advance(450);
    expect(carousel.scrollTop).toBe(start + STRIDE);
  });

  it("kéo xong căn game gần nhất và chờ đủ 8 giây trước khi tự chuyển", () => {
    const { carousel } = open();
    const start = carousel.scrollTop;
    fireEvent.pointerDown(carousel.children[9], { pointerType: "mouse", pointerId: 1, button: 0, clientX: 100, clientY: 500 });
    fireEvent.pointerMove(carousel, { pointerType: "mouse", pointerId: 1, clientX: 100, clientY: 200 });
    expect(carousel.scrollTop).toBe(start + 300);
    advance(5000);
    expect(carousel.scrollTop).toBe(start + 300);
    fireEvent.pointerUp(carousel, { pointerType: "mouse", pointerId: 1 });
    advance(450);
    expect(carousel.scrollTop).toBe(start + STRIDE);
    advance(7999);
    expect(carousel.scrollTop).toBe(start + STRIDE);
    advance(1); advance(450);
    expect(carousel.scrollTop).toBe(start + 2 * STRIDE);
  });

  it("đợi cuộn cảm ứng kết thúc mới căn lại game", () => {
    const { carousel } = open();
    const start = carousel.scrollTop;
    carousel.scrollTop = start + 130; fireEvent.scroll(carousel);
    advance(150);
    carousel.scrollTop = start + 170; fireEvent.scroll(carousel);
    advance(179);
    expect(carousel.scrollTop).toBe(start + 170);
    advance(1); advance(450);
    expect(carousel.scrollTop).toBe(start + STRIDE);
  });

  it("giữ game đang xem khi resize", () => {
    const { carousel } = open();
    const start = carousel.scrollTop;
    viewport = 390; fireEvent(window, new Event("resize"));
    expect(carousel.children[9]).toHaveClass("is-active");
    expect(carousel.scrollTop - start).toBe((900 - 390) / 2);
  });

  it("màn hình rộng chỉ làm nổi một ảnh dù có nhiều bản sao để cuộn nối vòng", () => {
    viewport = 3840;
    const { carousel } = open();
    expect(carousel.querySelectorAll(".is-active")).toHaveLength(1);
    expect(within(carousel).getAllByRole("button")).toHaveLength(LANDING_GAMES.length);
    advance(8000); advance(450);
    expect(carousel.querySelectorAll(".is-active")).toHaveLength(1);
    expect(carousel.querySelector(".is-active")).toHaveAttribute("data-game-index", "2");
  });

  it("giảm chuyển động tắt tự chuyển, bàn phím chuyển ngay lập tức", () => {
    vi.spyOn(window, "matchMedia").mockImplementation((media) => ({ matches: true, media, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const { carousel } = open();
    const start = carousel.scrollTop;
    advance(10000);
    expect(carousel.scrollTop).toBe(start);
    expect(frames.size).toBe(0);
    fireEvent.keyDown(carousel, { key: "ArrowDown" });
    expect(carousel.scrollTop).toBe(start + STRIDE);
    expect(carousel.children[10]).toHaveClass("is-active");
  });

  it("tab ẩn dừng tự chuyển; quay lại chờ đủ 8 giây, không chạy bù", () => {
    let hidden = false;
    vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
    const { carousel } = open();
    const start = carousel.scrollTop;
    advance(2000);
    hidden = true; fireEvent(document, new Event("visibilitychange"));
    advance(10000);
    expect(carousel.scrollTop).toBe(start);
    hidden = false; fireEvent(document, new Event("visibilitychange"));
    advance(7999);
    expect(carousel.scrollTop).toBe(start);
    advance(1); advance(450);
    expect(carousel.scrollTop).toBe(start + STRIDE);
  });

  it("chọn thủ công đổi nền ngay và bắt đầu lại chu kỳ 8 giây", () => {
    const { carousel } = open();
    advance(4000);
    fireEvent.click(within(carousel).getByRole("button", { name: "Chọn Free Fire" }));
    expect(within(carousel).getByRole("button", { name: "Chọn Free Fire" })).toHaveAttribute("aria-pressed", "true");
    expect(document.querySelector('[data-game-background][data-current="true"]')).toHaveAttribute("data-game-background", "freefire");
    advance(450);
    advance(7999);
    expect(within(carousel).getByRole("button", { name: "Chọn Free Fire" })).toHaveAttribute("aria-pressed", "true");
    advance(1); advance(450);
    expect(within(carousel).getByRole("button", { name: "Chọn Liên Minh Huyền Thoại: Tốc Chiến" })).toHaveAttribute("aria-pressed", "true");
  });

  it("ngoài màn hình không tải clip hoặc tự chuyển, trở lại chờ đủ 8 giây", () => {
    let intersect;
    vi.stubGlobal("IntersectionObserver", class {
      constructor(callback) { intersect = callback; }
      observe() {}
      disconnect() {}
    });
    const { carousel } = open();
    expect(document.querySelector("video")).toBeNull();
    const start = carousel.scrollTop;
    advance(20000);
    expect(carousel.scrollTop).toBe(start);
    act(() => intersect([{ isIntersecting: true, intersectionRatio: 0 }]));
    expect(document.querySelector("video")).toBeNull();
    act(() => intersect([{ isIntersecting: true, intersectionRatio: 1 }]));
    expect(document.querySelector("video")).toHaveAttribute("src", expect.stringContaining("valorant.mp4"));
    advance(8000); advance(450);
    const selected = carousel.scrollTop;
    act(() => intersect([{ isIntersecting: false, intersectionRatio: 0 }]));
    advance(20000);
    expect(carousel.scrollTop).toBe(selected);
    act(() => intersect([{ isIntersecting: true, intersectionRatio: 1 }]));
    advance(7999);
    expect(carousel.scrollTop).toBe(selected);
    advance(1); advance(450);
    expect(carousel.scrollTop).toBe(selected + STRIDE);
  });

  it("hủy cả bộ hẹn giờ và animation khi unmount", () => {
    const { unmount } = open();
    advance(8000); advance(200);
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    advance(10000);
    expect(frames.size).toBe(0);
  });
});
