import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ExternalLink, LayoutDashboard, LogOut, Settings, Trophy, User } from "lucide-react";
import { useTourney } from "@/context/TourneyContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { pageViewKey } from "@/lib/page-navigation";

export default function AccountMenu({ expanded = false, side = "bottom", onNavigate }) {
  const { currentUser, clearProfile } = useTourney();
  const navigate = useNavigate();
  const location = useLocation(); const origin = useRef(pageViewKey(location));
  const leaving = useRef(false);
  useEffect(() => {
    if (location.pathname === "/" && location.state?.signOut) {
      clearProfile(); navigate("/", { replace: true, state: null });
    }
  }, [location.pathname, location.state, clearProfile, navigate]);
  const name = currentUser?.gamerTag || currentUser?.tagName || currentUser?.username || "Tài khoản";
  const go = (path, options) => { leaving.current = pageViewKey(new URL(path, window.location.origin)) !== pageViewKey(location); onNavigate?.(path); navigate(path, options); };
  return <DropdownMenu onOpenChange={(open) => { if (open) { origin.current = pageViewKey(location); leaving.current = false; } }}>
    <DropdownMenuTrigger asChild>
      <button type="button" title="Tài khoản" aria-label="Tài khoản"
        className={cn("flex min-w-0 items-center gap-3 rounded-pill border border-dp-hairline-2 bg-dp-panel p-1 text-left transition-colors hover:border-dp-read", expanded ? "w-full" : "size-10 justify-center")}>
        <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full font-mono text-xs">
          {currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} alt="" className="size-full object-cover" /> : <User aria-hidden="true" className="size-4" />}
        </span>
        {expanded && <span className="truncate pr-3 text-sm">{name}</span>}
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent side={side} align="end" className="w-64" onCloseAutoFocus={(event) => { if (leaving.current || origin.current !== pageViewKey(location)) event.preventDefault(); }}>
      <DropdownMenuLabel className="px-3 py-2"><p className="truncate text-sm font-medium">{name}</p>
        {currentUser?.userCode && <p className="mt-1 font-mono text-xs text-dp-meta">{currentUser.userCode}</p>}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => go("/dashboard")}><LayoutDashboard />Tổng quan</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => go("/events")}><Trophy />Giải đấu của tôi</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => go("/profile")}><ExternalLink />Xem hồ sơ công khai</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => go("/profile/settings?tab=profile")}><User />Cài đặt hồ sơ</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => go("/profile/settings?tab=account")}><Settings />Cài đặt tài khoản</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => go("/", { state: { signOut: true } })}><LogOut />Đăng xuất</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}
