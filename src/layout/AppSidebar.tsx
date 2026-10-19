import { useSidebar } from "@/context/SidebarContext";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { fetchStudentEnrolledSubjects, fetchStudentProfile } from "../features/students/studentsSlice";
import {
  CalenderIcon,
  ChevronDownIcon,
  FileIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  TableIcon,
  TaskIcon,
  UserCircleIcon,
  PlusIcon,
} from "../icons";
import { cn } from "../utils";

const BookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn("w-full h-full", className)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>
);

const DraftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn("w-full h-full", className)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
    />
  </svg>
);

type SubItem = {
  name: string;
  path: string;
  badge?: number | string;
  icon?: React.ReactNode;
  children?: {
    name: string;
    path: string;
  }[];
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  badge?: number | string;
  subItems?: SubItem[];
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
      {
        name: "Announcements",
        icon: <PageIcon />,
        path: "/admin/announcements",
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
      {
        name: "Class Teachers",
        icon: <UserCircleIcon />,
        path: "/admin/class-teachers",
      },
      {
        name: "Parents",
        icon: <UserCircleIcon />,
        path: "/admin/parents",
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
          { name: "Timetable Schedule", path: "/academic/timetable" },
          { name: "Lesson Notes Review", path: "/admin/lesson-notes" },
        ],
      },
    ],
  },
  {
    title: "Exams & Evaluation",
    items: [
      {
        name: "Manage Exams",
        icon: <TaskIcon />,
        path: "/exams",
      },
      {
        name: "Teacher Exams",
        icon: <ListIcon />,
        path: "/admin/teacher-exams",
      },
      {
        name: "Question Bank",
        icon: <TableIcon />,
        path: "/admin/questions",
      },
      {
        name: "Student Results",
        icon: <PageIcon />,
        path: "/admin/results",
      },
      {
        name: "Term Report Cards",
        icon: <FileIcon />,
        path: "/admin/report-cards",
      },
      {
        name: "Assignments Portal",
        icon: <FileIcon />,
        path: "/assignments",
      },
    ],
  },
  {
    title: "Reports & Monitoring",
    items: [
      {
        name: "Class Performance Reports",
        icon: <FileIcon />,
        path: "/admin/class-reports",
      },
    ],
  },
  {
    title: "Finance & Bursary",
    items: [
      {
        name: "Finance Overview",
        icon: <GridIcon />,
        path: "/admin/finance",
      },
      {
        name: "Fee Structures",
        icon: <TableIcon />,
        path: "/admin/finance/fee-structures",
      },
      {
        name: "Student Invoices",
        icon: <FileIcon />,
        path: "/admin/finance/invoices",
      },
      {
        name: "Transactions Ledger",
        icon: <TaskIcon />,
        path: "/admin/finance/transactions",
      },
      {
        name: "Parents Directory",
        icon: <UserCircleIcon />,
        path: "/admin/finance/parents",
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

// Parent Specific Sidebar Groups
const parentNavGroups: NavGroup[] = [
  {
    title: "Parent Portal",
    items: [
      {
        name: "Dashboard",
        icon: <GridIcon />,
        path: "/parent/dashboard",
      },
      {
        name: "Children Results",
        icon: <TaskIcon />,
        path: "/parent/results",
      },
      {
        name: "Term Report Cards",
        icon: <FileIcon />,
        path: "/parent/report-card",
      },
      {
        name: "Student Assignment",
        icon: <TaskIcon />,
        path: "/parent/assignments",
      },
      {
        name: "Children Fees & Invoices",
        icon: <TableIcon />,
        path: "/parent/invoices",
      },
      {
        name: "Children Attendance",
        icon: <CalenderIcon />,
        path: "/parent/attendance",
      },
      {
        name: "Transactions Ledger",
        icon: <PageIcon />,
        path: "/parent/transactions",
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
    title: "Class Teacher",
    items: [
      {
        name: "My Class Results",
        icon: <TableIcon />,
        path: "/teacher/class-results",
      },
      {
        name: "Class Students",
        icon: <UserCircleIcon />,
        path: "/teacher/students",
      },
    ],
  },
  {
    title: "Classes & Curriculum",
    items: [
      {
        name: "Students List",
        icon: <UserCircleIcon />,
        path: "/teacher/students",
      },
      {
        name: "Teacher Timetable",
        icon: <CalenderIcon />,
        path: "/teacher/timetable",
      },
      {
        name: "Student Attendance",
        icon: <CalenderIcon />,
        path: "/teacher/attendance",
      },
      {
        name: "Weekly Class Reports",
        icon: <FileIcon />,
        path: "/teacher/weekly-reports",
      },
      {
        name: "Teaching Resources",
        icon: <BookIcon />,
        path: "/teacher/resources",
      },
    ],
  },
  {
    title: "Exams & Assessment",
    items: [
      {
        name: "My Exams",
        icon: <TaskIcon />,
        path: "/teacher/exams",
      },
      {
        name: "Create Assignment",
        icon: <PlusIcon />,
        path: "/teacher/assignments/create",
      },
      {
        name: "Assignment Drafts",
        icon: <DraftIcon />,
        path: "/teacher/assignments/drafts",
      },
      {
        name: "Assignments Portal",
        icon: <FileIcon />,
        path: "/teacher/assignments",
      },
      {
        name: "Question Bank",
        icon: <PageIcon />,
        path: "/teacher/questions",
      },
      {
        name: "Term Report Cards",
        icon: <FileIcon />,
        path: "/teacher/report-cards",
      },
      {
        name: "Record Exam & Test Scores",
        icon: <TaskIcon />,
        path: "/teacher/results",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        name: "My Profile",
        icon: <UserCircleIcon />,
        path: "/teacher/profile",
      },
    ],
  },
];


const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, setIsMobileOpen } =
    useSidebar();
  const location = useLocation();

  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);
  const teacherState = useAppSelector((state) => state.teacherAuth);
  const studentState = useAppSelector((state) => state.students);
  const parentState = useAppSelector((state) => state.parentAuth);
  const { enrolledSubjectsByClass, allEnrolledSubjects } = studentState;

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
  const studentObj =
    studentState.profile ||
    studentState.student ||
    studentState.currentStudent ||
    getUserFromStorage("student");
  const parentObj = parentState?.parent || getUserFromStorage("parent");

  // Prioritize route-based role context
  const pathRole = (location.pathname.startsWith("/parent/") || location.pathname === "/parent")
    ? "parent"
    : (location.pathname.startsWith("/student/") || location.pathname === "/student")
    ? "student"
    : (location.pathname.startsWith("/teacher/") || location.pathname === "/teacher")
    ? "teacher"
    : (location.pathname.startsWith("/admin/") || location.pathname === "/admin")
    ? "admin"
    : null;

  const storedRole =
    localStorage.getItem("userRole") ||
    localStorage.getItem("teacherRole") ||
    localStorage.getItem("studentRole");

  const userRole =
    pathRole ||
    storedRole ||
    (parentObj ? "parent" : null) ||
    (studentObj ? "student" : null) ||
    (teacherObj ? "teacher" : null) ||
    (adminObj ? "admin" : null) ||
    "admin";

  // Fetch enrolled subjects & student profile ONLY if logged-in user is a student AND currently in student portal
  useEffect(() => {
    if (userRole === "student" && (location.pathname.startsWith("/student/") || location.pathname === "/student")) {
      dispatch(fetchStudentEnrolledSubjects());
      dispatch(fetchStudentProfile());
    }
  }, [userRole, location.pathname, dispatch]);

  // Construct dynamic student navigation groups arranged by educational track (JSS, SSS, or Tertiary)
  const dynamicStudentNavGroups: NavGroup[] = useMemo(() => {
    const rawClass = (studentObj?.currentClassLevel || "").toLowerCase();
    const classHist = (
      Array.isArray(studentObj?.classLevels)
        ? studentObj.classLevels
        : studentObj?.classLevels
        ? [studentObj.classLevels]
        : []
    ).map((l: any) =>
      (typeof l === "object" ? l?.name || "" : l?.toString() || "").toLowerCase()
    );

    const isJSS =
      rawClass.includes("jss") ||
      rawClass.includes("js ") ||
      rawClass.startsWith("js") ||
      rawClass.includes("junior") ||
      classHist.some((l: string) => l.includes("jss") || l.includes("junior"));

    const isSSS =
      !isJSS && (
        rawClass.includes("sss") ||
        rawClass.includes("ss ") ||
        rawClass.startsWith("ss") ||
        rawClass.includes("senior") ||
        classHist.some((l: string) => l.includes("sss") || l.includes("senior"))
      );

    const defaultTrackGroups = isJSS
      ? [
          { classLevel: "jss 1", shortCode: "JSS 1", isCurrent: true, isCompleted: false, isFinal: false, count: 0, subjects: [] },
          { classLevel: "JSS 2 Class", shortCode: "JSS 2", isCurrent: false, isCompleted: false, isFinal: false, count: 0, subjects: [] },
          { classLevel: "JSS 3 class", shortCode: "JSS 3", isCurrent: false, isCompleted: false, isFinal: true, count: 0, subjects: [] },
        ]
      : isSSS
      ? [
          { classLevel: "sss 1", shortCode: "SSS 1", isCurrent: true, isCompleted: false, isFinal: false, count: 0, subjects: [] },
          { classLevel: "sss 2", shortCode: "SSS 2", isCurrent: false, isCompleted: false, isFinal: false, count: 0, subjects: [] },
          { classLevel: "sss 3", shortCode: "SSS 3", isCurrent: false, isCompleted: false, isFinal: true, count: 0, subjects: [] },
        ]
      : [
          { classLevel: "Level 100", shortCode: "Level 100", isCurrent: false, isCompleted: true, isFinal: false, count: 0, subjects: [] },
          { classLevel: "Level 200", shortCode: "Level 200", isCurrent: false, isCompleted: false, isFinal: false, count: 0, subjects: [] },
          { classLevel: "Level 300", shortCode: "Level 300", isCurrent: false, isCompleted: false, isFinal: false, count: 0, subjects: [] },
          { classLevel: "Level 400", shortCode: "Level 400", isCurrent: true, isCompleted: false, isFinal: true, count: 0, subjects: [] },
        ];

    const classGroups =
      enrolledSubjectsByClass && enrolledSubjectsByClass.length > 0
        ? enrolledSubjectsByClass
        : defaultTrackGroups;

    // Each class's subjects in one file, all grouped inside a folder
    const classFiles: SubItem[] = [
      {
        name: "All Classes Overview",
        path: "/student/subjects",
        badge: allEnrolledSubjects.length > 0 ? allEnrolledSubjects.length : undefined,
        icon: <TableIcon className="w-4 h-4 text-indigo-400" />,
      },
      ...classGroups.map((group) => {
        const hasSubjects = group.subjects && group.subjects.length > 0;
        return {
          name: `${group.shortCode} Subjects`,
          path: `/student/subjects?class=${encodeURIComponent(group.classLevel)}`,
          badge: group.count,
          icon: <FileIcon className="w-4 h-4 text-indigo-400 shrink-0" />,
          children: hasSubjects
            ? group.subjects.map((sub) => ({
                name: sub.name,
                path: `/student/subjects?class=${encodeURIComponent(group.classLevel)}&subject=${encodeURIComponent(sub.name)}`,
              }))
            : [],
        };
      }),
    ];

    return [
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
        title: "Academic Curriculum",
        items: [
          {
            name: "Lesson Notes",
            icon: <BookIcon />,
            path: "/student/lesson-notes",
          },
          {
            name: "My Timetable",
            icon: <CalenderIcon />,
            path: "/student/timetable",
          },
          {
            name: "Class Subjects",
            icon: <BookIcon />,
            badge: allEnrolledSubjects.length > 0 ? `${allEnrolledSubjects.length}` : undefined,
            subItems: classFiles,
          },
          {
            name: "My Program",
            icon: <PageIcon />,
            path: "/student/program",
            badge: "Active",
          },
          {
            name: "My Attendance",
            icon: <CalenderIcon />,
            path: "/student/attendance",
          },
        ],
      },
      {
        title: "Exams & Evaluation",
        items: [
          {
            name: "Take / Write Exam",
            icon: <TaskIcon />,
            path: "/student/exams",
          },
          {
            name: "Assignments & Tasks",
            icon: <FileIcon />,
            path: "/student/assignments",
          },
          {
            name: "Check Exam Results",
            icon: <PageIcon />,
            path: "/student/results",
          },
          {
            name: "My Report Card",
            icon: <FileIcon />,
            path: "/student/report-card",
          },
        ],
      },
      {
        title: "Fees & Bursary",
        items: [
          {
            name: "My Invoices & Fees",
            icon: <FileIcon />,
            path: "/student/invoices",
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
  }, [enrolledSubjectsByClass, allEnrolledSubjects, studentObj]);

  // Select groups according to active role
  const navGroups =
    userRole === "teacher"
      ? teacherNavGroups
      : userRole === "student"
      ? dynamicStudentNavGroups
      : userRole === "parent"
      ? parentNavGroups
      : adminNavGroups;

  const dashboardHomePath =
    userRole === "teacher"
      ? "/teacher/dashboard"
      : userRole === "student"
      ? "/student/dashboard"
      : userRole === "parent"
      ? "/parent/invoices"
      : "/admin/dashboard";

  const portalLabel =
    userRole === "teacher"
      ? "Teacher Portal"
      : userRole === "student"
      ? "Student Portal"
      : userRole === "parent"
      ? "Parent Portal"
      : "Admin Control";

  const [openSubmenu, setOpenSubmenu] = useState<{
    groupIndex: number;
    itemIndex: number;
  } | null>(null);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);


  useEffect(() => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  }, [location.pathname]);

  const isActive = useCallback(
    (path: string) => {
      if (path.includes("?")) {
        const fullCurrent = location.pathname + location.search;
        return (
          fullCurrent === path ||
          (location.pathname === path.split("?")[0] &&
            location.search.includes(path.split("?")[1]))
        );
      }

      // Strictly isolate Student Dashboard so it only highlights on the dashboard itself
      if (path === "/student/dashboard") {
        if (location.search.includes("tab=results") || location.search.includes("tab=exams")) {
          return false;
        }
        return location.pathname === "/student/dashboard";
      }

      // Check Exam Results activates on /student/results or tab=results
      if (path === "/student/results") {
        return (
          location.pathname === "/student/results" ||
          (location.pathname === "/student/dashboard" && location.search.includes("tab=results"))
        );
      }

      // Take / Write Exam activates on /student/exams (and active exam writing sub-routes) or tab=exams
      if (path === "/student/exams") {
        return (
          location.pathname.startsWith("/student/exams") ||
          (location.pathname === "/student/dashboard" && location.search.includes("tab=exams"))
        );
      }

      return (
        location.pathname === path ||
        (path === "/students" && location.pathname === "/teacher/students") ||
        (path === "/teacher/students" && location.pathname === "/students")
      );
    },
    [location.pathname, location.search]
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
            if (subItem.children) {
              subItem.children.forEach((child) => {
                if (isActive(child.path)) {
                  setOpenSubmenu({ groupIndex: gIdx, itemIndex: iIdx });
                  setExpandedFile(subItem.name);
                  submenuMatched = true;
                }
              });
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive, navGroups]);


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
        isExpanded || isMobileOpen ? "w-[290px] max-w-[85vw]" : isHovered ? "w-[290px]" : "w-[90px]",
        isMobileOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
      )}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Sidebar Header Brand Logo */}
      <div
        className={cn(
          "flex py-6 items-center justify-between border-b border-white/10 mb-6",
          !isExpanded && !isHovered ? "xl:justify-center" : "px-2"
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
                DotTech<span className="text-indigo-400">MS</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                {portalLabel}
              </span>
            </div>
          )}
        </Link>

        {isMobileOpen && (
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="xl:hidden p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close Sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
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
                            <span className="flex-1 text-left flex items-center justify-between pr-1">
                              <span className="truncate">{item.name}</span>
                              {item.badge !== undefined && (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  {item.badge}
                                </span>
                              )}
                            </span>
                          )}

                          {(isExpanded || isHovered || isMobileOpen) && (
                            <ChevronDownIcon
                              className={cn(
                                "h-4 w-4 transition-transform duration-200 text-slate-400 shrink-0",
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
                              <span className="flex-1 flex items-center justify-between pr-1">
                                <span className="truncate">{item.name}</span>
                                {item.badge !== undefined && (
                                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                    {item.badge}
                                  </span>
                                )}
                              </span>
                            )}
                          </Link>
                        )
                      )}

                      {item.subItems && (isExpanded || isHovered || isMobileOpen) && (
                        <div
                          className={cn(
                            "overflow-hidden transition-all duration-300 ease-in-out",
                            isSubOpen ? "max-h-[1600px] opacity-100 mt-1" : "max-h-0 opacity-0 pointer-events-none"
                          )}
                        >
                          <ul className="ms-6 space-y-1 border-s-2 border-white/10 pl-2.5 py-1">
                            {item.subItems.map((subItem) => (
                              <li key={subItem.name} className="relative group/file">
                                <div className="flex items-center justify-between rounded-lg transition-colors">
                                  <Link
                                    to={subItem.path}
                                    className={cn(
                                      "flex-1 flex items-center gap-2 py-2 px-2.5 rounded-lg text-xs font-medium transition-all min-w-0",
                                      isActive(subItem.path)
                                        ? "text-indigo-300 bg-indigo-500/20 font-semibold shadow-xs border border-indigo-500/30"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                    )}
                                  >
                                    {subItem.icon ? (
                                      <span className="shrink-0">{subItem.icon}</span>
                                    ) : (
                                      <FileIcon className="w-4 h-4 text-slate-400 group-hover/file:text-slate-200 shrink-0" />
                                    )}
                                    <span className="truncate">{subItem.name}</span>
                                    {subItem.badge !== undefined && (
                                      <span className="ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                                        {subItem.badge}
                                      </span>
                                    )}
                                  </Link>
                                  {subItem.children && subItem.children.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setExpandedFile((prev) => (prev === subItem.name ? null : subItem.name));
                                      }}
                                      className={cn(
                                        "p-1.5 rounded-md transition-colors shrink-0 ml-1 text-slate-400 hover:text-white hover:bg-white/10",
                                        expandedFile === subItem.name ? "text-indigo-300 bg-white/10" : ""
                                      )}
                                      title="Toggle subject list"
                                    >
                                      <ChevronDownIcon
                                        className={cn(
                                          "w-3.5 h-3.5 transition-transform duration-200",
                                          expandedFile === subItem.name ? "rotate-180 text-indigo-400" : ""
                                        )}
                                      />
                                    </button>
                                  )}
                                </div>

                                {/* Expanded individual subject files inside the level file */}
                                {subItem.children && subItem.children.length > 0 && expandedFile === subItem.name && (
                                  <ul className="ms-5 mt-1 mb-1.5 space-y-1 border-s border-indigo-500/25 pl-2">
                                    {subItem.children.map((child) => (
                                      <li key={child.name}>
                                        <Link
                                          to={child.path}
                                          className={cn(
                                            "flex items-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] transition-all truncate",
                                            isActive(child.path)
                                              ? "text-indigo-300 bg-indigo-500/20 font-medium"
                                              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                          )}
                                          title={child.name}
                                        >
                                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                          <span className="truncate">{child.name}</span>
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                )}
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
