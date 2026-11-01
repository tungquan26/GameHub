import { useLocation, useNavigate } from "react-router-dom";
import { useTourney } from "@/context/TourneyContext";
import { userKey } from "@/lib/identity";
import { loginPath } from "@/lib/navigation";

export default function useRequireAuth() {
  const { currentUser } = useTourney();
  const location = useLocation();
  const navigate = useNavigate();
  const authenticated = Boolean(userKey(currentUser));
  function requireAuth(destination = location) {
    if (authenticated) return true;
    navigate(loginPath(destination));
    return false;
  }
  return { authenticated, requireAuth };
}
