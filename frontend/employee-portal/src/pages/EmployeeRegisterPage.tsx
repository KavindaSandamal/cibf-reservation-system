import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '../services/authService';
import { toast } from 'react-toastify';

// Simple email validation
const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  employeeId: string;
}

const EmployeeRegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    employeeId: '',
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof RegisterFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RegisterFormData, string>> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!isValidEmail(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required';
    }

    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
        employeeId: formData.employeeId.trim(),
        role: 'EMPLOYEE',
      });

      toast.success('Registration successful! Please login.');
      navigate('/employee/login');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      {/* Decorative background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-1/4 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.slate.800)_1px,transparent_1px)] [background-size:18px_18px] opacity-40" />
        <div className="absolute -left-24 -top-24 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/30 blur-2xl" />
        <div className="animation-delay-2000 absolute -right-24 top-1/3 h-72 w-72 animate-blob rounded-full bg-amber-400/25 blur-2xl" />
        <div className="animation-delay-4000 absolute left-1/2 bottom-0 h-72 w-72 -translate-x-1/2 animate-blob rounded-full bg-cyan-400/25 blur-2xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-indigo-500/40 to-fuchsia-500/40 blur" />
            <div className="relative rounded-3xl border border-slate-700/70 bg-slate-900/70 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
              {/* Header */}
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 shadow-lg">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h2 className="bg-gradient-to-r from-indigo-300 to-fuchsia-300 bg-clip-text text-3xl font-black tracking-tight text-transparent">
                  Employee Registration
                </h2>
                <p className="mt-1 text-sm text-slate-300">Create your employee account</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Username */}
                <div>
                  <label htmlFor="username" className="mb-1 block text-sm font-medium text-slate-200">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-3 text-white placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                    placeholder="Enter username"
                    required
                  />
                  {errors.username && <p className="mt-1 text-sm text-rose-400">{errors.username}</p>}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-200">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-3 text-white placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                    placeholder="employee@cibf.com"
                    required
                  />
                  {errors.email && <p className="mt-1 text-sm text-rose-400">{errors.email}</p>}
                </div>

                {/* Name */}
                <div>
                  <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-200">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-3 text-white placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                    placeholder="John Doe"
                    required
                  />
                  {errors.name && <p className="mt-1 text-sm text-rose-400">{errors.name}</p>}
                </div>

                {/* Employee ID */}
                <div>
                  <label htmlFor="employeeId" className="mb-1 block text-sm font-medium text-slate-200">
                    Employee ID
                  </label>
                  <input
                    id="employeeId"
                    name="employeeId"
                    type="text"
                    value={formData.employeeId}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-3 text-white placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                    placeholder="EMP-001"
                    required
                  />
                  {errors.employeeId && <p className="mt-1 text-sm text-rose-400">{errors.employeeId}</p>}
                </div>

                {/* Password */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-200">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="text-xs font-medium text-indigo-300 hover:underline"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-3 text-white placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                    placeholder="••••••••"
                    required
                  />
                  {errors.password && <p className="mt-1 text-sm text-rose-400">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-200">
                      Confirm Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((s) => !s)}
                      className="text-xs font-medium text-indigo-300 hover:underline"
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-3 text-white placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                    placeholder="••••••••"
                    required
                  />
                  {errors.confirmPassword && <p className="mt-1 text-sm text-rose-400">{errors.confirmPassword}</p>}
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
                      Creating account…
                    </>
                  ) : (
                    <>
                      Create Account
                      <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </motion.button>
              </form>

              {/* Login Link */}
              <p className="mt-6 text-center text-sm text-slate-400">
                Already have an account?{' '}
                <Link to="/employee/login" className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">
                  Sign in
                </Link>
              </p>

              {/* Back to Welcome */}
              <p className="mt-4 text-center text-sm text-slate-400">
                <Link to="/employee" className="text-indigo-400 hover:text-indigo-300 hover:underline">
                  ← Back to Welcome
                </Link>
              </p>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} CIBF Reservation System. Employee Portal.
            </p>
          </div>
        </motion.div>
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

export default EmployeeRegisterPage;