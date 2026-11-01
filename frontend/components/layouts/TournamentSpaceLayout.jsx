import { lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import AppLayout from "./AppLayout";
import TournamentLayout from "./TournamentLayout";
import RequireAuth from "@/components/shared/RequireAuth";
import { isManagementRoute } from "@/lib/navigation";
import { TournamentViewSkeleton } from "@/components/shared/PageSkeleton";

const TournamentPublicLayout = lazy(() => import("./TournamentPublicLayout"));

export default function TournamentSpaceLayout() {
  const location = useLocation();
  if (isManagementRoute(location)) return <RequireAuth><AppLayout><TournamentLayout /></AppLayout></RequireAuth>;
  return <Suspense fallback={<div data-layout-pending className="dp-container py-6 sm:py-8"><TournamentViewSkeleton /></div>}><TournamentPublicLayout /></Suspense>;
}
