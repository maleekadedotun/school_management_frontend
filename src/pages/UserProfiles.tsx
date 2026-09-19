import { useAppSelector } from "../app/hooks";

export default function UserProfiles() {
  const { admin } = useAppSelector((s) => s.auth);
  const { students } = useAppSelector((s) => s.students);
  const { teachers } = useAppSelector((s) => s.teachers);

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 border border-white/10 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-indigo-500/30 border-2 border-white/20 shrink-0">
            {admin?.name?.[0]?.toUpperCase() || "A"}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className="text-3xl font-bold text-white tracking-tight">{admin?.name || "Admin User"}</h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 w-fit mx-auto sm:mx-0">
                School Administrator
              </span>
            </div>
            <p className="text-slate-300 text-sm">{admin?.email || "admin@school.edu"}</p>
            <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-4 text-xs text-slate-400">
              <span>System Role: <strong className="text-white font-medium">Super Admin</strong></span>
              <span>•</span>
              <span>Status: <strong className="text-emerald-400 font-medium">Active</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur space-y-1">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Managed Students</p>
          <p className="text-3xl font-bold text-white">{students?.length || 0}</p>
          <p className="text-indigo-400 text-xs font-medium">Total active & graduated</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur space-y-1">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Managed Teachers</p>
          <p className="text-3xl font-bold text-white">{teachers?.length || 0}</p>
          <p className="text-violet-400 text-xs font-medium">Registered educators</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur space-y-1">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Access Scope</p>
          <p className="text-3xl font-bold text-emerald-400">Full</p>
          <p className="text-emerald-400/80 text-xs font-medium">System administrative privilege</p>
        </div>
      </div>

      {/* Profile Details & Permissions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Personal Information
          </h2>
          <div className="space-y-3 divide-y divide-white/5">
            <div className="pt-2 flex justify-between text-sm">
              <span className="text-slate-400">Full Name</span>
              <span className="text-white font-medium">{admin?.name || "Admin"}</span>
            </div>
            <div className="pt-3 flex justify-between text-sm">
              <span className="text-slate-400">Email Address</span>
              <span className="text-white font-medium">{admin?.email || "admin@school.edu"}</span>
            </div>
            <div className="pt-3 flex justify-between text-sm">
              <span className="text-slate-400">Role</span>
              <span className="text-indigo-400 font-medium">Admin</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Administrative Capabilities
          </h2>
          <div className="space-y-2">
            {[
              "Manage Academic Years & Terms",
              "Register & Suspend Students",
              "Approve & Manage Teachers",
              "Create & Publish Exam Results",
              "Configure Academic Programs & Subjects",
            ].map((perm) => (
              <div key={perm} className="flex items-center gap-2 text-sm text-slate-300">
                <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {perm}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
