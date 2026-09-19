import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { logout as adminLogout } from "@/features/auth/authSlice";
import { logout as teacherLogout } from "@/features/teacherAuth/teacherAuthSlice";
import { logout as studentLogout } from "@/features/students/studentsSlice";
import { useLanguage } from "@/context/LanguageContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { getLanguage, languages, type Locale } from "@/i18n/languages";
import { cn } from "@/utils";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Dropdown } from "../ui/dropdown/Dropdown";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubDropdownOpen, setIsSubDropdownOpen] = useState(false);
  const subDropdownRef = useRef<HTMLLIElement>(null);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { admin } = useAppSelector((s) => s.auth);
  const { teacher } = useAppSelector((s) => s.teacherAuth);
  const { student, currentStudent } = useAppSelector((s) => s.students);

  const activeUser = admin || teacher || student || currentStudent;
  const userRole = activeUser?.role || localStorage.getItem("userRole") || "admin";

  const { language: locale, setLanguage } = useLanguage();
  const currentLang = getLanguage(locale as Locale);
  const CurrentFlagIcon = currentLang.FlagIcon;

  useClickOutside(subDropdownRef, () => {
    setIsSubDropdownOpen(false);
  });

  const handleSelectLanguage = (langId: Locale) => {
    setLanguage(langId);
    setIsSubDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
    setIsSubDropdownOpen(false);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setIsSubDropdownOpen(false);
  };

  const handleLogout = () => {
    closeDropdown();
    const roleToRedirect = userRole;

    dispatch(adminLogout());
    dispatch(teacherLogout());
    dispatch(studentLogout());
    localStorage.clear();

    if (roleToRedirect === "student") {
      navigate("/student/login");
    } else if (roleToRedirect === "teacher") {
      navigate("/teacher/login");
    } else {
      navigate("/admin/login");
    }
  };

  useEffect(() => {
    return () => {
      setIsOpen(false);
      setIsSubDropdownOpen(false);
    };
  }, []);

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="dropdown-toggle flex items-center gap-3 p-1.5 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20 shrink-0">
          {activeUser?.name?.[0]?.toUpperCase() || "U"}
        </div>

        <div className="hidden sm:block text-left">
          <p className="text-sm font-semibold text-gray-800 dark:text-white leading-tight">
            {activeUser?.name || "User"}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium capitalize">
            {userRole}
          </p>
        </div>

        <svg
          className={cn(
            "w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200",
            isOpen ? "rotate-180 text-indigo-400" : ""
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute inset-e-0 mt-3 w-64 rounded-2xl border border-white/10 bg-[#0f1629] p-3 shadow-2xl backdrop-blur-xl z-50"
      >
        {/* User Info Header */}
        <div className="px-3 py-2 border-b border-white/10 mb-2">
          <p className="text-sm font-bold text-white truncate">
            {activeUser?.name || "User Account"}
          </p>
          <p className="text-xs text-slate-400 truncate mt-0.5">
            {activeUser?.email || "user@school.edu"}
          </p>
          <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 capitalize">
            {userRole}
          </span>
        </div>

        <ul className="flex flex-col gap-1 border-b border-white/10 pb-2">
          <li>
            <Link
              to="/profile"
              onClick={closeDropdown}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Profile & Account
            </Link>
          </li>

          {/* Language Selector Submenu */}
          <li className="relative" ref={subDropdownRef}>
            <button
              type="button"
              onClick={() => setIsSubDropdownOpen((prev) => !prev)}
              className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span>Language</span>
              </span>

              <span className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                <span>{currentLang.shortName}</span>
                <CurrentFlagIcon className="size-3 shrink-0 rounded-full" />
              </span>
            </button>

            {isSubDropdownOpen && (
              <div className="absolute right-0 top-11 w-48 rounded-xl border border-white/10 bg-[#0a0f1e] p-2 shadow-2xl z-50">
                <ul className="flex flex-col gap-1">
                  {languages.map((language) => {
                    const isSelected = locale === language.id;
                    const FlagIcon = language.FlagIcon;

                    return (
                      <li key={language.id}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectLanguage(language.id);
                            closeDropdown();
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                            isSelected
                              ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/30"
                              : "text-slate-300 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <FlagIcon className="size-4 shrink-0 rounded-full" />
                            <span className="truncate">{language.name}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </li>
        </ul>

        {/* Sign Out Button in Dropdown */}
        <button
          id="dropdown-logout-btn"
          onClick={handleLogout}
          className="w-full mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors border border-red-500/20 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </Dropdown>
    </div>
  );
}
