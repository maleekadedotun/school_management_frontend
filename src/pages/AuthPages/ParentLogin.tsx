import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { loginParent, clearParentErrors } from "../../features/parentAuth/parentAuthSlice";
import toast from "react-hot-toast";

export default function ParentLogin() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.parentAuth);

  // Login form
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(clearParentErrors());
    const res = await dispatch(loginParent(loginForm));
    if (loginParent.fulfilled.match(res)) {
      toast.success("Welcome back! Signed in successfully.");
      navigate("/parent/dashboard");
    } else {
      toast.error((res.payload as string) || "Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e] relative overflow-hidden py-12">
      {/* Background glow orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Back button */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Home</span>
          </button>
        </div>

        {/* Card header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/40 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Parent Portal</h1>
          <p className="text-slate-400 text-sm mt-1">Manage school fees, view invoices and download payment receipts</p>
        </div>

        {/* Glass Card Container */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Sign In to Your Account</h2>
            <p className="text-xs text-slate-400 mt-1">Enter your registered parent email address and password</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Parent Email</label>
              <input
                type="email"
                required
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                placeholder="parent@example.com"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-xl transition duration-200 shadow-lg shadow-indigo-500/25 disabled:opacity-50 text-sm cursor-pointer"
            >
              {loading ? "Authenticating..." : "Sign In to Parent Portal"}
            </button>
          </form>

          {/* Admin Registration Notice */}
          <div className="mt-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-slate-300 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-indigo-300">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Need a Parent Account?</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Parent accounts are registered exclusively by the school administration to ensure child records are securely linked. Please contact the school administrator to receive your login credentials.
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800 flex justify-between text-xs text-slate-400">
            <Link to="/student/login" className="hover:text-indigo-400 transition-colors">
              Student Login →
            </Link>
            <Link to="/signin" className="hover:text-indigo-400 transition-colors">
              Admin Portal →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
