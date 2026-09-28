import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../app/hooks";
import {
  studentForgotPassword,
  studentResetPassword,
} from "../../features/students/studentsSlice";

const StudentForgotPassword: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Wizard Step: 1 = Verify Identity, 2 = Set New Password, 3 = Completed
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [verifiedStudent, setVerifiedStudent] = useState<{
    name?: string;
    studentId?: string;
    email?: string;
  } | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Step 1: Verify Student Account & Request Reset
  const handleVerifyIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email && !studentId) {
      setError("Please provide your registered Email or Matriculation Student ID.");
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(
        studentForgotPassword({
          email: email.trim(),
          studentId: studentId.trim(),
        })
      );

      if (studentForgotPassword.fulfilled.match(result)) {
        const data = result.payload as any;
        setResetToken(data.resetToken || "");
        setVerifiedStudent(data.student || { email, studentId });
        setSuccessMsg("Identity verified! Please set your new secure password.");
        setStep(2);
      } else {
        setError((result.payload as string) || "No student record found matching the provided details.");
      }
    } catch {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify and re-enter.");
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(
        studentResetPassword({
          password,
          token: resetToken,
          email: email.trim() || verifiedStudent?.email,
          studentId: studentId.trim() || verifiedStudent?.studentId,
        })
      );

      if (studentResetPassword.fulfilled.match(result)) {
        setStep(3);
      } else {
        setError((result.payload as string) || "Failed to reset password. Token may have expired.");
      }
    } catch {
      setError("An error occurred during password update. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b14] relative overflow-hidden px-4 py-12">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/15 blur-[130px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg space-y-6">
        {/* Header Back Navigation */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <Link
            to="/student/login"
            className="inline-flex items-center gap-2 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Student Login</span>
          </Link>
          <span className="font-mono text-indigo-400">Step {step} of 3</span>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
          {/* Logo / Cap Icon */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-xl shadow-indigo-600/30 border border-white/20">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {step === 1 && "Reset Student Password"}
                {step === 2 && "Create New Password"}
                {step === 3 && "Password Reset Complete"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                {step === 1 && "Verify your student credentials to recover your account"}
                {step === 2 && "Choose a strong password to protect your student portal"}
                {step === 3 && "Your credentials have been securely updated"}
              </p>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
              style={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
            />
          </div>

          {/* Alerts */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-medium flex items-start gap-2.5">
              <span className="text-base shrink-0">⚠️</span>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-medium flex items-start gap-2.5">
              <span className="text-base shrink-0">✓</span>
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* STEP 1: Verify Identity Form */}
          {step === 1 && (
            <form onSubmit={handleVerifyIdentity} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="reset-email" className="block text-xs font-semibold text-slate-300">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  id="reset-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@school.edu"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm transition-all"
                />
              </div>

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-white/10 w-full" />
                <span className="bg-slate-900 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  OR
                </span>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reset-studentid" className="block text-xs font-semibold text-slate-300">
                  Matriculation / Student ID
                </label>
                <input
                  type="text"
                  id="reset-studentid"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. STU1234..."
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm font-mono transition-all"
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-normal">
                💡 Tip: You can provide either your registered university email or your student matriculation ID to verify your identity.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Student Account...</span>
                  </>
                ) : (
                  <span>Verify Account & Continue →</span>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Set New Password Form */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* Student Verified Pill */}
              {verifiedStudent && (
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-sm">{verifiedStudent.name || "Student Account"}</div>
                    <div className="text-[11px] text-indigo-300 font-mono">
                      ID: {verifiedStudent.studentId || studentId || "STU-VERIFIED"}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ✓ Verified
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="new-password" className="block text-xs font-semibold text-slate-300">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirm-new-password" className="block text-xs font-semibold text-slate-300">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirm-new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm transition-all"
                />
              </div>

              {/* Password Quality Checklist */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5 text-[11px]">
                <div className={`flex items-center gap-1.5 ${password.length >= 6 ? "text-emerald-400" : "text-slate-400"}`}>
                  <span>{password.length >= 6 ? "✓" : "○"}</span>
                  <span>At least 6 characters long</span>
                </div>
                <div className={`flex items-center gap-1.5 ${password && password === confirmPassword ? "text-emerald-400" : "text-slate-400"}`}>
                  <span>{password && password === confirmPassword ? "✓" : "○"}</span>
                  <span>Passwords match</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Confirm & Reset Password</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Complete Success Screen */}
          {step === 3 && (
            <div className="text-center space-y-6 py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-3xl">
                ✓
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Password Reset Successful</h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Your student portal password has been successfully updated. You can now use your new password to sign into your student account.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/student/login")}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Proceed to Student Sign In</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer Assistance */}
          <div className="pt-4 border-t border-white/10 text-center">
            <p className="text-xs text-slate-400">
              Remember your password?{" "}
              <Link to="/student/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* System copyright */}
        <p className="text-center text-slate-500 text-xs">
          School Management System &copy; {new Date().getFullYear()} • Secure Student Authentication
        </p>
      </div>
    </div>
  );
};

export default StudentForgotPassword;
