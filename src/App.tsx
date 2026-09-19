import { Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/common/ScrollToTop";
import LandingPage from "./pages/LandingPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layout/AppLayout";
import SignIn from "./pages/AuthPages/SignIn";
import TeacherLogin from "./pages/AuthPages/TeacherLogin";
import StudentLogin from "./pages/student/studentLogin";
import Dashboard from "./pages/Dashboard/AdminDashboard";
import TeacherDashboard from "./pages/Dashboard/TeacherDashboard";
import StudentDashboard from "./pages/Dashboard/StudentDashboard";
import StudentsList from "./pages/Students/StudentsList";
import TeachersList from "./pages/Teachers/TeachersList";
import AcademicYearsList from "./pages/Academic/AcademicYearsList";
import AcademicTermsList from "./pages/Academic/AcademicTermsList";
import ClassLevelsList from "./pages/Academic/ClassLevelsList";
import YearGroupsList from "./pages/Academic/YearGroupsList";
import ProgramsList from "./pages/Academic/ProgramsList";
import SubjectsList from "./pages/Academic/SubjectsList";
import ExamsList from "./pages/Exams/ExamsList";
import UserProfiles from "./pages/UserProfiles";
import NotFound from "./pages/OtherPage/NotFound";

export default function App() {
  return (
    <>
      {/* <Router> */}
        <ScrollToTop />
        <Routes>
          {/* Public Landing & Login Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/admin/login" element={<SignIn />} />
          <Route path="/teacher/login" element={<TeacherLogin />} />
          <Route path="/student/login" element={<StudentLogin />} />

          {/* Admin Protected Dashboard Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<StudentsList />} />
            <Route path="/teachers" element={<TeachersList />} />
            <Route path="/academic/years" element={<AcademicYearsList />} />
            <Route path="/academic/terms" element={<AcademicTermsList />} />
            <Route path="/academic/class-levels" element={<ClassLevelsList />} />
            <Route path="/academic/year-groups" element={<YearGroupsList />} />
            <Route path="/academic/programs" element={<ProgramsList />} />
            <Route path="/academic/subjects" element={<SubjectsList />} />
            <Route path="/exams" element={<ExamsList />} />
            <Route path="/profile" element={<UserProfiles />} />
          </Route>

          {/* Teacher Protected Dashboard Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/students" element={<StudentsList />} />
            <Route path="/academic/subjects" element={<SubjectsList />} />
            <Route path="/exams" element={<ExamsList />} />
            <Route path="/profile" element={<UserProfiles />} />
          </Route>

          {/* Student Protected Dashboard Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/academic/subjects" element={<SubjectsList />} />
            <Route path="/academic/programs" element={<ProgramsList />} />
            <Route path="/exams" element={<ExamsList />} />
            <Route path="/profile" element={<UserProfiles />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      {/* </Router> */}
    </>
  );
}
