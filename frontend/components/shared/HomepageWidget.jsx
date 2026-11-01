import { useState } from "react";
import { Copy, Gamepad2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRACKET_FORMATS } from "@/constants/games";
import { gameImage, gameLabel } from "@/lib/games";
import GameArtwork from "./GameArtwork";
import { canonicalGame } from "@/lib/tournaments";
import { detailsValues } from "@/lib/tournament-settings";
import { hasCoordinates } from "@/lib/geocoder";
import { formatMatchTime } from "@/lib/bracket";
import { localizeTitle, safeWebUrl } from "@/lib/homepage";
import { cn } from "@/lib/utils";
import { ContactLink } from "./TournamentHero";
import MarkdownRenderer from "./MarkdownRenderer";
import ImageWithFallback from "./ImageWithFallback";

function LocationWidget({ entry }) {
  const [notice, setNotice] = useState("");
  const details = detailsValues(entry);
  const address = details.venueAddress || entry.location || "";
  const query = hasCoordinates(details.venueLat, details.venueLon) ? `${details.venueLat},${details.venueLon}` : address;
  async function copy() {
    try { await navigator.clipboard.writeText(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`); setNotice("Đã sao chép liên kết địa điểm vào bộ nhớ tạm."); }
    catch { setNotice("Không thể sao chép liên kết. Vui lòng thử lại hoặc dùng nút Chỉ đường."); }
  }
  return <div className="space-y-4">
    <p className="text-sm leading-7 text-dp-read">{address || "Chưa cập nhật địa điểm (Vui lòng nhập tại mục Chi tiết)"}</p>
    {query && <><div className="flex flex-wrap gap-2"><Button asChild size="sm" variant="outline"><a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`} target="_blank" rel="noopener noreferrer"><Navigation />Chỉ đường</a></Button><Button size="sm" variant="ghost" onClick={copy}><Copy />Sao chép liên kết</Button></div>
      <iframe title="Bản đồ địa điểm giải đấu" src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&ie=UTF8&iwloc=&output=embed`} loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" className="h-56 w-full rounded-panel border border-dp-hairline" /></>}
    {notice && <p role="status" className="text-xs leading-6 text-dp-read">{notice}</p>}
  </div>;
}
function RulesWidget({ value }) {
  const [expanded, setExpanded] = useState(false);
  return <><div className={cn("overflow-hidden", !expanded && "max-h-64")}><MarkdownRenderer value={value} /></div>
    {value?.trim() && <Button size="sm" variant="ghost" className="mt-4" aria-expanded={expanded} onClick={() => setExpanded((current) => !current)}>{expanded ? "Thu gọn" : "Xem thêm"}</Button>}</>;
}
function WidgetContent({ widget, entry }) {
  if (widget.type === "MARKDOWN") return widget.content?.trim() ? <MarkdownRenderer value={widget.content} /> : <p className="text-sm text-dp-meta">(Chưa cập nhật nội dung)</p>;
  if (widget.type === "IMAGE") {
    const src = safeWebUrl(widget.imageUrl, { image: true }); const href = safeWebUrl(widget.linkUrl);
    if (!src) return <p className="text-sm leading-7 text-dp-meta">Chưa có ảnh — Tải ảnh lên hoặc dán URL ảnh trong chế độ chỉnh sửa.</p>;
    const picture = <ImageWithFallback src={src} alt={widget.caption || widget.title || "Hình ảnh giải đấu"} loading="lazy" className="max-h-[600px] w-full rounded-panel object-contain" />;
    return <figure>{href ? <a href={href} target="_blank" rel="noopener noreferrer">{picture}</a> : picture}{widget.caption && <figcaption className="mt-3 text-center text-xs leading-6 text-dp-read">{widget.caption}</figcaption>}</figure>;
  }
  if (widget.type === "GAME_INFO") {
    const game = canonicalGame(entry.gameInfo?.game || entry.game || "");
    const image = gameImage(game);
    const format = BRACKET_FORMATS.find((item) => item.value === (entry.gameInfo?.format || entry.format))?.label || "Loại trực tiếp";
    return <div className="flex items-center gap-5">
      {image ? <GameArtwork game={game} alt="Ảnh bộ môn" className="h-32 w-24 shrink-0 rounded-panel" /> : <Gamepad2 aria-hidden="true" className="size-9 shrink-0 text-dp-meta" />}
      <div className="min-w-0 space-y-3"><p className="text-sm leading-6 font-medium break-words">{gameLabel(game) || "Chưa chọn tựa game"}</p><p className="text-xs leading-6 text-dp-read">{format} · {entry.gameInfo?.stageType === "TWO_STAGE" ? "2 giai đoạn" : "1 giai đoạn"}</p><p className="flex items-start gap-2 font-mono text-[10px] leading-5 text-dp-meta"><span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-dp-live" />{formatMatchTime(entry.startDate || entry.details?.startDate)}</p></div>
    </div>;
  }
  if (widget.type === "LOCATION") return <LocationWidget entry={entry} />;
  if (widget.type === "CONTACT") return <ContactLink entry={entry} />;
  if (widget.type === "RULES") return <RulesWidget value={entry.rules || ""} />;
  return null;
}
export default function HomepageWidget({ widget, entry }) {
  return <div className="min-w-0 space-y-3">
    {widget.title && <h3 className="text-sm font-semibold break-words">{localizeTitle(widget.title)}</h3>}
    <div className="dp-panel min-w-0 overflow-hidden p-5 sm:p-6"><WidgetContent widget={widget} entry={entry} /></div>
  </div>;
}
