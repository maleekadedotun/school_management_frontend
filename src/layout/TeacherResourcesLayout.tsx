import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import TeacherResourcesSidebar, { navItems } from "./TeacherResourcesSidebar";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import AnnouncementMarquee from "@/components/common/AnnouncementMarquee";
import { useAppSelector } from "../app/hooks";
import {
  FiMenu,
  FiArrowLeft,
  FiChevronRight,
  FiHome,
} from "react-icons/fi";

export default function TeacherResourcesLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const teacher = useAppSelector((state) => state.teacherAuth.teacher);

  // Determine current active page title for header breadcrumb
  const currentNav = navItems.find((item) =>
    item.exact
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path)
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 antialiased w-full overflow-x-clip relative">
      {/* Secondary Resources Sidebar */}
      <TeacherResourcesSidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Workspace Content Area */}
      <div className="flex flex-col lg:ms-72 min-w-0 min-h-screen transition-all duration-300">
        {/* Workspace Top Header Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition"
              aria-label="Open Resources Menu"
            >
              <FiMenu className="w-5 h-5" />
            </button>

            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Link
                to="/teacher/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition font-medium"
              >
                <FiHome className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <FiChevronRight className="hidden sm:inline w-3.5 h-3.5 text-slate-600" />
              <Link
                to="/teacher/resources"
                className="text-slate-400 hover:text-white transition font-medium"
              >
                Teaching Resources
              </Link>
              {currentNav && currentNav.path !== "/teacher/resources" && (
                <>
                  <FiChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span className="font-semibold text-indigo-400 truncate">
                    {currentNav.name}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <Link
              to="/teacher/dashboard"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 transition shadow-xs"
            >
              <FiArrowLeft className="w-3.5 h-3.5" />
              <span>Exit to Main Dashboard</span>
            </Link>

            <ThemeToggleButton />

            {/* Quick Profile Pill */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-xs text-white shadow-xs">
                {(teacher?.name || "T").charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-slate-200 hidden xl:inline truncate max-w-[120px]">
                {teacher?.name || "Teacher"}
              </span>
            </div>
          </div>
        </header>

        {/* Announcement Marquee Bar */}
        <AnnouncementMarquee />

        {/* Dynamic Nested Page Content (Outlet) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
