import { useEffect, useRef, useState } from "react";
import { gameBackgroundVideo } from "@/constants/game-backgrounds";

function BackdropLayer({ game, current, playing, reducedMotion }) {
  const video = useRef(null);
  const [requested, setRequested] = useState(playing);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  const source = gameBackgroundVideo(game.slug);

  useEffect(() => { if (playing && current) setRequested(true); }, [playing, current]);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let cancelled = false;
    if (playing && current && ready && !reducedMotion) {
      element.muted = true;
      try {
        element.play()?.catch((error) => {
          if (!cancelled && error.name !== "AbortError") setFailed(true);
        });
      } catch { setFailed(true); }
    } else if (!element.paused) element.pause();
    return () => { cancelled = true; if (!element.paused) element.pause(); };
  }, [playing, current, ready, reducedMotion, failed]);

  return <div className="game-backdrop-layer" data-game-background={game.slug} data-current={current}>
    <img src={game.image} alt="" decoding="async" />
    {!reducedMotion && source && !failed && (requested || playing && current) && <video ref={video}
      src={source} poster={game.image} autoPlay={playing && current} muted loop playsInline preload="metadata"
      tabIndex={-1} disablePictureInPicture disableRemotePlayback
      data-ready={visible} onCanPlay={() => setReady(true)} onPlaying={() => setVisible(true)} onError={() => setFailed(true)} />}
  </div>;
}

export default function GameBackdrop({ game, playing, reducedMotion }) {
  const [view, setView] = useState({ current: game, outgoing: null });
  // Preserve the previous layer for a crossfade, including during rapid selections.
  if (view.current !== game) setView({ current: game, outgoing: reducedMotion ? null : view.current });
  useEffect(() => {
    if (!view.outgoing) return;
    const timer = setTimeout(() => setView((previous) => ({ ...previous, outgoing: null })), reducedMotion ? 0 : 500);
    return () => clearTimeout(timer);
  }, [view.current, view.outgoing, reducedMotion]);

  return <div className="game-backdrop" aria-hidden="true">
    {view.outgoing && <BackdropLayer key={view.outgoing.slug} game={view.outgoing} current={false} playing={false} reducedMotion={reducedMotion} />}
    <BackdropLayer key={view.current.slug} game={view.current} current playing={playing} reducedMotion={reducedMotion} />
  </div>;
}
