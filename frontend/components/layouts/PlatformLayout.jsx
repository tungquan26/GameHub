import { Outlet, useLocation } from "react-router-dom";
import PlatformHeader from "@/components/shared/PlatformHeader";
import PlatformFooter from "@/components/shared/PlatformFooter";
import { isManagementRoute } from "@/lib/navigation";

export default function PlatformLayout({ children }) {
  const location = useLocation();
  return <div className="flex min-h-screen flex-col bg-dp-ground text-dp-bright">
    <a href="#main-content" className="skip-link">Đến nội dung chính</a>
    <PlatformHeader />
    <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 outline-none">{children ?? <Outlet />}</main>
    {!isManagementRoute(location) && <PlatformFooter />}
  </div>;
}
