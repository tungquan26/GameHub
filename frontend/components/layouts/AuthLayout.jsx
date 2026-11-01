import { Outlet } from "react-router-dom";
import PlatformHeader from "@/components/shared/PlatformHeader";

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-dp-ground">
      <a href="#main-content" className="skip-link">Đến nội dung chính</a>
      <PlatformHeader auth />
      <main id="main-content" tabIndex={-1} className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 py-12 outline-none">
        <Outlet />
      </main>
      <footer className="px-6 pb-6 text-center font-mono text-[11px] tracking-widest text-dp-meta">BTP TOURNAMENT · TOURNEY PRO</footer>
    </div>
  );
}
