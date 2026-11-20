import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import GameCarousel from "@/components/shared/GameCarousel";
import HeroBanner from "@/components/shared/HeroBanner";
import useReveal from "@/hooks/useReveal";
import useTournamentCatalog from "@/hooks/useTournamentCatalog";
import TournamentHighlights from "@/components/shared/TournamentHighlights";
import { useTourney } from "@/context/TourneyContext";
import { gameCarouselItem } from "@/lib/games";
import { landingHighlights } from "@/lib/tournaments";
import { discoveryPath } from "@/lib/tournament-search";

export default function LandingPage() {
  const guide = useReveal();
  const { games } = useTourney();
  const carouselGames = useMemo(() => games.map(gameCarouselItem), [games]);
  const { catalog, now } = useTournamentCatalog();
  const highlights = useMemo(() => landingHighlights(catalog, now), [catalog, now]);

  return <>
      <HeroBanner />
      {carouselGames.length > 0 && <GameCarousel games={carouselGames} />}
      <section aria-labelledby="happening-title" className="dp-container py-4 sm:py-6">
        <h2 id="happening-title" className="home-section-title mt-8 sm:mt-10">Chuyện gì đang xảy ra vậy</h2>
        <TournamentHighlights reveal id="open-tournaments" title="Đang mở đăng ký" description="Chọn giải phù hợp, đọc thể lệ và xác nhận tham gia." status="open_registration" items={highlights.open} />
        <TournamentHighlights reveal id="ongoing-tournaments" title="Đang diễn ra" description="Theo dõi lịch thi đấu và kết quả các giải đang tranh tài." status="in_progress" items={highlights.ongoing} />
      </section>
      <section ref={guide} aria-labelledby="getting-started" className="border-t border-dp-hairline bg-dp-panel/40 py-12 sm:py-16">
        <div className="dp-container">
          <h2 data-reveal id="getting-started" className="home-section-title mb-7">Bắt đầu cuộc chơi của bạn</h2>
          <div className="grid gap-5 lg:grid-cols-2">
            {[{ title: "Tôi muốn tham gia", icon: Users, steps: ["Chọn tựa game và tìm giải phù hợp.", "Đọc thể lệ, xem đội tuyển và lịch thi đấu.", "Đăng nhập rồi xác nhận đăng ký tham gia."], label: "Bắt đầu tham gia", to: discoveryPath() },
              { title: "Tôi muốn tổ chức", icon: Trophy, steps: ["Đăng nhập và tạo giải đấu của bạn.", "Cấu hình bộ môn, đăng ký và đội tuyển.", "Dựng trang giải, xếp lịch và cập nhật kết quả."], label: "Bắt đầu tổ chức", to: "/create" }].map(({ title, icon: Icon, steps, label, to }) => <div key={title} data-reveal className="dp-panel dp-interactive-card p-6 sm:p-8">
                <div className="mb-5 flex items-center gap-3"><Icon aria-hidden="true" className="size-5 text-dp-live" /><h3 className="text-lg font-semibold">{title}</h3></div>
                <ol className="mb-6 space-y-3">{steps.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-6 text-dp-read"><span className="font-mono text-xs leading-6 text-dp-meta">0{index + 1}</span>{step}</li>)}</ol>
                <Button asChild variant="outline" size="sm"><Link to={to}>{label}<ArrowRight /></Link></Button>
              </div>)}
          </div>
        </div>
      </section>
  </>;
}
