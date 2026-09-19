import axios from "axios";

// export const BASE_URL = "http://localhost:2020/api/v1";
export const BASE_URL = "https://school-management-system-zwgw.onrender.com/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Inject token on every request
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("teacherToken") ||
    localStorage.getItem("studentToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401/403 globally to redirect to the respective role login page
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const userRole = localStorage.getItem("userRole");
      localStorage.clear();

      if (userRole === "student" && window.location.pathname !== "/student/login") {
        window.location.href = "/student/login";
      } else if (userRole === "teacher" && window.location.pathname !== "/teacher/login") {
        window.location.href = "/teacher/login";
      } else if (userRole === "admin" && window.location.pathname !== "/admin/login" && window.location.pathname !== "/signin") {
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
