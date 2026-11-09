import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HeroBanner from "@/components/shared/HeroBanner";
import useReveal from "@/hooks/useReveal";
import useNavIndicator from "@/hooks/useNavIndicator";
import { HERO_SLIDES } from "@/constants/hero-slides";

let observers;
let animations;
let animate;
const originalAnimate = Element.prototype.animate;
const originalGetAnimations = Element.prototype.getAnimations;
function intersect(observer, ratio = 0.2) { observer.callback([{ target: observer.target, isIntersecting: ratio > 0, intersectionRatio: ratio }]); }
function revealRoot() { return observers.find((observer) => observer.target?.getAttribute('aria-label') === 'Giới thiệu Tourney Pro'); }
beforeEach(() => {
  vi.useFakeTimers(); observers = []; animations = [];
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback) { this.callback = callback; this.disconnect = vi.fn(); observers.push(this); }
    observe(target) { this.target = target; }
  });
  animate = vi.fn(function (frames, options) {
    let resolve; let reject;
    const animation = { target: this, frames, options, finished: new Promise((done, fail) => { resolve = done; reject = fail; }), finish: () => resolve(), cancel: vi.fn(() => reject(new Error('Cancelled'))) };
    // Consumers may cancel an animation before awaiting it.
    animation.finished.catch(() => {}); animations.push(animation); return animation;
  });
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  Object.defineProperty(Element.prototype, 'animate', { configurable: true, writable: true, value: animate });
  Object.defineProperty(Element.prototype, 'getAnimations', { configurable: true, writable: true, value: vi.fn(() => []) });
});
afterEach(() => {
  vi.useRealTimers();
  if (originalAnimate) Element.prototype.animate = originalAnimate; else delete Element.prototype.animate;
  if (originalGetAnimations) Element.prototype.getAnimations = originalGetAnimations; else delete Element.prototype.getAnimations;
});
function openHero() { return render(<MemoryRouter><HeroBanner /></MemoryRouter>); }

describe('Hero tải ảnh và chuyển slide', () => {
  it('chờ giải mã ảnh mới, giữ ảnh cũ đủ 500ms và tiếp tục nhịp 5 giây', async () => {
    openHero();
    let decode;
    const next = screen.getByAltText(HERO_SLIDES[1].alt);
    next.decode = () => new Promise((done) => { decode = done; });
    fireEvent.load(next);
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(screen.getByRole('img', { name: HERO_SLIDES[0].alt })).toBeInTheDocument();
    await act(async () => decode());
    expect(screen.getByRole('img', { name: HERO_SLIDES[1].alt })).toHaveAttribute('data-entering', 'true');
    expect(screen.getByAltText(HERO_SLIDES[0].alt)).toHaveAttribute('data-outgoing', 'true');
    await act(async () => { vi.advanceTimersByTime(499); });
    expect(screen.getByAltText(HERO_SLIDES[0].alt)).toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(1); });
    expect(screen.queryByAltText(HERO_SLIDES[0].alt)).not.toBeInTheDocument();
    await act(async () => fireEvent.load(screen.getByAltText(HERO_SLIDES[2].alt)));
    await act(async () => { vi.advanceTimersByTime(4499); });
    expect(screen.getByRole('img', { name: HERO_SLIDES[1].alt })).toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(1); });
    expect(screen.getByRole('img', { name: HERO_SLIDES[2].alt })).toBeInTheDocument();
  });
  it('ảnh kế tiếp lỗi vẫn giữ ảnh hiện tại và chuyển được sang ảnh tải tốt sau đó', async () => {
    openHero();
    await act(async () => { vi.advanceTimersByTime(5000); });
    fireEvent.error(screen.getByAltText(HERO_SLIDES[1].alt));
    expect(screen.getByRole('img', { name: HERO_SLIDES[0].alt })).toBeInTheDocument();
    await act(async () => fireEvent.load(screen.getByAltText(HERO_SLIDES[2].alt)));
    expect(screen.getByRole('img', { name: HERO_SLIDES[2].alt })).toBeInTheDocument();
  });
  it('giảm chuyển động không tự chạy hoặc ẩn nội dung; unmount hủy bộ hẹn giờ', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((media) => ({ matches: media.includes('prefers-reduced-motion'), media, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const page = openHero();
    await act(async () => fireEvent.load(screen.getByAltText(HERO_SLIDES[1].alt)));
    await act(async () => { vi.advanceTimersByTime(20000); });
    expect(screen.getByRole('img', { name: HERO_SLIDES[0].alt })).toBeInTheDocument();
    expect(document.querySelector('[data-motion-pending]')).toBeNull();
    expect(animate).not.toHaveBeenCalled(); page.unmount(); expect(vi.getTimerCount()).toBe(0);
  });
  it('không cập nhật khi ảnh giải mã xong sau unmount', async () => {
    const page = openHero(); let resolve;
    const next = screen.getByAltText(HERO_SLIDES[1].alt); next.decode = () => new Promise((done) => { resolve = done; });
    fireEvent.load(next); page.unmount(); await act(async () => resolve());
    expect(vi.getTimerCount()).toBe(0); expect(animate).not.toHaveBeenCalled();
  });
});

function Group({ mode = 'section' }) {
  const root = useReveal({ mode });
  return <div data-page-ready><section ref={root} data-testid="group"><h2 data-reveal>Group</h2><a data-reveal href="/search">Open</a></section></div>;
}
describe('Hiệu ứng xuất hiện có điều kiện', () => {
  it('đợi đủ 15% và slide trang hoàn tất, chỉ chạy một lần và dùng translate riêng', async () => {
    let finishPage;
    const pageAnimation = { finished: new Promise((done) => { finishPage = done; }) };
    vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([pageAnimation]);
    render(<Group />); const observer = observers[0];
    await act(async () => intersect(observer, 0.14)); expect(animate).not.toHaveBeenCalled();
    await act(async () => intersect(observer, 0.15)); expect(animate).not.toHaveBeenCalled();
    await act(async () => finishPage());
    expect(animate).toHaveBeenCalledTimes(2);
    expect(animations[0].frames[0]).toEqual({ opacity: 0, translate: '0 20px' });
    expect(animations.map((item) => item.options.delay)).toEqual([0, 60]);
    await act(async () => animations.forEach((item) => item.finish()));
    expect(screen.getByTestId('group')).toHaveAttribute('data-motion-state', 'complete');
    await act(async () => intersect(observer)); expect(animate).toHaveBeenCalledTimes(2);
  });
  it('focus vào liên kết hiện nội dung ngay, không giữ nút vô hình', async () => {
    render(<Group />);
    expect(screen.getByRole('link')).toHaveAttribute('data-motion-pending');
    act(() => screen.getByRole('link').focus());
    expect(document.querySelector('[data-motion-pending]')).toBeNull();
    await act(async () => intersect(observers[0])); expect(animate).not.toHaveBeenCalled();
  });
  it('hero dùng 650ms và stagger 80ms; focus điều hướng vào h1 không hủy toàn cảnh', async () => {
    openHero(); const observer = revealRoot();
    const art = document.querySelector('[data-reveal-kind="hero-art"] img[data-current="true"]');
    Object.defineProperty(art, 'complete', { configurable: true, value: true });
    const heading = screen.getByRole('heading', { level: 1 }); heading.tabIndex = -1;
    act(() => heading.focus()); await act(async () => intersect(observer));
    expect(animations).toHaveLength(6);
    const artAnimation = animations.find((item) => item.target.dataset.revealKind === 'hero-art');
    expect(artAnimation.options.duration).toBe(650);
    expect(artAnimation.frames[0].transform).toBe('scale(1.04)');
    expect(animations.filter((item) => item.target.tagName === 'SPAN').map((item) => item.options.delay)).toEqual([0,80,160]);
  });
  it('mobile chỉ dịch 12px/350ms, không dùng zoom hoặc clip-path', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((media) => ({ matches: media.includes('max-width: 767px'), media, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    openHero();
    Object.defineProperty(document.querySelector('img[data-current="true"]'), 'complete', { configurable: true, value: true });
    await act(async () => intersect(revealRoot()));
    expect(animations).toHaveLength(6);
    expect(animations.every((item) => item.options.duration === 350)).toBe(true);
    expect(animations.every((item) => item.frames[0].translate === '0 12px' && !item.frames[0].transform && !item.frames[0].clipPath)).toBe(true);
  });
  it('unmount trước khi slide trang xong không chạy animation, dọn trạng thái chờ', async () => {
    let resolve;
    vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([{ finished: new Promise((done) => { resolve = done; }) }]);
    const page = render(<Group />); const element = screen.getByTestId('group');
    await act(async () => intersect(observers[0])); page.unmount();
    await act(async () => resolve()); expect(animate).not.toHaveBeenCalled();
    expect(element.querySelector('[data-motion-pending]')).toBeNull(); expect(observers[0].disconnect).toHaveBeenCalled();
  });
});

function Nav({ active }) {
  const root = useNavIndicator(active, false);
  return <nav ref={root} data-testid="nav"><a aria-current={active === 'search' ? 'page' : undefined}>Search</a><a aria-current={active === 'community' ? 'page' : undefined}>Community</a><span data-nav-indicator /></nav>;
}
it('gạch chân trượt theo mục chọn, resize căn lại và không thêm hiệu ứng khi giảm chuyển động', () => {
  let offset = 200;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    const nav = this.tagName === 'NAV'; const second = this.textContent === 'Community';
    return { left: nav || !second ? 100 : 100 + offset, width: nav ? 500 : second ? 120 : 180 };
  });
  const page = render(<Nav active="search" />); const marker = document.querySelector('[data-nav-indicator]');
  expect(marker.style.width).toBe('180px');
  page.rerender(<Nav active="community" />);
  expect(animations[0].options.duration).toBe(180); expect(animations[0].frames[1].transform).toBe('translateX(200px)');
  offset = 230; fireEvent(window, new Event('resize'));
  expect(marker.style.transform).toBe('translateX(230px)'); expect(animations[0].cancel).toHaveBeenCalled();
  page.unmount();
  vi.spyOn(window, 'matchMedia').mockImplementation((media) => ({ matches: media.includes('prefers-reduced-motion'), media, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  animate.mockClear(); const reducedPage = render(<Nav active="search" />); reducedPage.rerender(<Nav active="community" />);
  expect(animate).not.toHaveBeenCalled(); expect(document.querySelector('[data-nav-indicator]').style.transform).toBe('translateX(230px)');
});
