import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import useMediaQuery from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import useReveal from "@/hooks/useReveal";
import GameBackdrop from "./GameBackdrop";

const DWELL = 8000;
const DURATION = 450;
const modulo = (value, count) => ((value % count) + count) % count;

export default function GameCarousel({ games }) {
  const count = games.length;
  const firstIndex = Math.min(1, count - 1);
  const section = useRef(null);
  const track = useRef(null);
  useReveal({ mode: "posters", targetRef: track });
  const drag = useRef(null);
  const dragged = useRef(false);
  const geometry = useRef(null);
  const position = useRef(0);
  const active = useRef(firstIndex);
  const animation = useRef(null);
  const frame = useRef(null);
  const timer = useRef(null);
  const settleTimer = useRef(null);
  const mounted = useRef(false);
  const actions = useRef({});
  const pointerFocus = useRef(false);
  const paused = useRef({ focused: false, hidden: document.hidden, outside: typeof IntersectionObserver !== "undefined" });
  const [playing, setPlaying] = useState(!paused.current.hidden && !paused.current.outside);
  const [copies, setCopies] = useState(3);
  const [index, setIndex] = useState(firstIndex);
  const [selectedCard, setSelectedCard] = useState(count + firstIndex);
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
    active.current = modulo(next, count);
    setIndex(active.current);
    if (!geometry.current) setSelectedCard(count + active.current);
  }, [count]);

  const scheduleNext = useCallback(() => {
    clearAuto();
    if (count < 2 || !mounted.current || reduced.current || paused.current.focused || paused.current.hidden || paused.current.outside || drag.current || settleTimer.current != null) return;
    timer.current = setTimeout(() => actions.current.move(1), DWELL);
  }, [clearAuto, count]);

  const place = useCallback((offset, updateSelection = true) => {
    const element = track.current;
    const size = geometry.current;
    if (!element || !size) return;
    // Shift a whole catalogue to keep the same pixels on screen at either seam.
    const shift = -Math.floor((offset - size.start) / size.loop) * size.loop;
    const next = offset + shift;
    if (shift && drag.current) drag.current.offset += shift;
    if (shift && animation.current) {
      animation.current.from += shift;
      animation.current.to += shift;
    }
    position.current = next;
    element.scrollTop = next;
    if (updateSelection) select(Math.floor((next + size.anchor - size.origin - size.extent / 2) / size.stride + 0.5));
    const physical = (next + size.anchor - size.origin - size.extent / 2) / size.stride;
    setSelectedCard(active.current + Math.round((physical - active.current) / count) * count);
  }, [count, select]);

  const animateTo = useCallback((to, next, instant = false) => {
    clearAuto(); stopAnimation();
    select(next);
    if (!geometry.current || instant || reduced.current || paused.current.hidden || paused.current.outside || Math.abs(to - position.current) < 1) {
      place(to);
      scheduleNext();
      return;
    }
    animation.current = { from: position.current, to, index: modulo(next, count), started: performance.now() };
    function tick(time) {
      const transition = animation.current;
      if (!transition) return;
      const progress = Math.min((time - transition.started) / DURATION, 1);
      place(transition.from + (transition.to - transition.from) * (1 - (1 - progress) ** 3), false);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
      else { animation.current = null; frame.current = null; scheduleNext(); }
    }
    frame.current = requestAnimationFrame(tick);
  }, [clearAuto, count, place, scheduleNext, select, stopAnimation]);

  const move = useCallback((direction, focus = false) => {
    clearTimeout(settleTimer.current); settleTimer.current = null;
    const next = modulo((animation.current?.index ?? active.current) + direction, count);
    const size = geometry.current;
    if (size) {
      const from = animation.current?.to ?? position.current;
      const physical = Math.floor((from - size.origin + size.anchor - size.extent / 2) / size.stride + 0.5) + direction;
      animateTo(size.origin + physical * size.stride + size.extent / 2 - size.anchor, next);
    } else { select(next); scheduleNext(); }
    if (focus) track.current?.children[count + next]?.focus({ preventScroll: true });
  }, [animateTo, count, scheduleNext, select]);

  const snap = useCallback((instant = false) => {
    clearTimeout(settleTimer.current); settleTimer.current = null;
    const size = geometry.current;
    if (!size) { scheduleNext(); return; }
    const physical = Math.floor((position.current - size.origin + size.anchor - size.extent / 2) / size.stride + 0.5);
    animateTo(size.origin + physical * size.stride + size.extent / 2 - size.anchor, physical, instant);
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
      const stride = element.children[1].getBoundingClientRect().top - bounds.top || element.children[1].offsetTop - first.offsetTop;
      if (!stride || !element.clientHeight) return;
      const extent = bounds.height || first.offsetHeight;
      const origin = bounds.height ? bounds.top - element.getBoundingClientRect().top + element.scrollTop : first.offsetTop;
      const viewport = element.clientHeight;
      const anchor = viewport / 2;
      const loop = count * stride;
      setCopies(Math.max(3, Math.ceil(viewport / loop) + 2));
      geometry.current = { extent, origin, viewport, anchor, stride, loop, start: origin + loop + extent / 2 - anchor };
      stopAnimation();
      place(origin + (count + active.current) * stride + extent / 2 - anchor);
      if (drag.current) {
        drag.current.start = drag.current.lastY;
        drag.current.offset = position.current;
      }
      scheduleNext();
    }
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(element);
    window.addEventListener("resize", measure);
    return () => { observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, [copies, count, place, scheduleNext, stopAnimation]);

  useEffect(() => {
    mounted.current = true;
    function visibility() {
      paused.current.hidden = document.hidden;
      setPlaying(!paused.current.hidden && !paused.current.outside);
      clearAuto(); stopAnimation();
      actions.current.snap(true);
    }
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      paused.current.outside = !entry.isIntersecting || entry.intersectionRatio < 0.01;
      visibility();
    }, { threshold: 0.01 });
    observer?.observe(section.current);
    actions.current.snap(true);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      mounted.current = false;
      observer?.disconnect();
      clearAuto(); stopAnimation(); clearTimeout(settleTimer.current); settleTimer.current = null;
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [clearAuto, reducedMotion, stopAnimation]);

  function finishDrag(event) {
    if (!drag.current) return;
    const manual = drag.current.manual;
    drag.current = null;
    pointerFocus.current = false;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (manual) snap(); else settle();
  }

  function choose(next) {
    clearTimeout(settleTimer.current); settleTimer.current = null;
    const size = geometry.current;
    if (size) {
      const physical = count + next;
      const target = size.origin + physical * size.stride + size.extent / 2 - size.anchor;
      const nearest = target + Math.round(((animation.current?.to ?? position.current) - target) / size.loop) * size.loop;
      animateTo(nearest, next);
    } else { select(next); scheduleNext(); }
  }

  return <section ref={section} aria-labelledby="games-title" className="game-showcase"
    onFocusCapture={() => {
      if (!drag.current && !pointerFocus.current) { paused.current.focused = true; clearAuto(); }
    }}
    onBlurCapture={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) { paused.current.focused = false; scheduleNext(); }
    }}>
    <GameBackdrop game={games[index]} playing={playing} reducedMotion={reducedMotion} />
    <div className="game-showcase-shade" aria-hidden="true" />
    <div className="game-showcase-heading">
      <h2 id="games-title" className="home-section-title">TRÒ CHƠI CỦA CHÚNG TÔI</h2>
    </div>
    <div ref={track} role="region" aria-roledescription="carousel" aria-label={`Carousel ${count} trò chơi`} tabIndex={0}
      className="game-carousel"
      onDragStart={(event) => event.preventDefault()}
      onFocusCapture={(event) => {
        if (drag.current || pointerFocus.current) return;
        const item = event.target.closest("[data-game-index]");
        if (!item || item.getAttribute("aria-hidden") === "true") return;
        const next = Number(item.dataset.gameIndex);
        if (next !== active.current) {
          stopAnimation(); select(next);
          const size = geometry.current;
          if (size) place(size.origin + (count + next) * size.stride + size.extent / 2 - size.anchor);
        }
      }}
      onPointerDown={(event) => {
        dragged.current = false;
        pointerFocus.current = true;
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
        clearAuto(); stopAnimation(); clearTimeout(settleTimer.current); settleTimer.current = null;
        paused.current.focused = false;
        drag.current = { start: event.clientY, lastY: event.clientY, cross: event.clientX, offset: position.current, manual: event.pointerType !== "touch" };
      }}
      onPointerMove={(event) => {
        if (!drag.current) return;
        drag.current.lastY = event.clientY;
        const distance = event.clientY - drag.current.start;
        if (Math.abs(distance) > 5 || Math.abs(event.clientX - drag.current.cross) > 5) {
          dragged.current = true;
          if (drag.current.manual) {
            event.currentTarget.setPointerCapture?.(event.pointerId);
            place(drag.current.offset - distance);
          }
        }
      }}
      onPointerUp={finishDrag}
      onPointerCancel={() => { drag.current = null; dragged.current = false; pointerFocus.current = false; settle(); }}
      onLostPointerCapture={finishDrag}
      onPointerLeave={(event) => { if (!event.currentTarget.hasPointerCapture?.(event.pointerId)) finishDrag(event); }}
      onClickCapture={(event) => {
        if (dragged.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); }
        dragged.current = false;
        pointerFocus.current = false;
      }}
      onScroll={(event) => {
        // Ignore our own scroll events, including browser subpixel rounding.
        if (Math.abs(event.currentTarget.scrollTop - position.current) > 1) {
          stopAnimation(); place(event.currentTarget.scrollTop); settle();
        }
      }}
      onWheel={() => { stopAnimation(); settle(); }}
      onKeyDown={(event) => {
        pointerFocus.current = false;
        paused.current.focused = true; clearAuto();
        if (["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(event.key)) {
          event.preventDefault(); dragged.current = false; move(["ArrowDown", "ArrowRight"].includes(event.key) ? 1 : -1, true);
        }
      }}>
      {Array.from({ length: copies }, (_, copy) => games.map((game, next) => <button key={`${copy}-${game.id}`}
        type="button" draggable={false} data-game-index={next} onClick={() => choose(next)}
        aria-label={`Chọn ${game.name}`} aria-pressed={index === next} aria-hidden={copy !== 1 ? true : undefined} tabIndex={copy === 1 ? 0 : -1}
        onMouseDown={copy !== 1 ? (event) => event.preventDefault() : undefined}
        className={cn("game-carousel-card", index === next && selectedCard === copy * count + next && "is-active")}>
        <span className="game-carousel-art"><img src={game.image} alt="" draggable={false} decoding="async" /></span>
        <span className="game-carousel-name">{game.name}</span>
      </button>))}
    </div>
  </section>;
}
