import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import teacherAuthReducer from "../features/teacherAuth/teacherAuthSlice";
import studentsReducer from "../features/students/studentsSlice";
import teachersReducer from "../features/teachers/teachersSlice";
import academicYearsReducer from "../features/academicYears/academicYearsSlice";
import academicTermsReducer from "../features/academicTerms/academicTermsSlice";
import classLevelsReducer from "../features/classLevels/classLevelsSlice";
import programsReducer from "../features/programs/programsSlice";
import subjectsReducer from "../features/subjects/subjectsSlice";
import yearGroupsReducer from "../features/yearGroups/yearGroupsSlice";
import examsReducer from "../features/exams/examsSlice";
import examResultsReducer from "../features/examResults/examResultsSlice";
import questionsReducer from "../features/questions/questionsSlice";
import attendanceReducer from "../features/attendance/attendanceSlice";
import classReportsReducer from "../features/classReports/classReportsSlice";
import notificationsReducer from "../features/notifications/notificationsSlice";
import assignmentsReducer from "../features/assignments/assignmentsSlice";
import lessonNotesReducer from "../features/lessonNotes/lessonNotesSlice";
import timetableReducer from "../features/timetable/timetableSlice";
import announcementsReducer from "../features/announcements/announcementsSlice";
import reportCardsReducer from "../features/reportCards/reportCardsSlice";
import financeReducer from "../features/finance/financeSlice";
import parentAuthReducer from "../features/parentAuth/parentAuthSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    teacherAuth: teacherAuthReducer,
    parentAuth: parentAuthReducer,
    students: studentsReducer,
    teachers: teachersReducer,
    academicYears: academicYearsReducer,
    academicTerms: academicTermsReducer,
    classLevels: classLevelsReducer,
    programs: programsReducer,
    subjects: subjectsReducer,
    yearGroups: yearGroupsReducer,
    exams: examsReducer,
    examResults: examResultsReducer,
    questions: questionsReducer,
    attendance: attendanceReducer,
    classReports: classReportsReducer,
    notifications: notificationsReducer,
    assignments: assignmentsReducer,
    lessonNotes: lessonNotesReducer,
    timetable: timetableReducer,
    announcements: announcementsReducer,
    reportCards: reportCardsReducer,
    finance: financeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
