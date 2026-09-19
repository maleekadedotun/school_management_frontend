import { useSidebar } from "@/context/SidebarContext";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import {
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  TableIcon,
  TaskIcon,
  UserCircleIcon,
} from "../icons";
import { cn } from "../utils";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: {
    name: string;
    path: string;
  }[];
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

// Admin Specific Sidebar Groups
const adminNavGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      {
        name: "Dashboard",
        icon: <GridIcon />,
        path: "/admin/dashboard",
      },
    ],
  },
  {
    title: "People Management",
    items: [
      {
        name: "Students",
        icon: <UserCircleIcon />,
        path: "/students",
      },
      {
        name: "Teachers",
        icon: <ListIcon />,
        path: "/teachers",
      },
    ],
  },
  {
    title: "Academic Setup",
    items: [
      {
        name: "Academic Structure",
        icon: <PageIcon />,
        subItems: [
          { name: "Academic Years", path: "/academic/years" },
          { name: "Academic Terms", path: "/academic/terms" },
          { name: "Class Levels", path: "/academic/class-levels" },
          { name: "Year Groups", path: "/academic/year-groups" },
        ],
      },
      {
        name: "Curriculum",
        icon: <TableIcon />,
        subItems: [
          { name: "Programs", path: "/academic/programs" },
          { name: "Subjects", path: "/academic/subjects" },
        ],
      },
    ],
  },
  {
    title: "Exams & Evaluation",
    items: [
      {
        name: "Exams & Results",
        icon: <TaskIcon />,
        path: "/exams",
      },
    ],
  },
  {
    title: "System & Settings",
    items: [
      {
        name: "Admin Profile",
        icon: <UserCircleIcon />,
        path: "/profile",
      },
    ],
  },
];

// Teacher Specific Sidebar Groups
const teacherNavGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      {
        name: "Teacher Dashboard",
        icon: <GridIcon />,
        path: "/teacher/dashboard",
      },
    ],
  },
  {
    title: "Classes & Curriculum",
    items: [
      {
        name: "Students List",
        icon: <UserCircleIcon />,
        path: "/students",
      },
      {
        name: "Subjects & Programs",
        icon: <TableIcon />,
        path: "/academic/subjects",
      },
    ],
  },
  {
    title: "Exams & Assessment",
    items: [
      {
        name: "Exam Management",
        icon: <TaskIcon />,
        path: "/exams",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        name: "My Profile",
        icon: <UserCircleIcon />,
        path: "/profile",
      },
    ],
  },
];

// Student Specific Sidebar Groups
const studentNavGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      {
        name: "Student Dashboard",
        icon: <GridIcon />,
        path: "/student/dashboard",
      },
    ],
  },
  {
    title: "My Academics",
    items: [
      {
        name: "My Enrolled Subjects",
        icon: <TableIcon />,
        path: "/academic/subjects",
      },
      {
        name: "Programs & Curriculum",
        icon: <PageIcon />,
        path: "/academic/programs",
      },
    ],
  },
  {
    title: "Exams & Evaluation",
    items: [
      {
        name: "Take / Write Exam",
        icon: <TaskIcon />,
        path: "/exams",
      },
      {
        name: "Check Exam Results",
        icon: <PageIcon />,
        path: "/student/dashboard",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        name: "My Profile",
        icon: <UserCircleIcon />,
        path: "/profile",
      },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, setIsMobileOpen } =
    useSidebar();
  const location = useLocation();

  const authState = useAppSelector((state) => state.auth);
  const teacherState = useAppSelector((state) => state.teacherAuth);
  const studentState = useAppSelector((state) => state.students);

  // Safely resolve active role
  const getUserFromStorage = (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item && item !== "undefined" && item !== "null" ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  };

  const adminObj = authState.admin || getUserFromStorage("admin");
  const teacherObj = teacherState.teacher || getUserFromStorage("teacher");
  const studentObj = studentState.student || studentState.currentStudent || getUserFromStorage("student");

  const storedRole = localStorage.getItem("userRole") || localStorage.getItem("teacherRole") || localStorage.getItem("studentRole");
  const userRole =
    adminObj?.role ||
    teacherObj?.role ||
    studentObj?.role ||
    storedRole ||
    (adminObj ? "admin" : teacherObj ? "teacher" : studentObj ? "student" : "admin");

  // Select groups according to active role
  const navGroups =
    userRole === "teacher"
      ? teacherNavGroups
      : userRole === "student"
      ? studentNavGroups
      : adminNavGroups;

  const dashboardHomePath =
    userRole === "teacher"
      ? "/teacher/dashboard"
      : userRole === "student"
      ? "/student/dashboard"
      : "/admin/dashboard";

  const portalLabel =
    userRole === "teacher"
      ? "Teacher Portal"
      : userRole === "student"
      ? "Student Portal"
      : "Admin Control";

  const [openSubmenu, setOpenSubmenu] = useState<{
    groupIndex: number;
    itemIndex: number;
  } | null>(null);

  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  }, [location.pathname]);

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;

    navGroups.forEach((group, gIdx) => {
      group.items.forEach((item, iIdx) => {
        if (item.subItems) {
          item.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({ groupIndex: gIdx, itemIndex: iIdx });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive, navGroups]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.groupIndex}-${openSubmenu.itemIndex}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (groupIndex: number, itemIndex: number) => {
    setOpenSubmenu((prev) => {
      if (
        prev &&
        prev.groupIndex === groupIndex &&
        prev.itemIndex === itemIndex
      ) {
        return null;
      }
      return { groupIndex, itemIndex };
    });
  };

  return (
    <aside
      className={cn(
        "fixed inset-s-0 top-0 z-50 flex h-screen flex-col border-e border-white/10 bg-[#0a0f1e] px-5 text-white transition-all duration-300 ease-in-out xl:translate-x-0 xl:rtl:translate-x-0",
        isExpanded || isMobileOpen ? "w-72.5" : isHovered ? "w-72.5" : "w-22.5",
        isMobileOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
      )}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Sidebar Header Brand Logo */}
      <div
        className={cn(
          "flex py-7 items-center border-b border-white/10 mb-6",
          !isExpanded && !isHovered ? "xl:justify-center" : "justify-start px-2"
        )}
      >
        <Link to={dashboardHomePath} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30 shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422A12.083 12.083 0 0121 13.5c0 4.418-4.03 8-9 8s-9-3.582-9-8a12.083 12.083 0 012.84-7.922L12 14z" />
            </svg>
          </div>
          {(isExpanded || isHovered || isMobileOpen) && (
            <div>
              <span className="text-lg font-bold text-white tracking-wide block leading-none">
                School<span className="text-indigo-400">MS</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                {portalLabel}
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation List */}
      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear flex-1 pr-1">
        <nav className="mb-6 space-y-6">
          {navGroups.map((group, gIdx) => (
            <div key={group.title}>
              <h2
                className={`mb-3 flex text-[11px] font-semibold text-slate-400 uppercase tracking-wider ${
                  !isExpanded && !isHovered ? "xl:justify-center" : "justify-start px-2"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  group.title
                ) : (
                  <HorizontaLDots className="size-5 text-slate-500" />
                )}
              </h2>

              <ul className="flex flex-col gap-1.5">
                {group.items.map((item, iIdx) => {
                  const isSubOpen =
                    openSubmenu?.groupIndex === gIdx &&
                    openSubmenu?.itemIndex === iIdx;
                  const key = `${gIdx}-${iIdx}`;

                  return (
                    <li key={item.name}>
                      {item.subItems ? (
                        <button
                          onClick={() => handleSubmenuToggle(gIdx, iIdx)}
                          className={cn(
                            "group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer",
                            isSubOpen
                              ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                              : "text-slate-300 hover:bg-white/5 hover:text-white border border-transparent",
                            !isExpanded && !isHovered
                              ? "xl:justify-center px-0"
                              : "xl:justify-start"
                          )}
                        >
                          <span className={cn("size-5 shrink-0", isSubOpen ? "text-indigo-400" : "text-slate-400 group-hover:text-white")}>
                            {item.icon}
                          </span>

                          {(isExpanded || isHovered || isMobileOpen) && (
                            <span className="flex-1 text-left">{item.name}</span>
                          )}

                          {(isExpanded || isHovered || isMobileOpen) && (
                            <ChevronDownIcon
                              className={cn(
                                "h-4 w-4 transition-transform duration-200 text-slate-400",
                                isSubOpen ? "rotate-180 text-indigo-400" : ""
                              )}
                            />
                          )}
                        </button>
                      ) : (
                        item.path && (
                          <Link
                            to={item.path}
                            className={cn(
                              "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                              isActive(item.path)
                                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25"
                                : "text-slate-300 hover:bg-white/5 hover:text-white",
                              !isExpanded && !isHovered
                                ? "xl:justify-center px-0"
                                : "xl:justify-start"
                            )}
                          >
                            <span className={cn("size-5 shrink-0", isActive(item.path) ? "text-white" : "text-slate-400 group-hover:text-white")}>
                              {item.icon}
                            </span>
                            {(isExpanded || isHovered || isMobileOpen) && (
                              <span>{item.name}</span>
                            )}
                          </Link>
                        )
                      )}

                      {item.subItems && (isExpanded || isHovered || isMobileOpen) && (
                        <div
                          ref={(el) => {
                            subMenuRefs.current[key] = el;
                          }}
                          className="overflow-hidden transition-all duration-300"
                          style={{
                            height: isSubOpen ? `${subMenuHeight[key] || 0}px` : "0px",
                          }}
                        >
                          <ul className="ms-8 mt-1.5 space-y-1 border-s border-white/10 pl-3">
                            {item.subItems.map((subItem) => (
                              <li key={subItem.name}>
                                <Link
                                  to={subItem.path}
                                  className={cn(
                                    "block py-2 px-3 rounded-lg text-xs font-medium transition-all",
                                    isActive(subItem.path)
                                      ? "text-indigo-400 bg-indigo-500/10 font-semibold"
                                      : "text-slate-400 hover:text-white hover:bg-white/5"
                                  )}
                                >
                                  {subItem.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
