"use client";

import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import NotificationDropdown from "@/components/header/NotificationDropdown";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebar } from "@/context/SidebarContext";
// import { cn } from "@/utils";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const AppHeader: React.FC = () => {
  const { t } = useTranslation("header");
  const inputRef = useRef<HTMLInputElement>(null);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (window.innerWidth >= 1280) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 flex w-full border-b border-white/10 bg-[#0a0f1e]/90 backdrop-blur-md">
      <div className="flex grow items-center justify-between px-4 py-3 xl:px-6">
        {/* Left Section: Sidebar Toggle & Mobile Logo */}
        <div className="flex items-center gap-3">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            onClick={handleToggle}
            aria-label={t("toggleSidebar")}
          >
            {isMobileOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            )}
          </button>

          {/* Mobile Logo */}
          <Link to="/admin/dashboard" className="xl:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs">
              S
            </div>
            <span className="text-base font-bold text-white tracking-wide">
              School<span className="text-indigo-400">MS</span>
            </span>
          </Link>
        </div>

        {/* Center Search Bar */}
        <div className="hidden md:block flex-1 max-w-md mx-6">
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search students, teachers, exams (Press ⌘K)..."
                className="h-10 w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-14 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-white/10 bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-400 font-mono">
                ⌘K
              </span>
            </div>
          </form>
        </div>

        {/* Right Section: Theme Toggle, Notifications, User Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ThemeToggleButton />
            <NotificationDropdown />
          </div>

          <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

          {/* User Profile & Dropdown (Includes Sign Out) */}
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
