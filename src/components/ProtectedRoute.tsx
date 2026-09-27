// import React from "react";
// import { Navigate, useLocation } from "react-router-dom";
// import { useAppSelector } from "../app/hooks";

// interface ProtectedRouteProps {
//   children: React.ReactNode;
//   allowedRoles?: string[];
// }

// const ProtectedRoute = ({ children, allowedRoles = [] }: ProtectedRouteProps) => {
//   const location = useLocation();

//   const authState = useAppSelector((state) => state.auth);
//   const teacherState = useAppSelector((state) => state.teacherAuth);
//   const studentState = useAppSelector((state) => state.students);

//   // Active token resolution
//   const token =
//     authState.token ||
//     teacherState.token ||
//     studentState.token ||
//     localStorage.getItem("token") ||
//     localStorage.getItem("teacherToken") ||
//     localStorage.getItem("studentToken");

//   // Helper to safely get stored user object
//   const getUserFromStorage = (key: string) => {
//     try {
//       const item = localStorage.getItem(key);
//       return item && item !== "undefined" && item !== "null" ? JSON.parse(item) : null;
//     } catch {
//       return null;
//     }
//   };

//   const adminObj = authState.admin || getUserFromStorage("admin");
//   const teacherObj = teacherState.teacher || getUserFromStorage("teacher");
//   const studentObj = studentState.student || studentState.currentStudent || getUserFromStorage("student");

//   const user = adminObj || teacherObj || studentObj;
//   const storedRole = localStorage.getItem("userRole");

//   // Inferred role with fail-safe defaults based on logged-in user object
//   const userRole =
//     user?.role ||
//     storedRole ||
//     (adminObj ? "admin" : teacherObj ? "teacher" : studentObj ? "student" : null);

//   // 1. If not authenticated at all -> redirect to role login page based on current URL path
//   if (!token || !user) {
//     if (location.pathname.startsWith("/student")) {
//       return <Navigate to="/student/login" state={{ from: location }} replace />;
//     }
//     if (location.pathname.startsWith("/teacher")) {
//       return <Navigate to="/teacher/login" state={{ from: location }} replace />;
//     }
//     return <Navigate to="/admin/login" state={{ from: location }} replace />;
//   }

//   // 2. If allowedRoles are specified, check if user's role is allowed
//   if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole)) {
//     // Redirect unauthorized user to their respective role dashboard
//      if (userRole === "admin") {
//       return <Navigate to="/admin/dashboard" replace />;
//     }
//     if (userRole === "student") {
//       return <Navigate to="/student/dashboard" replace />;
//     }
//     if (userRole === "teacher") {
//       return <Navigate to="/teacher/dashboard" replace />;
//     }
//     return <Navigate to="/" replace />;
//   }

//   return <>{children}</>;
// };

// export default ProtectedRoute;


import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../app/hooks";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

interface User {
  role?: string;
  [key: string]: any;
}

const ProtectedRoute = ({
  children,
  allowedRoles = [],
}: ProtectedRouteProps) => {
  const location = useLocation();

  const authState = useAppSelector((state) => state.auth);
  const teacherState = useAppSelector((state) => state.teacherAuth);
  const studentState = useAppSelector((state) => state.students);

  // Active session resolution
  const adminObj = authState.admin || getUserFromStorage("admin");
  const teacherObj = teacherState.teacher || getUserFromStorage("teacher");
  const studentObj = studentState.student || studentState.currentStudent || getUserFromStorage("student");

  const adminToken = authState.token || localStorage.getItem("token");
  const teacherToken = teacherState.token || localStorage.getItem("teacherToken");
  const studentToken = studentState.token || localStorage.getItem("studentToken");

  const storedUserRole = localStorage.getItem("userRole");

  // Determine available sessions
  const hasTeacherSession = Boolean(teacherToken && teacherObj);
  const hasAdminSession = Boolean(adminToken && adminObj);
  const hasStudentSession = Boolean(studentToken && studentObj);

  let token: string | null = null;
  let user: User | null = null;
  let userRole = "";

  // 1. Check if route is specifically scoped to a single role
  if (allowedRoles.length === 1 && allowedRoles[0] === "teacher") {
    if (hasTeacherSession || storedUserRole === "teacher") {
      token = teacherToken || localStorage.getItem("token");
      user = teacherObj || { role: "teacher" };
      userRole = "teacher";
    }
  } else if (allowedRoles.length === 1 && allowedRoles[0] === "admin") {
    if (hasAdminSession || storedUserRole === "admin") {
      token = adminToken || localStorage.getItem("token");
      user = adminObj || { role: "admin" };
      userRole = "admin";
    }
  } else if (allowedRoles.length === 1 && allowedRoles[0] === "student") {
    if (hasStudentSession || storedUserRole === "student") {
      token = studentToken || localStorage.getItem("token");
      user = studentObj || { role: "student" };
      userRole = "student";
    }
  }

  // 2. If not yet resolved (e.g. shared route or multiple allowedRoles), prioritize storedUserRole
  if (!token || !user) {
    if (storedUserRole === "teacher" && (hasTeacherSession || teacherToken)) {
      token = teacherToken || localStorage.getItem("token");
      user = teacherObj || { role: "teacher" };
      userRole = "teacher";
    } else if (storedUserRole === "student" && (hasStudentSession || studentToken)) {
      token = studentToken || localStorage.getItem("token");
      user = studentObj || { role: "student" };
      userRole = "student";
    } else if (storedUserRole === "admin" && (hasAdminSession || adminToken)) {
      token = adminToken || localStorage.getItem("token");
      user = adminObj || { role: "admin" };
      userRole = "admin";
    } else if (hasTeacherSession && allowedRoles.includes("teacher")) {
      token = teacherToken;
      user = teacherObj;
      userRole = "teacher";
    } else if (hasAdminSession && allowedRoles.includes("admin")) {
      token = adminToken;
      user = adminObj;
      userRole = "admin";
    } else if (hasStudentSession && allowedRoles.includes("student")) {
      token = studentToken;
      user = studentObj;
      userRole = "student";
    } else if (hasTeacherSession) {
      token = teacherToken;
      user = teacherObj;
      userRole = "teacher";
    } else if (hasAdminSession) {
      token = adminToken;
      user = adminObj;
      userRole = "admin";
    } else if (hasStudentSession) {
      token = studentToken;
      user = studentObj;
      userRole = "student";
    }
  }

  /*
   * NOT AUTHENTICATED
   */
  if (!token || !user) {
    if (allowedRoles.includes("student")) {
      return (
        <Navigate
          to="/student/login"
          state={{ from: location }}
          replace
        />
      );
    }

    if (allowedRoles.includes("teacher")) {
      return (
        <Navigate
          to="/teacher/login"
          state={{ from: location }}
          replace
        />
      );
    }

    return (
      <Navigate
        to="/admin/login"
        state={{ from: location }}
        replace
      />
    );
  }

  /*
   * WRONG ROLE
   */
  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(userRole)
  ) {
    if (userRole === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (userRole === "teacher") {
      return <Navigate to="/teacher/dashboard" replace />;
    }

    if (userRole === "student") {
      return <Navigate to="/student/dashboard" replace />;
    }

    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};


/*
 * Safely get an object from localStorage
 */
function getUserFromStorage(key: string): User | null {
  try {
    const item = localStorage.getItem(key);

    if (
      !item ||
      item === "undefined" ||
      item === "null"
    ) {
      return null;
    }

    return JSON.parse(item) as User;
  } catch {
    return null;
  }
}

export default ProtectedRoute;

