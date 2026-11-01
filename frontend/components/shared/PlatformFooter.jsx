import { Link } from "react-router-dom";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import useMediaQuery from "@/hooks/useMediaQuery";
import logo from "@/assets/logo_bieutuong.png";

export default function PlatformFooter() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  return <footer className="shrink-0 border-t border-dp-hairline bg-dp-panel">
    <div className="dp-container flex flex-wrap items-center justify-between gap-6 py-7">
      <Link to="/" aria-label="Về trang chủ" className="flex min-w-0 shrink-0 items-center gap-2.5">
        <img src={logo} alt="" className="size-8 shrink-0 object-contain" />
        <span className="hidden text-xs font-semibold tracking-[0.12em] min-[360px]:inline sm:text-sm">TOURNEY PRO</span>
      </Link>
      <span className="font-mono text-[10px] tracking-widest text-dp-meta">BTP TOURNAMENT</span>
      <Button variant="ghost" size="sm" className="text-[11px] tracking-wide" onClick={() => window.scrollTo({ top: 0, behavior: reducedMotion ? "instant" : "smooth" })}>TỚI ĐẦU TRANG<ArrowUp /></Button>
    </div>
  </footer>;
}
