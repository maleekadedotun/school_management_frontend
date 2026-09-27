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

// Inject token on every request
api.interceptors.request.use((config) => {
  const currentPath = window.location.pathname;
  const userRole = localStorage.getItem("userRole");
  const url = config.url || "";

  let token: string | null = null;

  // 1. Explicit teacher context (URL endpoint or current route)
  if (
    currentPath.startsWith("/teacher") ||
    url.includes("/teachers") ||
    url.includes("/students/teacher") ||
    url.includes("/exam-results/teacher") ||
    userRole === "teacher"
  ) {
    token = localStorage.getItem("teacherToken") || localStorage.getItem("token");
  } else if (
    currentPath.startsWith("/student") ||
    url.includes("/students/exams") ||
    url.includes("/students/profile") ||
    userRole === "student"
  ) {
    token = localStorage.getItem("studentToken") || localStorage.getItem("token");
  } else if (
    currentPath.startsWith("/admin") ||
    url.includes("/admin") ||
    userRole === "admin"
  ) {
    token = localStorage.getItem("token") || localStorage.getItem("adminToken");
  } else {
    token =
      localStorage.getItem("token") ||
      localStorage.getItem("teacherToken") ||
      localStorage.getItem("studentToken");
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

      if (currentPath.startsWith("/student") || userRole === "student") {
        localStorage.removeItem("studentToken");
        localStorage.removeItem("student");
        if (currentPath !== "/student/login") {
          window.location.href = "/student/login";
        }
      } else if (currentPath.startsWith("/teacher") || userRole === "teacher") {
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
