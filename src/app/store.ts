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
export const store = configureStore({
  reducer: {
    auth: authReducer,
    teacherAuth: teacherAuthReducer,
    students: studentsReducer,
    teachers: teachersReducer,
    academicYears: academicYearsReducer,
    academicTerms: academicTermsReducer,
    classLevels: classLevelsReducer,
    programs: programsReducer,
    subjects: subjectsReducer,
    yearGroups: yearGroupsReducer,
    exams: examsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
