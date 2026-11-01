import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Settings, User } from "lucide-react";
import { useTourney } from "@/context/TourneyContext";
import { displayProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";
import ProfileForm from "./ProfileForm";
import AccountSettings from "./AccountSettings";

export default function ProfileSettingsPage() {
  const { currentUser } = useTourney();
  const profile = displayProfile(currentUser);
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "account" ? "account" : "profile";
  function changeTab(next) { setParams((previous) => { const result = new URLSearchParams(previous); result.set("tab", next); return result; }, { replace: true }); }
  return <div className="min-h-screen lg:flex">
    <aside className="shrink-0 border-b border-dp-hairline bg-dp-panel p-5 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:border-r lg:border-b-0">
      <Link to="/profile" className="mb-6 flex items-center gap-3 rounded-panel border border-dp-hairline p-3">
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-dp-ground font-mono">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="size-full object-cover" /> : profile.tagName.charAt(0).toUpperCase()}</span>
        <span className="min-w-0"><strong className="block truncate text-sm font-medium">{profile.tagName}</strong><span className="mt-1 flex items-center gap-1 text-[11px] text-dp-read">Xem hồ sơ<ArrowUpRight className="size-3" /></span></span>
      </Link>
      <nav aria-label="Cài đặt cá nhân" className="flex gap-2 lg:flex-col">
        {[{ value: "profile", label: "Cài đặt hồ sơ", icon: User }, { value: "account", label: "Cài đặt tài khoản", icon: Settings }].map(({ value, label, icon: Icon }) => (
          <button key={value} type="button" aria-current={tab === value ? "page" : undefined} onClick={() => changeTab(value)}
            className={cn("flex items-center gap-3 rounded-panel border border-transparent px-3 py-3 text-left text-xs text-dp-read hover:text-dp-bright", tab === value && "border-dp-hairline-2 bg-dp-ground text-dp-bright")}>
            <Icon className={cn("size-4 shrink-0", tab === value && "text-dp-live")} />{label}
          </button>
        ))}
      </nav>
    </aside>
    <div className="dp-container min-w-0 max-w-4xl py-8 lg:py-10">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight uppercase sm:text-3xl">{tab === "account" ? "Cài đặt tài khoản" : "Cài đặt hồ sơ"}</h1>
      <div hidden={tab !== "profile"}><ProfileForm profile={profile} /></div>
      <div hidden={tab !== "account"}><AccountSettings profile={profile} /></div>
    </div>
  </div>;
}
