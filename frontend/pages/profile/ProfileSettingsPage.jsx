import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useTourney } from "@/context/TourneyContext";
import { displayProfile } from "@/lib/profile";
import ProfileForm from "./ProfileForm";
import AccountSettings from "./AccountSettings";

export default function ProfileSettingsPage() {
  const { currentUser } = useTourney();
  const profile = displayProfile(currentUser);
  return <div className="dp-container max-w-4xl py-8 lg:py-10">
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-2xl font-semibold tracking-tight uppercase sm:text-3xl">Cài đặt hồ sơ</h1>
      <Link to="/profile" className="flex items-center gap-2 text-sm text-dp-read hover:text-dp-bright">Xem hồ sơ<ArrowUpRight className="size-4" /></Link>
    </div>
    <ProfileForm profile={profile} />
    <AccountSettings profile={profile} />
  </div>;
}
