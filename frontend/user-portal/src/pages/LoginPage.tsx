import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";

// ──────────────────────────────────────────────────────────────────────────────
// Hardcoded test credentials for development/testing
// ──────────────────────────────────────────────────────────────────────────────
const TEST_CREDENTIALS = {
  email: "test@example.com",
  password: "password123",
};

// Simple email validation (client-side convenience only)
const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // form states
  const [email, setEmail] = useState(TEST_CREDENTIALS.email);
  const [password, setPassword] = useState(TEST_CREDENTIALS.password);
  const [remember, setRemember] = useState(false);

  // UI states
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // derived: password strength meter (very light heuristic)
  const pwdStrength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score; // 0–4
  }, [password]);

  const strengthLabel = ["Very weak", "Weak", "Fair", "Good", "Strong"][pwdStrength] || "";

  // ──────────────────────────────────────────────────────────────────────────────
  // handlers
  // ──────────────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!isValidEmail(email)) nextErrors.email = "Enter a valid email";
    if (!password) nextErrors.password = "Password is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
      // Optionally persist remember flag
      if (remember) localStorage.setItem("cibf_remember_email", email.trim());
      navigate("/dashboard");
    } catch (err) {
      // Error is handled inside AuthContext; we keep UI responsive here.
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setEmail(TEST_CREDENTIALS.email);
    setPassword(TEST_CREDENTIALS.password);
    setLoading(true);
    try {
      await login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
      navigate("/dashboard");
    } catch (err) {
      // handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // UI
  // ──────────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950">
      {/* Decorative background: radial spotlight + grid + blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* soft radial */}
        <div className="absolute -top-1/4 left-1/2 -translate-x-1/2 h-[40rem] w-[40rem] rounded-full bg-indigo-400/20 blur-3xl" />
        {/* grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.slate.200)_1px,transparent_1px)] [background-size:18px_18px] dark:bg-[radial-gradient(circle_at_1px_1px,theme(colors.slate.800)_1px,transparent_1px)]" />
        {/* animated blobs */}
        <div className="absolute -left-24 -top-24 h-72 w-72 animate-blob rounded-full bg-fuchsia-300/30 blur-2xl" />
        <div className="animation-delay-2000 absolute -right-24 top-1/3 h-72 w-72 animate-blob rounded-full bg-amber-300/30 blur-2xl" />
        <div className="animation-delay-4000 absolute left-1/2 bottom-10 h-72 w-72 -translate-x-1/2 animate-blob rounded-full bg-cyan-300/30 blur-2xl" />
      </div>

      {/* Page container */}
      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:py-16">
        {/* Showcase / branding side */}
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="order-2 hidden lg:order-1 lg:block"
        >
          <div className="relative">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-400/40 to-fuchsia-400/40 blur-xl" />
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/60 p-10 shadow-2xl backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/60">
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-indigo-200 bg-indigo-50/70 px-4 py-1 text-sm font-medium text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-indigo-500" /> Live access • CIBF Reservation
              </div>
              <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Welcome back to
                <span className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-purple-600 bg-clip-text text-transparent"> CIBF</span>
              </h1>
              <p className="mb-8 max-w-prose text-slate-600 dark:text-slate-300">
                Manage your stalls, passes, and schedules with a refreshed, elegant interface. Sign in to continue where you left off.
              </p>

              {/* Feature bullets */}
              <ul className="mb-8 grid gap-3 text-sm text-slate-700 dark:text-slate-200">
                {[
                  "Fast, secure access with session protection",
                  "Real‑time reservation overview",
                  "Smart notifications & reminders",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 text-emerald-600 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                      ✓
                    </span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>

              {/* faux stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { k: "Uptime", v: "99.9%" },
                  { k: "Users", v: "12k+" },
                  { k: "Latency", v: "< 120ms" },
                ].map((s) => (
                  <div
                    key={s.k}
                    className="rounded-2xl border border-white/30 bg-white/50 p-4 text-center shadow dark:border-slate-700/60 dark:bg-slate-900/60"
                  >
                    <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{s.k}</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Auth card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="order-1 lg:order-2"
        >
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-indigo-500/40 to-fuchsia-500/40 blur" />
            <div className="relative rounded-3xl border border-white/30 bg-white/70 p-8 shadow-2xl backdrop-blur-xl sm:p-10 dark:border-slate-700/70 dark:bg-slate-900/70">
              {/* Logo */}
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 shadow-lg">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="bg-gradient-to-r from-indigo-700 to-fuchsia-700 bg-clip-text text-3xl font-black tracking-tight text-transparent dark:from-indigo-300 dark:to-fuchsia-300">
                  Sign in
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">to your CIBF Reservation account</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Email address
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-slate-400">
                      <svg className={`h-5 w-5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-xl border border-slate-300 bg-white/70 px-10 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200/70 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/20"
                      placeholder="name@company.com"
                      required
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-rose-600">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-300"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-slate-400">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl border border-slate-300 bg-white/70 px-10 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200/70 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/20"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-rose-600">{errors.password}</p>}

                  {/* Strength meter */}
                  <div className="mt-2">
                    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 transition-all ${
                            i < pwdStrength ? "bg-emerald-500" : "bg-transparent"
                          }`}
                        />
                      ))}
                    </div>
                    {password && (
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Strength: {strengthLabel}</div>
                    )}
                  </div>
                </div>

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-300">Remember me</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline dark:text-indigo-300"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  type="submit"
                  disabled={loading}
                  className="group relative inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-3 font-semibold text-white shadow-lg outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <svg className="-ml-1 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in
                      <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </motion.button>

                {/* Dev-only Quick Login */}
                {import.meta.env.DEV && (
                  <div className="space-y-3">
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-300 dark:border-slate-700" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-3 text-slate-500 dark:bg-slate-900 dark:text-slate-400">OR</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleQuickLogin}
                      disabled={loading}
                      title="Quick login with test credentials (Development only)"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-emerald-300 bg-emerald-50 px-4 py-3 font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Quick Login (Test Account)
                    </button>
                  </div>
                )}

                {/* Register */}
                <p className="text-center text-sm text-slate-600 dark:text-slate-300">
                  Don\'t have an account?{" "}
                  <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline dark:text-indigo-300">
                    Create one now
                  </Link>
                </p>
              </form>
            </div>

            {/* small footer */}
            <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">© {new Date().getFullYear()} CIBF Reservation System. All rights reserved.</p>
          </div>
        </motion.section>
      </div>

      {/* Local styles for blob animation */}
      <style>{`
        @keyframes blob { 0%, 100% { transform: translate(0,0) scale(1);} 33% { transform: translate(30px, -50px) scale(1.1);} 66% { transform: translate(-20px, 20px) scale(0.9);} }
        .animate-blob { animation: blob 8s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default LoginPage;
