import { Outlet, useLocation } from "react-router-dom";
import AppSidebar from "@/components/shared/AppSidebar";
import { isManagementRoute } from "@/lib/navigation";

export default function AppLayout({ children }) {
  const location = useLocation();
  // Lịch công khai không sử dụng thanh công cụ của không gian quản lý.
  if (!isManagementRoute(location)) return children ?? <Outlet />;

  return (
    <div className="min-h-[calc(100dvh-var(--dp-header-height))] bg-dp-ground text-dp-bright">
      <aside aria-label="Thanh điều hướng không gian quản lý" className="fixed top-[var(--dp-header-height)] bottom-0 left-0 z-30 hidden w-[72px] border-r border-dp-hairline bg-dp-panel md:block">
        <AppSidebar />
      </aside>
      <div className="min-w-0 md:pl-[72px]">
        {children ?? <Outlet />}
      </div>
    </div>
  );
}
