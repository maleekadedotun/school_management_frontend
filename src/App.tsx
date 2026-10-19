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
import ParentDashboard from "./pages/Dashboard/ParentDashboard";
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
import AdminClassReports from "./pages/Admin/AdminClassReports";
import TeacherWeeklyReports from "./pages/Teachers/TeacherWeeklyReports";
import AssignmentsPortal from "./pages/Assignments/AssignmentsPortal";
import TeacherAssignmentCreate from "./pages/Assignments/TeacherAssignmentCreate";
import TeacherAssignmentDrafts from "./pages/Assignments/TeacherAssignmentDrafts";
import TeacherResourcesLayout from "./layout/TeacherResourcesLayout";
import TeacherResourcesHome from "./pages/Teachers/resources/TeacherResourcesHome";
import LessonNotes from "./pages/Teachers/resources/LessonNotes";
import TeacherTimetable from "./pages/Teachers/resources/TeacherTimetable";
import LessonPlans from "./pages/Teachers/resources/LessonPlans";
import TeacherSubjects from "./pages/Teachers/resources/TeacherSubjects";
import TeachingMaterials from "./pages/Teachers/resources/TeachingMaterials";
import AcademicCalendar from "./pages/Teachers/resources/AcademicCalendar";
import AdminLessonNotesReview from "./pages/Admin/AdminLessonNotesReview";
import StudentLessonNotes from "./pages/student/StudentLessonNotes";
import TimetableManagement from "./pages/Academic/TimetableManagement";
import StudentTimetable from "./pages/student/StudentTimetable";
import AdminAnnouncements from "./pages/Admin/AdminAnnouncements";
import TeacherReportCards from "./pages/Teachers/TeacherReportCards";
import AdminReportCards from "./pages/Admin/AdminReportCards";
import ClassTeacherAssignment from "./pages/Admin/ClassTeacherAssignment";
import StudentReportCardView from "./pages/student/StudentReportCardView";
import NotFound from "./pages/OtherPage/NotFound";
import ParentLogin from "./pages/AuthPages/ParentLogin";
import AdminFinanceDashboard from "./pages/Finance/AdminFinanceDashboard";
import FeeStructureManagement from "./pages/Finance/FeeStructureManagement";
import InvoiceManagement from "./pages/Finance/InvoiceManagement";
import StudentInvoices from "./pages/Finance/StudentInvoices";
import ParentInvoices from "./pages/Finance/ParentInvoices";
import PaymentVerifyCallback from "./pages/Finance/PaymentVerifyCallback";
import PaymentHistory from "./pages/Finance/PaymentHistory";
import ParentsList from "./pages/Finance/ParentsList";
import ParentAttendance from "./pages/parent/ParentAttendance";
import ParentAssignments from "./pages/parent/ParentAssignments";
import StudentAttendance from "./pages/student/StudentAttendance";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
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
          <Route path="/parent/login" element={<ParentLogin />} />
          <Route path="/finance/payment-verify" element={<PaymentVerifyCallback />} />
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
            <Route path="/assignments" element={<AssignmentsPortal />} />
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
            <Route path="/admin/students" element={<StudentsList />} />
            <Route path="/teachers" element={<TeachersList />} />
            <Route path="/admin/teachers" element={<TeachersList />} />
            <Route path="/admin/class-teachers" element={<ClassTeacherAssignment />} />
            <Route path="/academic/years" element={<AcademicYearsList />} />
            <Route path="/academic/terms" element={<AcademicTermsList />} />
            <Route path="/academic/class-levels" element={<ClassLevelsList />} />
            <Route path="/academic/year-groups" element={<YearGroupsList />} />
            <Route path="/academic/programs" element={<ProgramsList />} />
            <Route path="/academic/subjects" element={<SubjectsList />} />
            <Route path="/admin/results" element={<StudentResultsList />} />
            <Route path="/admin/report-cards" element={<AdminReportCards />} />
            <Route path="/admin/teacher-exams" element={<TeacherExamsList />} />
            <Route path="/admin/questions" element={<QuestionsList />} />
            <Route path="/admin/class-reports" element={<AdminClassReports />} />
            <Route path="/admin/assignments" element={<AssignmentsPortal />} />
            <Route path="/admin/lesson-notes" element={<AdminLessonNotesReview />} />
            <Route path="/academic/timetable" element={<TimetableManagement />} />
            <Route path="/admin/timetable" element={<TimetableManagement />} />
            <Route path="/admin/announcements" element={<AdminAnnouncements />} />
            <Route path="/admin/finance" element={<AdminFinanceDashboard />} />
            <Route path="/admin/finance/fee-structures" element={<FeeStructureManagement />} />
            <Route path="/admin/finance/invoices" element={<InvoiceManagement />} />
            <Route path="/admin/finance/transactions" element={<PaymentHistory />} />
            <Route path="/admin/finance/parents" element={<ParentsList />} />
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
            <Route path="/teacher/timetable" element={<TeacherTimetable />} />
            <Route path="/teacher/exams" element={<TeacherExamsManagement />} />
            <Route path="/teacher/assignments" element={<AssignmentsPortal />} />
            <Route path="/teacher/assignments/drafts" element={<TeacherAssignmentDrafts />} />
            <Route path="/teacher/assignments/create" element={<TeacherAssignmentCreate />} />
            <Route path="/teacher/assignments/edit/:id" element={<TeacherAssignmentCreate />} />
            <Route path="/teacher/questions" element={<TeacherQuestionsList />} />
            <Route path="/teacher/results" element={<TeacherStudentResults />} />
            <Route path="/teacher/results/class" element={<TeacherReportCards />} />
            <Route path="/teacher/class-results" element={<TeacherReportCards />} />
            <Route path="/teacher/report-cards" element={<TeacherReportCards />} />
            <Route path="/teacher/students" element={<StudentsList />} />
            <Route path="/teacher/attendance" element={<TeacherAttendance />} />
            <Route path="/teacher/weekly-reports" element={<TeacherWeeklyReports />} />
          </Route>

          {/* Teacher Resources Secondary Workspace Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherResourcesLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/teacher/resources" element={<TeacherResourcesHome />} />
            <Route path="/teacher/resources/lesson-notes" element={<LessonNotes />} />
            <Route path="/teacher/resources/timetable" element={<TeacherTimetable />} />
            <Route path="/teacher/resources/lesson-plans" element={<LessonPlans />} />
            <Route path="/teacher/resources/subjects" element={<TeacherSubjects />} />
            <Route path="/teacher/resources/materials" element={<TeachingMaterials />} />
            <Route path="/teacher/resources/calendar" element={<AcademicCalendar />} />
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
            <Route path="/student/report-card" element={<StudentReportCardView />} />
            <Route path="/student/report-cards" element={<StudentReportCardView />} />
            <Route path="/student/timetable" element={<StudentTimetable />} />
            <Route path="/student/program" element={<StudentProgram />} />
            <Route path="/student/subjects" element={<StudentSubjects />} />
            <Route path="/student/exams" element={<StudentWriteExam />} />
            <Route path="/student/exams/:examId/write" element={<StudentWriteExam />} />
            <Route path="/student/assignments" element={<AssignmentsPortal />} />
            <Route path="/student/lesson-notes" element={<StudentLessonNotes />} />
            <Route path="/student/profile" element={<StudentProfile />} />
            <Route path="/profile" element={<StudentProfile />} />
            <Route path="/student/attendance" element={<StudentAttendance />} />
            <Route path="/student/invoices" element={<StudentInvoices />} />
            <Route path="/student/payment-history" element={<PaymentHistory />} />
          </Route>

          {/* Parent Protected Dashboard Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["parent"]}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/parent/dashboard" element={<ParentDashboard />} />
            <Route path="/parent/results" element={<ParentDashboard initialTab="exams" />} />
            <Route path="/parent/report-card" element={<StudentReportCardView />} />
            <Route path="/parent/report-cards" element={<StudentReportCardView />} />
            <Route path="/parent/assignments" element={<ParentAssignments />} />
            <Route path="/parent/invoices" element={<ParentInvoices />} />
            <Route path="/parent/attendance" element={<ParentAttendance />} />
            <Route path="/parent/transactions" element={<PaymentHistory />} />
            <Route path="/parent/payment-history" element={<PaymentHistory />} />
            <Route path="/parent/finance/transactions" element={<PaymentHistory />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      {/* </Router> */}
    </>
  );
}
