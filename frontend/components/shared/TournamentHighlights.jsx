import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { TournamentCardGrid } from "./TournamentCard";
import EmptyState from "./EmptyState";
import { discoveryPath } from "@/lib/tournament-search";
import useReveal from "@/hooks/useReveal";

export default function TournamentHighlights({ id, title, description, status, items, reveal = false }) {
  const entrance = useReveal({ enabled: reveal });
  return <section ref={entrance} aria-labelledby={id} className="py-8 sm:py-10">
    <div data-reveal={reveal || undefined} className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><h2 id={id} className="text-xl font-semibold tracking-tight uppercase sm:text-2xl">{title}</h2><p className="mt-2 text-sm leading-6 text-dp-read">{description}</p></div>
      <Link to={discoveryPath({ status })} aria-label={`Xem tất cả: ${title}`} className="dp-motion-link flex shrink-0 items-center gap-2 text-xs font-medium text-dp-live hover:text-dp-bright">Xem tất cả<ArrowRight aria-hidden="true" className="size-4" /></Link>
    </div>
    {items.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{items.map((item) => <TournamentCardGrid reveal={reveal} key={`${item.sample ? "sample" : "tournament"}:${item.id}`} tournament={item} />)}</div>
      : <EmptyState title={`Chưa có giải ${status === "open_registration" ? "đang mở đăng ký" : "đang diễn ra"}`} description="Hãy quay lại sau hoặc khám phá các giải đấu khác." />}
  </section>;
}
