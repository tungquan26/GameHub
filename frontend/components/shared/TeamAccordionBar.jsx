import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasRequest, isCaptain, isLegacyTeam, isMember, isTeamFull } from "@/lib/teams";
import { useTourney } from "@/context/TourneyContext";
import { userKey } from "@/lib/identity";
import { cn } from "@/lib/utils";
import { gameLabel } from "@/lib/games";
import { pendingTeamRequests } from "@/lib/personal-activity";

export default function TeamAccordionBar({ team, actor, onAction, onEdit, highlighted = false }) {
  const { games } = useTourney();
  const full = isTeamFull(team, games);
  const [expanded, setExpanded] = useState(highlighted);
  useEffect(() => { if (highlighted) setExpanded(true); }, [highlighted]);
  const membersId = useId();
  const captain = isCaptain(team, actor);
  const member = isMember(team, actor);
  const requested = hasRequest(team, actor);
  const requests = pendingTeamRequests(team);
  const members = Object.entries(team.memberIdentities || {});
  const unidentifiedRequests = [...team.pendingRequests];
  for (const [, name] of requests) { const index = unidentifiedRequests.indexOf(name); if (index >= 0) unidentifiedRequests.splice(index, 1); }
  return <article aria-label={team.name} data-team-id={String(team.id)} tabIndex={highlighted ? -1 : undefined} className={cn("dp-panel scroll-mt-24 outline-none", highlighted && "ring-1 ring-dp-live/40")}>
    <div className="flex flex-wrap items-center justify-between gap-4 p-5">
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-panel border border-dp-hairline-2 bg-dp-ground font-mono text-xs">
          {team.logo ? <img src={team.logo} alt="" className="size-full object-cover" /> : team.name.slice(0, 3).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h3 className="break-words text-sm font-semibold">{team.name}</h3>
          <p className="mt-1 text-xs text-dp-meta">{gameLabel(team.game) || "Chưa chọn tựa game"}</p>
          {member && <span className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] text-dp-live">{captain && <Crown className="size-3" />}{captain ? "Đội trưởng" : "Thành viên"}</span>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {isLegacyTeam(team) ? <span className="text-xs text-dp-meta">Chỉ xem</span> : captain ? <><Button size="sm" variant="outline" onClick={(event) => onEdit(team, event.currentTarget)}>Chỉnh sửa Team</Button><Button size="sm" variant="ghost" className="text-red-400" onClick={() => onAction({ type: "dissolve", id: team.id })}>Giải tán</Button></>
          : member ? <Button size="sm" variant="ghost" className="text-red-400" onClick={() => onAction({ type: "leave", id: team.id })}>Rời đội</Button>
            : requested ? <Button size="sm" variant="outline" onClick={() => onAction({ type: "cancel", id: team.id })}>Đang chờ duyệt (Hủy)</Button>
              : team.recruiting && !full ? <Button size="sm" onClick={() => onAction({ type: "join", id: team.id })}>Xin vào đội</Button>
                : <span className="text-xs text-dp-meta">{full ? "Đội đã đủ người" : "Đội đã dừng tuyển"}</span>}
        <Button size="sm" variant="ghost" aria-expanded={expanded} aria-controls={membersId} onClick={() => setExpanded((value) => !value)}>
          Thành viên ({team.members.length})<ChevronDown className={cn("transition-transform", expanded && "rotate-180")} />
        </Button>
        {captain && requests.length > 0 && <span className="font-mono text-[10px] text-dp-live">{requests.length} chờ duyệt</span>}
      </div>
    </div>
    <div id={membersId} hidden={!expanded} className="border-t border-dp-hairline">
      <div className="grid gap-x-8 px-5 py-3 sm:grid-cols-2">
        {members.length ? members.map(([key, name]) => {
          const id = /^id:([1-9]\d*)$/.exec(key)?.[1];
          return <div key={key} className="flex items-center justify-between gap-3 py-2 text-xs">
            {id ? <Link to={`/profile?id=${id}`} className={cn("break-all hover:text-dp-live", key === userKey(actor) ? "text-dp-bright" : "text-dp-read")}>@{name}</Link>
              : <span className="break-all text-dp-read">@{name}</span>}
            {key === team.captainKey && <span className="shrink-0 text-[10px] text-dp-meta">Đội trưởng</span>}
          </div>;
        }) : team.members.map((name, index) => <span key={index} className="break-all py-2 text-xs text-dp-read">@{name}</span>)}
      </div>
      {captain && team.pendingRequests.length > 0 && <div className="border-t border-dp-hairline px-5 py-3">
        {requests.map(([applicantKey, applicant]) => <div key={applicantKey} className="flex flex-wrap items-center justify-between gap-3 py-2">
          <span className="break-all text-xs text-dp-read">@{applicant} xin gia nhập</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={full} aria-label={`Đồng ý ${applicant}`} onClick={() => onAction({ type: "accept", id: team.id, applicant, applicantKey })}><Check />Đồng ý</Button>
            <Button size="sm" variant="ghost" aria-label={`Từ chối ${applicant}`} onClick={() => onAction({ type: "reject", id: team.id, applicant, applicantKey })}><X />Từ chối</Button>
          </div>
        </div>)}
        {unidentifiedRequests.map((applicant, index) => <p key={index} className="py-2 text-xs text-dp-meta">@{applicant} · Yêu cầu cũ, chỉ xem</p>)}
      </div>}
    </div>
  </article>;
}
