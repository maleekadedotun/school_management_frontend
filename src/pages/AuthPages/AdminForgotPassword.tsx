import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppDispatch } from "../../app/hooks";
import {
  adminForgotPassword,
  adminResetPassword,
} from "../../features/auth/authSlice";

const AdminForgotPassword: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token: routeToken } = useParams<{ token?: string }>();

  // Wizard Step: 1 = Verify Identity, 2 = Set New Password, 3 = Completed
  const [step, setStep] = useState<1 | 2 | 3>(routeToken ? 2 : 1);

  // Form Fields
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState(routeToken || "");
  const [verifiedAdmin, setVerifiedAdmin] = useState<{
    name?: string;
    email?: string;
    role?: string;
  } | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (routeToken) {
      setResetToken(routeToken);
      setStep(2);
    }
  }, [routeToken]);

  // Step 1: Verify Admin Account & Request Reset
  const handleVerifyIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email) {
      setError("Please enter your registered administrator email address.");
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(
        adminForgotPassword({
          email: email.trim(),
        })
      );

      if (adminForgotPassword.fulfilled.match(result)) {
        const data = result.payload as any;
        setResetToken(data.resetToken || "");
        setVerifiedAdmin(data.admin || { email });
        setSuccessMsg("Administrator account verified! Set your new master password.");
        setStep(2);
      } else {
        setError(
          (result.payload as string) || "No administrator record found with that email address."
        );
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
        adminResetPassword({
          password,
          token: resetToken,
          email: email.trim() || verifiedAdmin?.email,
        })
      );

      if (adminResetPassword.fulfilled.match(result)) {
        setStep(3);
      } else {
        setError(
          (result.payload as string) || "Failed to reset password. The link or token may have expired."
        );
      }
    } catch {
      setError("Network error while resetting password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Password strength checker helper
  const getPasswordStrength = () => {
    if (!password) return { label: "Empty", score: 0, color: "bg-slate-700" };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { label: "Weak", score: 33, color: "bg-red-500" };
    if (score <= 4) return { label: "Medium", score: 66, color: "bg-amber-500" };
    return { label: "Strong", score: 100, color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-900/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-xl shadow-indigo-500/20 mb-4 border border-indigo-400/30">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Admin Console</h1>
          <p className="text-slate-400 mt-1 text-sm">Administrator Security & Password Reset</p>
        </div>

        {/* Wizard Card */}
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-7 md:p-8 shadow-2xl relative">
          {/* Step Progress Indicators */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  step >= 1
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-white/10 text-slate-400"
                }`}
              >
                1
              </span>
              <span className={`text-xs font-medium ${step >= 1 ? "text-white" : "text-slate-400"}`}>
                Verify
              </span>
            </div>

            <div className={`h-0.5 flex-1 mx-3 ${step >= 2 ? "bg-indigo-500" : "bg-white/10"}`} />

            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  step >= 2
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-white/10 text-slate-400"
                }`}
              >
                2
              </span>
              <span className={`text-xs font-medium ${step >= 2 ? "text-white" : "text-slate-400"}`}>
                Reset
              </span>
            </div>

            <div className={`h-0.5 flex-1 mx-3 ${step >= 3 ? "bg-indigo-500" : "bg-white/10"}`} />

            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  step === 3
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-white/10 text-slate-400"
                }`}
              >
                ✓
              </span>
              <span className={`text-xs font-medium ${step === 3 ? "text-white" : "text-slate-400"}`}>
                Done
              </span>
            </div>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3 animate-fadeIn">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-sm flex items-start gap-3 animate-fadeIn">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM16.707 7.707a1 1 0 00-1.414-1.414L9 12.586 5.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l7-7z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: VERIFY IDENTITY */}
          {step === 1 && (
            <form onSubmit={handleVerifyIdentity} className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white">Find Administrator Account</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your registered administrator email to verify identity and receive an authentication reset session.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Admin Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206"
                      />
                    </svg>
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@school.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Verifying Credentials...
                  </>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: SET NEW PASSWORD */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-5 animate-fadeIn">
              <div>
                <h2 className="text-lg font-semibold text-white">Create New Master Password</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Choose a robust password to ensure security across the institution management portal.
                </p>
              </div>

              {verifiedAdmin?.name && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                    {verifiedAdmin.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-white truncate">{verifiedAdmin.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {verifiedAdmin.email} • Role: {verifiedAdmin.role || "Administrator"}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    New Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                />

                {/* Password strength meter */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Strength:</span>
                      <span
                        className={`font-semibold ${
                          strength.label === "Strong"
                            ? "text-emerald-400"
                            : strength.label === "Medium"
                            ? "text-amber-400"
                            : "text-red-400"
                        }`}
                      >
                        {strength.label}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                {!routeToken && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError(null);
                    }}
                    className="w-1/3 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium transition text-xs border border-white/10"
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading || password.length < 6 || password !== confirmPassword}
                  className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Updating Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: COMPLETED */}
          {step === 3 && (
            <div className="text-center py-4 space-y-6 animate-fadeIn">
              <div className="w-16 h-16 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/20">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">Password Updated!</h3>
                <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
                  Administrator password has been successfully reset. You can now authenticate into the management portal.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/signin")}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold transition-all shadow-lg shadow-indigo-500/25 cursor-pointer text-sm"
                >
                  Proceed to Admin Sign In
                </button>
              </div>
            </div>
          )}

          {/* Footer Back link */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <Link
              to="/signin"
              className="text-xs text-slate-400 hover:text-indigo-300 transition flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Admin Login</span>
            </Link>
          </div>
        </div>

        {/* Global Footer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          School Management System &copy; {new Date().getFullYear()} • Secure Portal
        </p>
      </div>
    </div>
  );
};

export default AdminForgotPassword;
