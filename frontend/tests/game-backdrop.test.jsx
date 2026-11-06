import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GameBackdrop from "@/components/shared/GameBackdrop";
import { LANDING_GAMES } from "@/constants/games";

const [lol, valorant, tft, cs2] = LANDING_GAMES;
const scene = (game, props = {}) => <GameBackdrop game={game} playing reducedMotion={false} {...props} />;
const current = (container) => container.querySelector('[data-current="true"]');

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});
afterEach(() => vi.useRealTimers());

describe("Video nền theo game", () => {
  it("chỉ yêu cầu clip đang chọn, phát không tiếng và lặp trong trang", () => {
    const { container } = render(scene(valorant));
    const videos = container.querySelectorAll("video");
    expect(videos).toHaveLength(1);
    expect(videos[0]).toHaveAttribute("src", expect.stringContaining("valorant.mp4"));
    expect(videos[0].muted).toBe(true);
    expect(videos[0].loop).toBe(true);
    expect(videos[0].autoplay).toBe(true);
    expect(videos[0].playsInline).toBe(true);
    expect(videos[0].controls).toBe(false);
    expect(videos[0]).toHaveAttribute("poster", valorant.image);
    fireEvent.canPlay(videos[0]);
    expect(videos[0].play).toHaveBeenCalled();
    fireEvent.playing(videos[0]);
    expect(videos[0]).toHaveAttribute("data-ready", "true");
  });

  it("chọn nhanh nhiều game chỉ giữ tối đa hai clip và dọn lớp trước sau 500ms", () => {
    const page = render(scene(valorant));
    for (const game of [tft, cs2, lol, valorant]) {
      page.rerender(scene(game));
      expect(page.container.querySelectorAll("video").length).toBeLessThanOrEqual(2);
      expect(current(page.container)).toHaveAttribute("data-game-background", game.slug);
      expect(current(page.container).querySelector("video")).toHaveAttribute("src", expect.stringContaining(game.slug + ".mp4"));
      act(() => vi.advanceTimersByTime(100));
    }
    act(() => vi.advanceTimersByTime(500));
    expect(page.container.querySelectorAll("[data-game-background]")).toHaveLength(1);
    expect(current(page.container)).toHaveAttribute("data-game-background", "valorant");
    page.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("giữ poster nếu thiếu clip hoặc clip gặp lỗi", () => {
    const page = render(scene({ ...lol, slug: "missing-video" }));
    expect(page.container.querySelector("video")).toBeNull();
    expect(current(page.container).querySelector("img")).toHaveAttribute("src", lol.image);
    page.rerender(scene(valorant));
    fireEvent.error(current(page.container).querySelector("video"));
    expect(current(page.container).querySelector("video")).toBeNull();
    expect(current(page.container).querySelector("img")).toHaveAttribute("src", valorant.image);
  });

  it("trình duyệt chặn autoplay thì trở lại poster, không thêm nút phát", async () => {
    vi.useRealTimers();
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValue(new DOMException("Blocked", "NotAllowedError"));
    const { container } = render(scene(valorant));
    fireEvent.canPlay(container.querySelector("video"));
    await waitFor(() => expect(container.querySelector("video")).toBeNull());
    expect(container.querySelector("img")).toHaveAttribute("src", valorant.image);
    expect(container.querySelector("button")).toBeNull();
  });

  it("ngoài màn hình chưa tải video; khi xuất hiện thì phát, ẩn đi thì dừng", () => {
    const page = render(scene(valorant, { playing: false }));
    expect(page.container.querySelector("video")).toBeNull();
    page.rerender(scene(valorant));
    const video = page.container.querySelector("video");
    fireEvent.canPlay(video);
    Object.defineProperty(video, "paused", { configurable: true, get: () => false });
    page.rerender(scene(valorant, { playing: false }));
    expect(video.pause).toHaveBeenCalled();
    vi.mocked(video.play).mockClear();
    page.rerender(scene(valorant));
    expect(video.play).toHaveBeenCalledTimes(1);
    vi.mocked(video.pause).mockClear();
    page.unmount();
    expect(video.pause).toHaveBeenCalled();
  });

  it("chế độ giảm chuyển động chỉ dùng poster, không tải video", () => {
    const page = render(scene(valorant, { reducedMotion: true }));
    page.rerender(scene(cs2, { reducedMotion: true }));
    expect(page.container.querySelector("video")).toBeNull();
    expect(current(page.container)).toHaveAttribute("data-game-background", cs2.slug);
    expect(current(page.container).querySelector("img")).toHaveAttribute("src", cs2.image);
  });
});
