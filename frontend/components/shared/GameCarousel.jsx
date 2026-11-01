import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LANDING_GAMES } from "@/constants/games";
import useMediaQuery from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { discoveryPath } from "@/lib/tournament-search";
import useReveal from "@/hooks/useReveal";

const COUNT = LANDING_GAMES.length;
const DWELL = 3000;
const DURATION = 450;
const modulo = (value) => ((value % COUNT) + COUNT) % COUNT;

export default function GameCarousel() {
  const track = useRef(null);
  useReveal({ mode: "posters", targetRef: track });
  const drag = useRef(null);
  const dragged = useRef(false);
  const geometry = useRef(null);
  const position = useRef(0);
  const active = useRef(1);
  const animation = useRef(null);
  const frame = useRef(null);
  const timer = useRef(null);
  const settleTimer = useRef(null);
  const mounted = useRef(false);
  const actions = useRef({});
  const paused = useRef({ focused: false, hidden: document.hidden });
  const [index, setIndex] = useState(1);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const reduced = useRef(reducedMotion);
  reduced.current = reducedMotion;

  const clearAuto = useCallback(() => { clearTimeout(timer.current); timer.current = null; }, []);
  const stopAnimation = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = null;
    animation.current = null;
  }, []);
  const select = useCallback((next) => {
    active.current = modulo(next);
    setIndex(active.current);
  }, []);

  const scheduleNext = useCallback(() => {
    clearAuto();
    if (!mounted.current || reduced.current || paused.current.focused || paused.current.hidden || drag.current || settleTimer.current != null) return;
    timer.current = setTimeout(() => actions.current.move(1), DWELL);
  }, [clearAuto]);

  const place = useCallback((left) => {
    const element = track.current;
    const size = geometry.current;
    if (!element || !size) return;
    // Shift a whole catalogue to keep the same pixels on screen at either seam.
    const shift = -Math.floor((left - size.start) / size.loop) * size.loop;
    const next = left + shift;
    if (shift && drag.current) drag.current.left += shift;
    if (shift && animation.current) {
      animation.current.from += shift;
      animation.current.to += shift;
    }
    position.current = next;
    element.scrollLeft = next;
    select(Math.floor((next + size.viewport / 2 - size.origin - size.width / 2) / size.stride + 0.5));
  }, [select]);

  const animateTo = useCallback((to, next, instant = false) => {
    clearAuto(); stopAnimation();
    select(next);
    if (!geometry.current || instant || reduced.current || paused.current.hidden || Math.abs(to - position.current) < 1) {
      place(to);
      scheduleNext();
      return;
    }
    animation.current = { from: position.current, to, index: modulo(next), started: performance.now() };
    function tick(time) {
      const transition = animation.current;
      if (!transition) return;
      const progress = Math.min((time - transition.started) / DURATION, 1);
      place(transition.from + (transition.to - transition.from) * (1 - (1 - progress) ** 3));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
      else { animation.current = null; frame.current = null; scheduleNext(); }
    }
    frame.current = requestAnimationFrame(tick);
  }, [clearAuto, place, scheduleNext, select, stopAnimation]);

  const move = useCallback((direction, focus = false) => {
    clearTimeout(settleTimer.current); settleTimer.current = null;
    const next = modulo((animation.current?.index ?? active.current) + direction);
    const size = geometry.current;
    if (size) {
      const from = animation.current?.to ?? position.current;
      const physical = Math.floor((from - size.origin + size.viewport / 2 - size.width / 2) / size.stride + 0.5) + direction;
      animateTo(size.origin + physical * size.stride + size.width / 2 - size.viewport / 2, next);
    } else { select(next); scheduleNext(); }
    if (focus) track.current?.children[COUNT + next]?.focus({ preventScroll: true });
  }, [animateTo, scheduleNext, select]);

  const snap = useCallback((instant = false) => {
    clearTimeout(settleTimer.current); settleTimer.current = null;
    const size = geometry.current;
    if (!size) { scheduleNext(); return; }
    const physical = Math.floor((position.current - size.origin + size.viewport / 2 - size.width / 2) / size.stride + 0.5);
    animateTo(size.origin + physical * size.stride + size.width / 2 - size.viewport / 2, physical, instant);
  }, [animateTo, scheduleNext]);
  actions.current = { move, snap };

  function settle() {
    clearAuto();
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      settleTimer.current = null;
      if (!drag.current) actions.current.snap();
    }, 180);
  }

  useLayoutEffect(() => {
    const element = track.current;
    function measure() {
      const first = element.children[0];
      const bounds = first.getBoundingClientRect();
      const stride = element.children[1].getBoundingClientRect().left - bounds.left || element.children[1].offsetLeft - first.offsetLeft;
      if (!stride || !element.clientWidth) return;
      const width = bounds.width || first.offsetWidth;
      const origin = bounds.width ? bounds.left - element.getBoundingClientRect().left + element.scrollLeft : first.offsetLeft;
      const viewport = element.clientWidth;
      const loop = COUNT * stride;
      geometry.current = { width, origin, viewport, stride, loop, start: origin + loop + width / 2 - viewport / 2 };
      stopAnimation();
      place(origin + (COUNT + active.current) * stride + width / 2 - viewport / 2);
      if (drag.current) {
        drag.current.start = drag.current.lastX;
        drag.current.left = position.current;
      }
      scheduleNext();
    }
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(element);
    window.addEventListener("resize", measure);
    return () => { observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, [place, scheduleNext, stopAnimation]);

  useEffect(() => {
    mounted.current = true;
    function visibility() {
      paused.current.hidden = document.hidden;
      clearAuto(); stopAnimation();
      actions.current.snap(true);
    }
    actions.current.snap(true);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      mounted.current = false;
      clearAuto(); stopAnimation(); clearTimeout(settleTimer.current); settleTimer.current = null;
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [clearAuto, reducedMotion, stopAnimation]);

  function finishDrag(event) {
    if (!drag.current) return;
    const manual = drag.current.manual;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (manual) snap(); else settle();
  }

  return <section aria-labelledby="games-title" className="border-b border-dp-hairline py-10 sm:py-12"
    onFocusCapture={() => {
      if (!drag.current) { paused.current.focused = true; clearAuto(); }
    }}
    onBlurCapture={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) { paused.current.focused = false; scheduleNext(); }
    }}>
    <div className="dp-container mb-8">
      <h2 id="games-title" className="home-section-title">TRÒ CHƠI CỦA CHÚNG TÔI</h2>
      <p className="mt-3 text-sm leading-6 text-dp-read">Chọn game để khám phá giải đấu. Kéo hoặc dùng phím mũi tên để xem thêm.</p>
    </div>
    <div ref={track} role="region" aria-roledescription="carousel" aria-label={`Carousel ${COUNT} trò chơi`} tabIndex={0}
      className="game-carousel"
      onDragStart={(event) => event.preventDefault()}
      onFocusCapture={(event) => {
        if (drag.current) return;
        const item = event.target.closest("[data-game-index]");
        if (!item || item.getAttribute("aria-hidden") === "true") return;
        const next = Number(item.dataset.gameIndex);
        if (next !== active.current) {
          stopAnimation(); select(next);
          const size = geometry.current;
          if (size) place(size.origin + (COUNT + next) * size.stride + size.width / 2 - size.viewport / 2);
        }
      }}
      onPointerDown={(event) => {
        dragged.current = false;
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
        clearAuto(); stopAnimation(); clearTimeout(settleTimer.current); settleTimer.current = null;
        paused.current.focused = false;
        drag.current = { start: event.clientX, lastX: event.clientX, top: event.clientY, left: position.current, manual: event.pointerType !== "touch" };
      }}
      onPointerMove={(event) => {
        if (!drag.current) return;
        drag.current.lastX = event.clientX;
        const distance = event.clientX - drag.current.start;
        if (Math.abs(distance) > 5 || Math.abs(event.clientY - drag.current.top) > 5) {
          dragged.current = true;
          if (drag.current.manual) {
            event.currentTarget.setPointerCapture?.(event.pointerId);
            place(drag.current.left - distance);
          }
        }
      }}
      onPointerUp={finishDrag}
      onPointerCancel={() => { drag.current = null; dragged.current = false; settle(); }}
      onLostPointerCapture={finishDrag}
      onPointerLeave={(event) => { if (!event.currentTarget.hasPointerCapture?.(event.pointerId)) finishDrag(event); }}
      onClickCapture={(event) => {
        if (dragged.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); }
        dragged.current = false;
      }}
      onScroll={(event) => {
        // Ignore our own scroll events, including browser subpixel rounding.
        if (Math.abs(event.currentTarget.scrollLeft - position.current) > 1) {
          stopAnimation(); place(event.currentTarget.scrollLeft); settle();
        }
      }}
      onWheel={() => { stopAnimation(); settle(); }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault(); dragged.current = false; move(event.key === "ArrowRight" ? 1 : -1, true);
        }
      }}>
      {[0, 1, 2].flatMap((copy) => LANDING_GAMES.map((game, next) => <Link key={`${copy}-${game.id}`}
        to={discoveryPath({ game: game.id })} draggable={false} data-game-index={next}
        aria-label={`Khám phá giải đấu ${game.name}`} aria-hidden={copy !== 1 ? true : undefined} tabIndex={copy === 1 ? 0 : -1}
        onMouseDown={copy !== 1 ? (event) => event.preventDefault() : undefined}
        className={cn("game-carousel-card", index === next && "is-active")}>
        <img src={game.image} alt="" draggable={false} decoding="async" />
      </Link>))}
    </div>
  </section>;
}
