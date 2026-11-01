import { CalendarDays, Mail, MapPin, MessageCircle, Phone, Trophy } from "lucide-react";
import { detailsValues } from "@/lib/tournament-settings";
import { Gamepad2 } from "lucide-react";
import { dateRange } from "@/lib/profile";
import { safeWebUrl } from "@/lib/homepage";
import { gameImage, gameLabel } from "@/lib/games";
import { TournamentCover } from "./GameArtwork";

export function ContactLink({ entry, compact = false }) {
  const { contactType, contact } = detailsValues(entry);
  const Icon = contactType === "PHONE" ? Phone : contactType === "DISCORD" ? MessageCircle : Mail;
  const label = contactType === "PHONE" ? "Số điện thoại" : contactType === "DISCORD" ? "Discord" : "Email";
  const href = !contact ? "" : contactType === "EMAIL" ? `mailto:${encodeURIComponent(contact)}` : contactType === "PHONE" ? `tel:${encodeURIComponent(contact)}` : safeWebUrl(contact);
  const content = <><Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-dp-meta" /><span className="min-w-0 break-words">{compact ? contact || "Chưa cập nhật liên hệ" : <><span className="block text-xs text-dp-meta">{label}</span><span className="mt-1 block">{contact || "Chưa cập nhật liên hệ"}</span></>}</span></>;
  return href ? <a href={href} target={contactType === "DISCORD" ? "_blank" : undefined} rel={contactType === "DISCORD" ? "noopener noreferrer" : undefined} className="flex items-start gap-3 text-xs leading-6 text-dp-read hover:text-dp-bright">{content}</a>
    : <p className="flex items-start gap-3 text-xs leading-6 text-dp-read">{content}</p>;
}
const STATUS_LABELS = { OPEN_REGISTRATION: "Đang mở đăng ký", REGISTRATION_NOT_STARTED: "Chưa mở đăng ký", REGISTRATION_CLOSED: "Đã đóng đăng ký", IN_PROGRESS: "Đang diễn ra", COMPLETED: "Đã kết thúc", CANCELLED: "Đã hủy" };
export default function TournamentHero({ entry, headingLevel = 2, status, actions }) {
  const values = detailsValues(entry); const Heading = `h${headingLevel}`;
  const game = entry.gameInfo?.game || entry.game;
  const banner = safeWebUrl(entry.bannerImg || entry.image || gameImage(game), { image: true });
  const profile = safeWebUrl(entry.profileImg || entry.image || gameImage(game), { image: true });
  return <section aria-label="Thông tin tổng quan giải đấu" className="dp-panel mb-9 overflow-hidden">
    <div className="relative flex h-40 items-center justify-center border-b border-dp-hairline bg-dp-ground sm:h-56">
      {banner ? <TournamentCover src={banner} game={game} alt="Ảnh bìa giải đấu" className="size-full" loading="eager" /> : <Trophy aria-hidden="true" className="size-14 text-dp-hairline-2" />}
    </div>
    <div className="relative px-5 pt-6 pb-7 sm:px-7">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="-mt-14 flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-panel border border-dp-hairline-2 bg-dp-panel font-mono text-2xl sm:size-24">
          {profile ? <TournamentCover src={profile} game={game} alt="Ảnh đại diện giải đấu" className="size-full" /> : values.name.charAt(0).toUpperCase() || "G"}
        </span>
        <div className="min-w-0 flex-1"><Heading className={`text-2xl leading-tight font-semibold break-words tracking-tight sm:text-3xl${headingLevel === 1 ? " uppercase" : ""}`}>{values.name || "Giải đấu mới"}</Heading></div>
        {status && <span className="self-start rounded-pill border border-dp-live/30 px-3 py-1 text-[10px] leading-5 text-dp-live sm:self-center">{STATUS_LABELS[status] || "Chưa cập nhật"}</span>}
      </div>
      <div className="grid gap-3 text-xs leading-6 text-dp-read xl:grid-cols-2">
        <p className="flex items-start gap-3 font-mono text-[11px]"><CalendarDays aria-hidden="true" className="mt-1 size-4 shrink-0 text-dp-meta" /><span>{dateRange(values.startDate, values.endDate)}</span></p>
        <p className="flex items-start gap-3"><MapPin aria-hidden="true" className="mt-1 size-4 shrink-0 text-dp-meta" /><span className="min-w-0 break-words">{values.venueAddress || entry.location || "Chưa cập nhật địa điểm"}</span></p>
        <ContactLink entry={entry} compact />
        {status && <p className="flex items-start gap-3"><Gamepad2 aria-hidden="true" className="mt-1 size-4 shrink-0 text-dp-meta" />{gameLabel(game) || "Chưa chọn tựa game"}</p>}
      </div>
      {actions && <div className="mt-5 border-t border-dp-hairline pt-5">{actions}</div>}
    </div>
  </section>;
}
