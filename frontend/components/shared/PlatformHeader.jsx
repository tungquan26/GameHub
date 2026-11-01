import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, Compass, LayoutDashboard, Menu, Newspaper, Trophy, Users } from "lucide-react";
import { useTourney } from "@/context/TourneyContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import AccountMenu from "./AccountMenu";
import { loginPath, requiresAuthentication, returnToFrom } from "@/lib/navigation";
import { userKey } from "@/lib/identity";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { pageViewKey } from "@/lib/page-navigation";
import useNavIndicator from "@/hooks/useNavIndicator";
import logo from "@/assets/logo_bieutuong.png";

const LINKS = [
  { to: "/search", label: "Khám phá giải đấu", icon: Compass },
  { to: "/community", label: "Cộng đồng", icon: Users },
  { to: "/news", label: "Tin tức", icon: Newspaper },
];

function Navigation({ mobile = false, onNavigate }) {
  const { pathname } = useLocation();
  const indicator = useNavIndicator(pathname, mobile);
  return <nav ref={indicator} aria-label={mobile ? "Điều hướng mobile" : "Điều hướng chính"} className={mobile ? "flex flex-col items-start gap-4" : "relative hidden items-center gap-6 lg:flex"}>
    {LINKS.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => onNavigate?.(to)}
      className={({ isActive }) => cn("flex items-center gap-2 border-b-2 border-transparent py-2.5 text-[13px] font-semibold whitespace-nowrap uppercase text-dp-read transition-colors hover:text-dp-bright", mobile && "py-3", isActive && "text-dp-bright", isActive && mobile && "border-dp-live")}>
      <Icon aria-hidden="true" className={cn("size-4 shrink-0", !mobile && "hidden xl:block")} />{label}
    </NavLink>)}
    {!mobile && <span data-nav-indicator aria-hidden="true" className="nav-indicator" />}
  </nav>;
}

export default function PlatformHeader({ auth = false }) {
  const location = useLocation();
  const { currentUser } = useTourney();
  const authenticated = Boolean(userKey(currentUser));
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(() => window.scrollY > 8);
  const home = !auth && location.pathname === "/";
  const menuOrigin = useRef(pageViewKey(location));
  const menuLeaving = useRef(false);
  const closeMenu = (path) => {
    menuLeaving.current = typeof path === "string" ? pageViewKey(new URL(path, window.location.origin)) !== pageViewKey(location) : true;
    setMenuOpen(false);
  };
  const destination = returnToFrom(location);
  const returnTo = requiresAuthentication(destination) ? "/" : destination;
  const personal = ["/dashboard", "/events"].includes(location.pathname);
  useEffect(() => { setMenuOpen(false); }, [location.pathname, location.search, location.hash]);
  useEffect(() => {
    if (!home) return;
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [home]);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = (event) => { if (event.matches) setMenuOpen(false); };
    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, []);

  return <header aria-label="BTP Tournament" data-platform-header data-home={home} data-transparent={home && !scrolled && !menuOpen} className="platform-header sticky top-0 z-40 shrink-0 border-b border-dp-hairline bg-dp-ground/95 backdrop-blur-md">
    <div className="dp-container flex h-[var(--dp-header-height)] items-center gap-3 sm:gap-5 lg:gap-8">
      <Link to="/" aria-label="Trang chủ BTP Tournament" className="flex min-w-0 shrink-0 items-center gap-2.5" onClick={closeMenu}>
        <img src={logo} alt="" className="size-8 shrink-0 object-contain" />
        <span className="hidden text-xs font-semibold tracking-[0.12em] min-[360px]:inline sm:text-sm">TOURNEY PRO</span>
      </Link>
      {!auth && <Navigation />}
      <div className="platform-header-actions ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        {auth ? <Button asChild variant="ghost" size="sm"><Link to={returnTo}><ArrowLeft />{returnTo === "/" ? "Về trang chủ" : "Quay lại"}</Link></Button>
          : <>
            {authenticated ? <>
              <NavLink to="/dashboard" aria-label="Không gian của tôi" className={cn("flex h-10 items-center gap-2 rounded-pill border border-dp-hairline-2 px-3 text-xs font-semibold text-dp-read transition-colors hover:border-dp-read hover:text-dp-bright", personal && "border-dp-live/40 text-dp-bright")}>
                <LayoutDashboard aria-hidden="true" className="size-4" /><span className="hidden lg:inline">Không gian của tôi</span>
              </NavLink>
              <AccountMenu />
            </> : <Button asChild variant="outline" size="sm" className="uppercase"><Link to={loginPath(location)}>Đăng nhập<ArrowRight /></Link></Button>}
            <Sheet open={menuOpen} onOpenChange={(open) => { if (open) { menuOrigin.current = pageViewKey(location); menuLeaving.current = false; } setMenuOpen(open); }}>
              <SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Mở menu"><Menu /></Button></SheetTrigger>
              <SheetContent className="overflow-y-auto" onCloseAutoFocus={(event) => { if (menuLeaving.current || menuOrigin.current !== pageViewKey(location)) event.preventDefault(); }}>
                <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
                <p aria-hidden="true" className="pr-10 text-sm font-semibold tracking-widest">TOURNEY PRO</p>
                <SheetDescription className="mt-2 text-xs leading-6 text-dp-read">Khám phá giải đấu và kết nối cộng đồng.</SheetDescription>
                <div className="mt-7"><Navigation mobile onNavigate={closeMenu} /></div>
                <div className="mt-auto space-y-4 border-t border-dp-hairline pt-5">
                  {authenticated ? <>
                    <nav aria-label="Không gian cá nhân mobile" className="grid gap-1">
                      {[{ to: "/dashboard", label: "Tổng quan", icon: LayoutDashboard }, { to: "/events", label: "Giải đấu của tôi", icon: Trophy }].map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => closeMenu(to)} className={({ isActive }) => cn("flex items-center gap-3 rounded-panel px-4 py-3 text-sm text-dp-read", isActive && "bg-dp-ground text-dp-bright")}><Icon aria-hidden="true" className="size-4" />{label}</NavLink>)}
                    </nav>
                    <AccountMenu expanded side="top" onNavigate={closeMenu} />
                  </> : <Button asChild className="w-full uppercase"><Link to={loginPath(location)} onClick={closeMenu}>Đăng nhập<ArrowRight /></Link></Button>}
                </div>
              </SheetContent>
            </Sheet>
          </>}
      </div>
    </div>
  </header>;
}
