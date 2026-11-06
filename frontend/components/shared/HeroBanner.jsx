import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HERO_SLIDES as SLIDES } from "@/constants/hero-slides";
import { discoveryPath } from "@/lib/tournament-search";
import useHeroSlides from "@/hooks/useHeroSlides";
import useReveal from "@/hooks/useReveal";

export default function HeroBanner() {
  const { current, outgoing, preload, onLoad, onError } = useHeroSlides(SLIDES.length);
  const entrance = useReveal({ mode: "hero" });
  return <section ref={entrance} aria-label="Giới thiệu Tourney Pro" aria-roledescription="carousel" className="relative isolate flex min-h-svh overflow-hidden border-b border-dp-hairline">
    <div data-reveal data-reveal-kind="hero-art" data-reveal-delay="0" className="absolute inset-0 -z-20 overflow-hidden">
      {SLIDES.map((item, index) => [current, outgoing, preload].includes(index) && <img key={index} src={item.image} alt={item.alt} aria-hidden={current !== index}
        data-current={current === index} data-outgoing={outgoing === index} data-entering={current === index && outgoing !== null}
        onLoad={(event) => onLoad(index, event.currentTarget)} onError={() => onError(index)}
        loading="eager" fetchPriority={current === index ? "high" : "auto"}
        style={{ objectPosition: item.position }} className="hero-slide absolute inset-0 size-full object-cover" />)}
    </div>
    <div className="hero-shade pointer-events-none absolute inset-0 -z-10" />
    <div className="home-hero-content dp-container flex flex-1 flex-col justify-center py-12">
      <h1 className="max-w-2xl text-[clamp(2.25rem,5.2vw,4.75rem)] leading-[0.98] font-semibold tracking-[-0.05em] uppercase">
        {["SIMPLIFIED", "TOURNAMENT", "MANAGEMENT"].map((line, index) => <span key={line} data-reveal data-reveal-delay={index * 80} className={index === 2 ? "block text-dp-live" : "block"}>{line}</span>)}
      </h1>
      <p data-reveal data-reveal-delay="240" className="mt-5 max-w-lg text-sm leading-7 text-dp-read">
        Tìm giải đấu cho tựa game bạn yêu thích, kết nối đồng đội và sẵn sàng tranh tài.
        Cùng Tourney Pro tổ chức sân chơi của riêng bạn, quản lý đội tuyển, lịch đấu và kết quả.
      </p>
      <div data-reveal data-reveal-delay="320" className="mt-6 flex flex-wrap gap-3"><Button asChild className="h-11 px-5"><Link to={discoveryPath({ status: "open_registration" })}><Search />Tìm giải tham gia</Link></Button><Button asChild variant="outline" className="h-11 px-5"><Link to="/create"><Plus />Tổ chức giải đấu</Link></Button></div>
    </div>
  </section>;
}
