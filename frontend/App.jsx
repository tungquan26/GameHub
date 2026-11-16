import { lazy, useEffect } from "react";
import { createBrowserRouter, RouterProvider, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import UnsavedChangesProvider from "@/components/shared/UnsavedChangesProvider";
import PlatformLayout from "@/components/layouts/PlatformLayout";
import AuthLayout from "@/components/layouts/AuthLayout";
import TournamentSpaceLayout from "@/components/layouts/TournamentSpaceLayout";
import NavigationExperience from "@/components/shared/NavigationExperience";
import PageTransition from "@/components/shared/PageTransition";
import PageContent from "@/components/shared/PageContent";
import RequireAuth from "@/components/shared/RequireAuth";
import { Button } from "@/components/ui/button";
import { PAGE_ROUTES } from "@/constants/routes";
import { TourneyProvider, useTourney } from "@/context/TourneyContext";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import VerifyPage from "@/pages/auth/VerifyPage";
import ProfilePage from "@/pages/profile/ProfilePage";
import ProfileSettingsPage from "@/pages/profile/ProfileSettingsPage";
const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"));
const LandingPage = lazy(() => import("@/pages/dashboard/LandingPage"));
const SearchPage = lazy(() => import("@/pages/dashboard/SearchPage"));
const EventsPage = lazy(() => import("@/pages/dashboard/EventsPage"));
const CommunityPage = lazy(() => import("@/pages/dashboard/CommunityPage"));
const NewsPage = lazy(() => import("@/pages/dashboard/NewsPage"));
const CreatePage = lazy(() => import("@/pages/dashboard/CreatePage"));
const DetailsPage = lazy(() => import("@/pages/tournament/DetailsPage"));
const RegistrationPage = lazy(() => import("@/pages/tournament/RegistrationPage"));
const TeamsPage = lazy(() => import("@/pages/tournament/TeamsPage"));
const GameInfoPage = lazy(() => import("@/pages/tournament/GameInfoPage"));
const HomePage = lazy(() => import("@/pages/tournament/HomePage"));
const PublicViewPage = lazy(() => import("@/pages/tournament/PublicViewPage"));
const SchedulePage = lazy(() => import("@/pages/tournament/SchedulePage"));

const PAGE_COMPONENTS = {
  "/": LandingPage, "/login": LoginPage, "/register": RegisterPage, "/verify": VerifyPage,
  "/profile": ProfilePage, "/profile/settings": ProfileSettingsPage,
  "/dashboard": DashboardPage, "/search": SearchPage, "/events": EventsPage,
  "/community": CommunityPage, "/news": NewsPage, "/create": CreatePage,
  "/tournament/details": DetailsPage, "/tournament/registration-settings": RegistrationPage,
  "/tournament/teams": TeamsPage, "/tournament/game-info": GameInfoPage,
  "/tournament/home": HomePage, "/tournament/view": PublicViewPage, "/tournament/schedule": SchedulePage,
};

function RedirectTo({ to }) {
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: to, search, hash }} replace />;
}

function StorageNotice() {
  const { storageError } = useTourney();
  return storageError && <p role="status" className="fixed right-4 bottom-4 left-4 z-70 mx-auto max-w-xl rounded-panel border border-dp-hairline-2 bg-dp-panel px-5 py-3 text-sm text-dp-read shadow-xl">{storageError}</p>;
}

export function AppRoutes() {
  const { pathname } = useLocation();
  useEffect(() => {
    const page = PAGE_ROUTES.find((item) => item.path === pathname);
    document.title = `${page?.title || "Không tìm thấy trang"} · BTP Tournament`;
  }, [pathname]);
  const pages = (layout) => PAGE_ROUTES.filter((page) => page.layout === layout).map((page) => {
    const Component = PAGE_COMPONENTS[page.path];
    const content = <PageContent page={page}><Component /></PageContent>;
    return <Route key={page.path} path={page.path} element={<RequireAuth>{content}</RequireAuth>} />;
  });

  return (
    <UnsavedChangesProvider>
      <NavigationExperience>
      <StorageNotice />
      <PageTransition>
        {(displayLocation) => (
          <Routes location={displayLocation}>
            <Route element={<AuthLayout />}>{pages("auth")}</Route>
            <Route element={<PlatformLayout />}>
              {pages("landing")}
              {pages("app")}
              <Route element={<TournamentSpaceLayout />}>{pages("tournament")}{pages("public")}</Route>
              <Route path="*" element={
                <PageContent><div className="dp-container flex min-h-[60vh] flex-col items-start justify-center gap-5 py-10">
                  <span className="font-mono text-sm text-dp-live">404</span>
                  <h1 className="text-3xl font-semibold uppercase">Không tìm thấy trang</h1>
                  <p className="text-dp-read">Đường dẫn bạn truy cập không tồn tại.</p>
                  <Button asChild><Link to="/">Về trang chủ<ArrowRight /></Link></Button>
                </div></PageContent>
              } />
            </Route>
            <Route path="/tournament" element={<RedirectTo to="/tournament/home" />} />
            {["login", "register", "verify"].map((page) => <Route key={page} path={`/auth/${page}`} element={<RedirectTo to={`/${page}`} />} />)}
          </Routes>
        )}
      </PageTransition>
      </NavigationExperience>
    </UnsavedChangesProvider>
  );
}

let browserRouter;
export default function App() {
  // One history listener, including React StrictMode's repeated renders.
  browserRouter ??= createBrowserRouter([{ path: "*", element: <TourneyProvider><AppRoutes /></TourneyProvider> }]);
  return <RouterProvider router={browserRouter} />;
}
