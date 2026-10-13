import axios from "axios";

export const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:2020/api/v1"
    : "https://school-management-system-zwgw.onrender.com/api/v1");

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

const isParentPortalPath = (path: string) => path.startsWith("/parent/") || path === "/parent";
const isTeacherPortalPath = (path: string) => path.startsWith("/teacher/") || path === "/teacher";
const isStudentPortalPath = (path: string) => path.startsWith("/student/") || path === "/student";
const isAdminPortalPath = (path: string) => path.startsWith("/admin/") || path === "/admin";

// Inject token on every request
api.interceptors.request.use((config) => {
  const currentPath = window.location.pathname;
  const userRole = localStorage.getItem("userRole");
  const url = config.url || "";

  let token: string | null = null;

  // 1. Explicit Parent context (portal route, parent API endpoints, or role)
  if (
    isParentPortalPath(currentPath) ||
    url.includes("/parents") ||
    url.includes("/invoices/parent") ||
    userRole === "parent"
  ) {
    token = localStorage.getItem("parentToken") || localStorage.getItem("token");
  } else if (
    isTeacherPortalPath(currentPath) ||
    url.includes("/teachers") ||
    url.includes("/students/teacher") ||
    url.includes("/exam-results/teacher") ||
    url.includes("/timetables/teacher") ||
    (userRole === "teacher" && !url.includes("/student"))
  ) {
    token = localStorage.getItem("teacherToken") || localStorage.getItem("token");
  } else if (
    isStudentPortalPath(currentPath) ||
    url.includes("/students/exams") ||
    url.includes("/students/profile") ||
    url.includes("/timetables/student") ||
    url.includes("/report-cards/student") ||
    (userRole === "student" && !isAdminPortalPath(currentPath) && currentPath !== "/students")
  ) {
    token = localStorage.getItem("studentToken") || localStorage.getItem("token");
  } else if (
    isAdminPortalPath(currentPath) ||
    currentPath === "/students" ||
    currentPath === "/teachers" ||
    url.includes("/admin") ||
    userRole === "admin"
  ) {
    token = localStorage.getItem("token") || localStorage.getItem("adminToken");
  } else {
    token =
      localStorage.getItem("token") ||
      localStorage.getItem("parentToken") ||
      localStorage.getItem("studentToken") ||
      localStorage.getItem("teacherToken");
  }

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally to redirect to the respective role login page
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isLoginEndpoint = error.config?.url?.includes("/login");
    if (error.response?.status === 401 && !isLoginEndpoint) {
      const userRole = localStorage.getItem("userRole");
      const currentPath = window.location.pathname;
      const requestUrl = error.config?.url || "";

      // Safeguard: If user is on /parent portal, ignore 401 from mismatched background calls (e.g. /students/profile)
      if (isParentPortalPath(currentPath) && (requestUrl.includes("/students") || requestUrl.includes("/teachers"))) {
        return Promise.reject(error);
      }

      if (isParentPortalPath(currentPath) || (userRole === "parent" && !isAdminPortalPath(currentPath))) {
        localStorage.removeItem("parentToken");
        localStorage.removeItem("parent");
        if (currentPath !== "/parent/login") {
          window.location.href = "/parent/login";
        }
      } else if (isStudentPortalPath(currentPath) || (userRole === "student" && !isAdminPortalPath(currentPath) && currentPath !== "/students")) {
        localStorage.removeItem("studentToken");
        localStorage.removeItem("student");
        if (currentPath !== "/student/login") {
          window.location.href = "/student/login";
        }
      } else if (isTeacherPortalPath(currentPath) || (userRole === "teacher" && !isAdminPortalPath(currentPath) && currentPath !== "/teachers")) {
        localStorage.removeItem("teacherToken");
        localStorage.removeItem("teacher");
        if (currentPath !== "/teacher/login") {
          window.location.href = "/teacher/login";
        }
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("admin");
        if (currentPath !== "/admin/login" && currentPath !== "/signin") {
          window.location.href = "/admin/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
