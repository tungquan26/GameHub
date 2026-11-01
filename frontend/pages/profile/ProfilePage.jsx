import { Link, useSearchParams } from "react-router-dom";
import { Calendar, MapPin, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileTournamentList from "@/components/shared/ProfileTournamentList";
import { useTourney } from "@/context/TourneyContext";
import { DEMO_PROFILE, displayProfile, EMPTY_PROFILE, userCodeFor } from "@/lib/profile";
import usePersonalActivity from "@/hooks/usePersonalActivity";

export default function ProfilePage() {
  const { currentUser } = useTourney();
  const [params] = useSearchParams();
  const ownProfile = displayProfile(currentUser);
  const viewTag = params.get("user")?.trim();
  const own = !viewTag || viewTag.toLowerCase() === ownProfile.tagName.toLowerCase();
  const { organized, participating, loading } = usePersonalActivity({ loadTournaments: own });
  const profile = own ? ownProfile : {
    ...EMPTY_PROFILE, tagName: viewTag, userCode: userCodeFor(viewTag),
    joinedDate: DEMO_PROFILE.joinedDate, bio: `Tuyển thủ BTP Esports · @${viewTag}`,
    displayCityMode: "Chỉ hiển thị quốc gia",
  };
  const location = [(["Hiển thị thành phố", "Display city"].includes(profile.displayCityMode) ? profile.city.trim() : ""), profile.country].filter(Boolean).join(", ");
  return <div>
    <div className="profile-banner h-36 border-b border-dp-hairline sm:h-48" style={profile.bannerUrl ? { backgroundImage: `linear-gradient(color-mix(in srgb, var(--dp-color-ground) 40%, transparent),color-mix(in srgb, var(--dp-color-ground) 67%, transparent)),url("${profile.bannerUrl}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} />
    <header className="border-b border-dp-hairline bg-dp-panel">
      <div className="dp-container flex flex-wrap items-start justify-between gap-5 pb-8">
        <div className="flex max-w-full flex-col gap-5 sm:flex-row sm:items-end">
          <span className="-mt-10 flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-dp-ground bg-dp-panel font-mono text-3xl sm:size-28">
            {profile.avatarUrl ? <img src={profile.avatarUrl} alt={`Ảnh đại diện ${profile.tagName}`} className="size-full object-cover" /> : profile.tagName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 sm:pt-5">
            <div className="flex flex-wrap items-center gap-3">
              {profile.prefix && <span className="text-sm text-dp-meta">{profile.prefix}</span>}
              <h1 className="break-all text-2xl font-semibold tracking-tight uppercase">{profile.tagName}</h1>
              <span className="font-mono text-xs text-dp-meta">{profile.userCode}</span>
              {profile.displayPronouns && profile.pronouns.trim() && <span className="rounded-pill border border-dp-hairline-2 px-2.5 py-1 text-[10px] text-dp-read">{profile.pronouns}</span>}
            </div>
            {profile.bio.trim() && <p className="mt-3 max-w-xl text-sm leading-6 text-dp-read">{profile.bio}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-dp-meta">
              {profile.joinedDate && <span className="flex items-center gap-2 font-mono"><Calendar className="size-3.5" />{profile.joinedDate}</span>}
              {location && <span className="flex items-center gap-2"><MapPin className="size-3.5" />{location}</span>}
              {!own && <span className="font-mono text-[10px] text-dp-meta">HỒ SƠ XEM TRƯỚC</span>}
            </div>
          </div>
        </div>
        {own && <Button asChild variant="outline" size="icon" className="mt-5"><Link to="/profile/settings?tab=profile" title="Cài đặt hồ sơ" aria-label="Cài đặt hồ sơ"><MoreVertical /></Link></Button>}
      </div>
    </header>
    <div className="dp-container grid gap-6 py-8 xl:grid-cols-2">
      <ProfileTournamentList key={own ? "own-upcoming" : viewTag + "-upcoming"} title="GIẢI ĐẤU THAM GIA" items={own ? participating : []} own={own} loading={own && loading} />
      <ProfileTournamentList key={own ? "own-organized" : viewTag + "-organized"} title="GIẢI ĐẤU ĐÃ TỔ CHỨC" items={own ? organized : []} own={own} organized loading={own && loading} />
    </div>
  </div>;
}
