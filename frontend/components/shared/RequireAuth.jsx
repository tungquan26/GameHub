import { Navigate, Outlet, useLocation } from "react-router-dom";
import useRequireAuth from "@/hooks/useRequireAuth";
import { loginPath, requiresAuthentication } from "@/lib/navigation";

export default function RequireAuth({ children }) {
  const location = useLocation();
  const { authenticated } = useRequireAuth();
  if (!authenticated && requiresAuthentication(location)) return <Navigate to={loginPath(location)} replace />;
  return children ?? <Outlet />;
}
