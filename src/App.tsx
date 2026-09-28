import { Route, Routes, Navigate } from "react-router-dom";
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
import StudentSubjects from "./pages/student/StudentSubjects";
import StudentWriteExam from "./pages/student/StudentWriteExam";
import StudentProgram from "./pages/student/StudentProgram";
import StudentProfile from "./pages/student/StudentProfile";
import StudentForgotPassword from "./pages/student/StudentForgotPassword";
import TeacherForgotPassword from "./pages/Teachers/TeacherForgotPassword";
import AdminForgotPassword from "./pages/AuthPages/AdminForgotPassword";
import StudentsList from "./pages/Students/StudentsList";
import TeachersList from "./pages/Teachers/TeachersList";
import TeacherProfile from "./pages/Teachers/TeacherProfile";
import TeacherExamsManagement from "./pages/Teachers/TeacherExamsManagement";
import TeacherQuestionsList from "./pages/Teachers/TeacherQuestionsList";
import TeacherStudentResults from "./pages/Teachers/TeacherStudentResults";
import TeacherAttendance from "./pages/Teachers/TeacherAttendance";
import AcademicYearsList from "./pages/Academic/AcademicYearsList";
import AcademicTermsList from "./pages/Academic/AcademicTermsList";
import ClassLevelsList from "./pages/Academic/ClassLevelsList";
import YearGroupsList from "./pages/Academic/YearGroupsList";
import ProgramsList from "./pages/Academic/ProgramsList";
import SubjectsList from "./pages/Academic/SubjectsList";
import ExamsList from "./pages/Exams/ExamsList";
import StudentResultsList from "./pages/Exams/StudentResultsList";
import TeacherExamsList from "./pages/Exams/TeacherExamsList";
import QuestionsList from "./pages/Exams/QuestionsList";
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
          <Route path="/index.html" element={<Navigate to="/" replace />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/admin/login" element={<SignIn />} />
          <Route path="/teacher/login" element={<TeacherLogin />} />
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/student/forgot-password" element={<StudentForgotPassword />} />
          <Route path="/student/reset-password" element={<StudentForgotPassword />} />
          <Route path="/student/reset-password/:token" element={<StudentForgotPassword />} />
          <Route path="/teacher/forgot-password" element={<TeacherForgotPassword />} />
          <Route path="/teacher/reset-password" element={<TeacherForgotPassword />} />
          <Route path="/teacher/reset-password/:token" element={<TeacherForgotPassword />} />
          <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
          <Route path="/admin/reset-password" element={<AdminForgotPassword />} />
          <Route path="/admin/reset-password/:token" element={<AdminForgotPassword />} />

          {/* Shared Routes for Admin & Teacher */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["admin", "teacher"]}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/students" element={<StudentsList />} />
          </Route>

          {/* Shared Routes for Admin, Teacher, and Student */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["admin", "teacher", "student"]}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/exams" element={<ExamsList />} />
            <Route path="/profile" element={<UserProfiles />} />
          </Route>

          {/* Admin Protected Dashboard Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/teachers" element={<TeachersList />} />
            <Route path="/academic/years" element={<AcademicYearsList />} />
            <Route path="/academic/terms" element={<AcademicTermsList />} />
            <Route path="/academic/class-levels" element={<ClassLevelsList />} />
            <Route path="/academic/year-groups" element={<YearGroupsList />} />
            <Route path="/academic/programs" element={<ProgramsList />} />
            <Route path="/academic/subjects" element={<SubjectsList />} />
            <Route path="/admin/results" element={<StudentResultsList />} />
            <Route path="/admin/teacher-exams" element={<TeacherExamsList />} />
            <Route path="/admin/questions" element={<QuestionsList />} />
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
            <Route path="/teacher/profile" element={<TeacherProfile />} />
            <Route path="/teacher/exams" element={<TeacherExamsManagement />} />
            <Route path="/teacher/questions" element={<TeacherQuestionsList />} />
            <Route path="/teacher/results" element={<TeacherStudentResults />} />
            <Route path="/teacher/students" element={<StudentsList />} />
            <Route path="/teacher/attendance" element={<TeacherAttendance />} />
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
            <Route path="/student/results" element={<StudentDashboard initialTab="results" />} />
            <Route path="/student/program" element={<StudentProgram />} />
            <Route path="/student/subjects" element={<StudentSubjects />} />
            <Route path="/student/exams" element={<StudentWriteExam />} />
            <Route path="/student/exams/:examId/write" element={<StudentWriteExam />} />
            <Route path="/student/profile" element={<StudentProfile />} />
            <Route path="/profile" element={<StudentProfile />} />
            <Route path="/academic/programs" element={<StudentProgram />} />
            <Route path="/academic/subjects" element={<Navigate to="/student/subjects" replace />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      {/* </Router> */}
    </>
  );
}
