import { Link, NavLink } from "react-router-dom";
import { ArrowLeft, LayoutDashboard, Plus, Search, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { to: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { to: "/events", label: "Giải đấu của tôi", icon: Trophy },
  { to: "/search", label: "Khám phá giải đấu", icon: Search },
  { to: "/community", label: "Cộng đồng", icon: Users },
];

function SidebarLink({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to} title={label} aria-label={label}
      className={({ isActive }) => cn(
        "relative flex size-11 items-center justify-center rounded-panel border border-transparent text-dp-meta transition-colors hover:bg-dp-bright/5 hover:text-dp-bright",
        isActive && "border-dp-hairline-2 bg-dp-ground text-dp-bright before:absolute before:inset-y-3 before:left-0 before:w-0.5 before:rounded-full before:bg-dp-live",
      )}
    >
      <Icon aria-hidden="true" className="size-5 shrink-0" />
    </NavLink>
  );
}

export default function AppSidebar() {
  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-6 py-5">
      <Link to="/" aria-label="Về website" title="Về website" className="flex size-11 shrink-0 items-center justify-center rounded-panel text-dp-read hover:bg-dp-bright/5 hover:text-dp-bright">
        <ArrowLeft aria-hidden="true" className="size-5" />
      </Link>
      <nav aria-label="Lối tắt không gian quản lý" className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2">
        {PRIMARY_NAV.map((item) => <SidebarLink key={item.to} {...item} />)}
        <div className="mx-auto my-2 h-px w-8 shrink-0 bg-dp-hairline" />
        <Button asChild size="icon" className="mx-auto mt-3">
          <Link to="/create" title="Tạo giải đấu" aria-label="Tạo giải đấu"><Plus /></Link>
        </Button>
      </nav>
    </div>
  );
}
