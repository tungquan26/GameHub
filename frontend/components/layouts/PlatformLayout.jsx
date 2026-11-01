import { NavLink, Outlet, useLocation } from "react-router-dom";
import PlatformHeader from "@/components/shared/PlatformHeader";
import PlatformFooter from "@/components/shared/PlatformFooter";
import { cn } from "@/lib/utils";
import { isManagementRoute } from "@/lib/navigation";
import { useTourney } from "@/context/TourneyContext";
import { userKey } from "@/lib/identity";

export default function PlatformLayout({ children }) {
  const location = useLocation();
  const { pathname } = location;
  const { currentUser } = useTourney();
  const personal = Boolean(userKey(currentUser)) && ["/dashboard", "/events"].includes(pathname);
  return <div className="flex min-h-screen flex-col bg-dp-ground text-dp-bright">
    <a href="#main-content" className="skip-link">Đến nội dung chính</a>
    <PlatformHeader />
    {personal && <div className="shrink-0 border-b border-dp-hairline bg-dp-panel/60">
      <div className="dp-container flex flex-wrap items-center gap-x-8 gap-y-1">
        <p className="py-3 text-xs font-medium text-dp-meta">Không gian của tôi</p>
        <nav aria-label="Không gian cá nhân" className="flex gap-6">
          {[{ to: "/dashboard", label: "Tổng quan" }, { to: "/events", label: "Giải đấu của tôi" }].map(({ to, label }) => <NavLink key={to} to={to} className={({ isActive }) => cn("border-b-2 border-transparent py-4 text-xs font-medium text-dp-read transition-colors hover:text-dp-bright", isActive && "border-dp-live text-dp-bright")}>{label}</NavLink>)}
        </nav>
      </div>
    </div>}
    <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 outline-none">{children ?? <Outlet />}</main>
    {!isManagementRoute(location) && <PlatformFooter />}
  </div>;
}
