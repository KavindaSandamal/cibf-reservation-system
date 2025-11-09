import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";

// Lightweight email check (client‑side convenience only)
const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    terms: false,
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Derived flags
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;
  const passwordsMismatch = formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;

  // Password strength (0–4)
  const strength = useMemo(() => {
    const p = formData.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }, [formData.password]);

  const strengthLabel = ["Very weak", "Weak", "Fair", "Good", "Strong"][strength] || "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!formData.firstName.trim()) next.firstName = "First name is required";
    if (!formData.lastName.trim()) next.lastName = "Last name is required";
    if (!isValidEmail(formData.email)) next.email = "Enter a valid email";
    if (formData.password.length < 8) next.password = "Use at least 8 characters";
    if (!/[A-Z]/.test(formData.password)) next.password = (next.password ? next.password + "; " : "") + "add an uppercase letter";
    if (!/[0-9]/.test(formData.password)) next.password = (next.password ? next.password + "; " : "") + "add a number";
    if (formData.password !== formData.confirmPassword) next.confirmPassword = "Passwords do not match";
    if (!formData.terms) next.terms = "You must agree to continue";
    setErrors(next);
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setLoading(true);
    try {
      await register({
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      });
      toast.success("Account created! Redirecting…");
      navigate("/dashboard");
    } catch (error) {
      // Error surfaced by AuthContext (and optionally toast there).
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950">
      {/* Background: grid + blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-1/3 left-1/2 h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-fuchsia-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.slate.200)_1px,transparent_1px)] [background-size:18px_18px] dark:bg-[radial-gradient(circle_at_1px_1px,theme(colors.slate.800)_1px,transparent_1px)]" />
        <div className="absolute -left-24 top-20 h-72 w-72 animate-blob rounded-full bg-amber-300/30 blur-2xl" />
        <div className="animation-delay-2000 absolute right-10 bottom-24 h-72 w-72 animate-blob rounded-full bg-cyan-300/30 blur-2xl" />
        <div className="animation-delay-4000 absolute left-1/2 bottom-10 h-72 w-72 -translate-x-1/2 animate-blob rounded-full bg-indigo-300/30 blur-2xl" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:py-16">
        {/* Showcase / value prop */}
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="order-2 hidden lg:order-1 lg:block"
        >
          <div className="relative">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-400/40 to-fuchsia-400/40 blur-xl" />
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/60 p-10 shadow-2xl backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/60">
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-fuchsia-200 bg-fuchsia-50/70 px-4 py-1 text-sm font-medium text-fuchsia-700 dark:border-fuchsia-500/30 dark:bg-fuchsia-500/10 dark:text-fuchsia-300">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-fuchsia-500" /> Create your account
              </div>
              <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Start your CIBF journey
              </h1>
              <p className="mb-6 max-w-prose text-slate-600 dark:text-slate-300">
                Reserve stalls, manage passes, and track schedules with ease. Signing up takes less than a minute.
              </p>

              {/* Steps */}
              <ol className="mb-8 space-y-3">
                {[
                  { t: "Create account", d: "Secure credentials and profile" },
                  { t: "Verify email", d: "Confirm your address" },
                  { t: "Access dashboard", d: "Manage reservations instantly" },
                ].map((s, i) => (
                  <li key={s.t} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow">{i + 1}</span>
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-100">{s.t}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">{s.d}</div>
                    </div>
                  </li>
                ))}
              </ol>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { k: "Security", v: "2FA ready" },
                  { k: "Uptime", v: "99.9%" },
                  { k: "Support", v: "24/7" },
                ].map((b) => (
                  <div key={b.k} className="rounded-2xl border border-white/30 bg-white/50 p-4 text-center shadow dark:border-slate-700/60 dark:bg-slate-900/60">
                    <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{b.k}</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">{b.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Form card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="order-1 lg:order-2"
        >
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-fuchsia-500/40 to-indigo-500/40 blur" />
            <div className="relative rounded-3xl border border-white/30 bg-white/70 p-8 shadow-2xl backdrop-blur-xl sm:p-10 dark:border-slate-700/70 dark:bg-slate-900/70">
              {/* Logo / Heading */}
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-600 to-indigo-600 shadow-lg">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h2 className="bg-gradient-to-r from-fuchsia-700 to-indigo-700 bg-clip-text text-3xl font-black tracking-tight text-transparent dark:from-fuchsia-300 dark:to-indigo-300">
                  Create your account
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Names */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[{ id: "firstName", label: "First name", placeholder: "John" }, { id: "lastName", label: "Last name", placeholder: "Doe" }].map((f) => (
                    <div key={f.id}>
                      <label htmlFor={f.id} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">{f.label}</label>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-slate-400">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </span>
                        <input
                          id={f.id}
                          name={f.id}
                          type="text"
                          value={(formData as any)[f.id]}
                          onChange={handleChange}
                          onFocus={() => setFocused(f.id)}
                          onBlur={() => setFocused(null)}
                          className={`block w-full rounded-xl border bg-white/70 px-10 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-200/70 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-fuchsia-400 dark:focus:ring-fuchsia-500/20 ${errors[f.id] ? "border-rose-400" : "border-slate-300"}`}
                          placeholder={f.placeholder}
                          required
                        />
                      </div>
                      {errors[f.id] && <p className="mt-1 text-xs text-rose-600">{errors[f.id]}</p>}
                    </div>
                  ))}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Email address</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-slate-400">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                    </span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={() => setFocused("email")}
                      onBlur={() => setFocused(null)}
                      className={`block w-full rounded-xl border bg-white/70 px-10 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-200/70 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-fuchsia-400 dark:focus:ring-fuchsia-500/20 ${errors.email ? "border-rose-400" : "border-slate-300"}`}
                      placeholder="name@company.com"
                      required
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Password</label>
                    <button type="button" onClick={() => setShowPassword((s) => !s)} className="text-xs font-medium text-fuchsia-600 hover:underline dark:text-fuchsia-300">{showPassword ? "Hide" : "Show"}</button>
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-slate-400">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </span>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => setFocused("password")}
                      onBlur={() => setFocused(null)}
                      className={`block w-full rounded-xl border bg-white/70 px-10 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-200/70 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-fuchsia-400 dark:focus:ring-fuchsia-500/20 ${errors.password ? "border-rose-400" : "border-slate-300"}`}
                      placeholder="Create a strong password"
                      required
                    />
                  </div>
                  {/* Strength meter */}
                  <div className="mt-2">
                    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className={`flex-1 transition-all ${i < strength ? "bg-emerald-500" : "bg-transparent"}`} />
                      ))}
                    </div>
                    {formData.password && (
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Strength: {strengthLabel}</div>
                    )}
                  </div>
                  {/* Hints */}
                  <ul className="mt-2 grid gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <li className={`${formData.password.length >= 8 ? "text-emerald-600" : ""}`}>• At least 8 characters</li>
                    <li className={`${/[A-Z]/.test(formData.password) ? "text-emerald-600" : ""}`}>• One uppercase letter</li>
                    <li className={`${/[0-9]/.test(formData.password) ? "text-emerald-600" : ""}`}>• One number</li>
                    <li className={`${/[^A-Za-z0-9]/.test(formData.password) ? "text-emerald-600" : ""}`}>• One symbol (recommended)</li>
                  </ul>
                  {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Confirm password</label>
                    <button type="button" onClick={() => setShowConfirmPassword((s) => !s)} className="text-xs font-medium text-fuchsia-600 hover:underline dark:text-fuchsia-300">{showConfirmPassword ? "Hide" : "Show"}</button>
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-slate-400">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onFocus={() => setFocused("confirmPassword")}
                      onBlur={() => setFocused(null)}
                      className={`block w-full rounded-xl border bg-white/70 px-10 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-200/70 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-fuchsia-400 dark:focus:ring-fuchsia-500/20 ${passwordsMismatch ? "border-rose-400" : passwordsMatch ? "border-emerald-400" : "border-slate-300"}`}
                      placeholder="Re-enter your password"
                      required
                    />
                  </div>
                  {passwordsMismatch && (
                    <p className="mt-1 text-xs text-rose-600">Passwords do not match</p>
                  )}
                  {errors.confirmPassword && <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword}</p>}
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={formData.terms}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-fuchsia-600 focus:ring-fuchsia-500"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-slate-600 dark:text-slate-300">
                    I agree to the {" "}
                    <Link to="/terms" className="font-medium text-fuchsia-600 hover:text-fuchsia-700 hover:underline dark:text-fuchsia-300">Terms and Conditions</Link>
                    {" "}and {" "}
                    <Link to="/privacy" className="font-medium text-fuchsia-600 hover:text-fuchsia-700 hover:underline dark:text-fuchsia-300">Privacy Policy</Link>
                  </label>
                </div>
                {errors.terms && <p className="-mt-1 text-xs text-rose-600">{errors.terms}</p>}

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  type="submit"
                  disabled={loading}
                  className="group relative inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-4 py-3 font-semibold text-white shadow-lg outline-none transition focus-visible:ring-2 focus-visible:ring-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <svg className="-ml-1 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating account…
                    </>
                  ) : (
                    <>
                      Create Account
                      <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </>
                  )}
                </motion.button>

                {/* Sign in link */}
                <p className="text-center text-sm text-slate-600 dark:text-slate-300">
                  Already have an account? {" "}
                  <Link to="/login" className="font-semibold text-fuchsia-600 hover:text-fuchsia-700 hover:underline dark:text-fuchsia-300">
                    Sign in
                  </Link>
                </p>
              </form>
            </div>

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

export default RegisterPage;
