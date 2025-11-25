import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { employeeService } from '../services/employeeService';
import { toast } from 'react-toastify';

interface CreateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (staff?: any) => void; // optional: return created staff
  mode: 'employee' | 'admin';
}

interface CreateStaffFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  employeeId: string;
  contactNumber: string;
  department: string;
}

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);
const isStrongPassword = (pwd: string) => /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd);

const CreateStaffModal: React.FC<CreateStaffModalProps> = ({ isOpen, onClose, onSuccess, mode }) => {
  const [formData, setFormData] = useState<CreateStaffFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    employeeId: '',
    contactNumber: '',
    department: '',
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateStaffFormData, string>>>({});

  const modalTitle = mode === 'admin' ? 'Create New Admin' : 'Create New Employee';
  const modalSubtitle = mode === 'admin' ? 'Add a new administrator account' : 'Add a new employee account';
  const submitButtonText = mode === 'admin' ? 'Create Admin' : 'Create Employee';
  const successMessage = mode === 'admin' ? 'Admin created successfully!' : 'Employee created successfully!';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof CreateStaffFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Partial<Record<keyof CreateStaffFormData, string>> = {};

    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!isValidEmail(formData.email)) newErrors.email = 'Enter a valid email address';
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.employeeId.trim()) newErrors.employeeId = mode === 'admin' ? 'Admin ID is required' : 'Employee ID is required';

    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (mode === 'admin' && !isStrongPassword(formData.password)) newErrors.password = 'Admin password must have 8+ chars, 1 uppercase, 1 number';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    try {
      if (!newErrors.email || !newErrors.employeeId) {
        const duplicateCheck = await employeeService.checkExists(formData.email.trim(), formData.employeeId.trim());
        if (duplicateCheck.email) newErrors.email = 'Email already exists';
        if (duplicateCheck.employeeId) newErrors.employeeId = `${mode === 'admin' ? 'Admin' : 'Employee'} ID already exists`;
      }
    } catch (err) {
      console.warn('Duplicate check failed', err);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    if (!(await validateForm())) {
      setLoading(false);
      return;
    }

    const payload = {
      username: formData.username.trim(),
      email: formData.email.trim(),
      password: formData.password,
      name: formData.name.trim(),
      employeeId: formData.employeeId.trim(),
      contactNumber: formData.contactNumber.trim() || undefined,
      department: formData.department.trim() || undefined,
    };

    try {
      const result = await employeeService.createStaff(payload, mode.toUpperCase() as 'ADMIN' | 'EMPLOYEE');
      toast.success(successMessage);
      resetForm();
      onSuccess(result);
      onClose();
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        toast.error(error.message || `Failed to create ${mode}. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      employeeId: '',
      contactNumber: '',
      department: '',
    });
    setErrors({});
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-2xl rounded-2xl border-2 border-slate-700/70 bg-slate-900/95 shadow-2xl backdrop-blur-xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700 bg-slate-900/95 px-6 py-4 backdrop-blur-sm">
              <div>
                <h2 className="text-2xl font-bold text-white">{modalTitle}</h2>
                <p className="text-sm text-slate-400">{modalSubtitle}</p>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div className="md:col-span-2">
                  <label htmlFor="username" className="block text-sm font-medium text-slate-200 mb-1">Username</label>
                  <input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    type="email"
                    placeholder="employee@cibf.com"
                    className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-white placeholder:text-slate-400 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    disabled={loading}
                  />
                  {errors.username && <p className="mt-1 text-sm text-rose-400">{errors.username}</p>}
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-1">Email Address</label>
                  <input
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    type="email"
                    placeholder="employee@cibf.com"
                    className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-white placeholder:text-slate-400 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    disabled={loading}
                  />
                  {errors.email && <p className="mt-1 text-sm text-rose-400">{errors.email}</p>}
                </div>

                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-200 mb-1">Full Name</label>
                  <input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    type="text"
                    placeholder="John Doe"
                    className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-white placeholder:text-slate-400 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    disabled={loading}
                  />
                  {errors.name && <p className="mt-1 text-sm text-rose-400">{errors.name}</p>}
                </div>

                {/* Employee/Admin ID */}
                <div>
                  <label htmlFor="employeeId" className="block text-sm font-medium text-slate-200 mb-1">{mode === 'admin' ? 'Admin ID' : 'Employee ID'}</label>
                  <input
                    id="employeeId"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    type="text"
                    placeholder={mode === 'admin' ? 'ADM-001' : 'EMP-001'}
                    className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-white placeholder:text-slate-400 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    disabled={loading}
                  />
                  {errors.employeeId && <p className="mt-1 text-sm text-rose-400">{errors.employeeId}</p>}
                </div>

                {/* Contact Number */}
                <div>
                  <label htmlFor="contactNumber" className="block text-sm font-medium text-slate-200 mb-1">Contact Number</label>
                  <input
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    type="tel"
                    placeholder="+1234567890"
                    className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-white placeholder:text-slate-400 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    disabled={loading}
                  />
                </div>

                {/* Department */}
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-slate-200 mb-1">Department</label>
                  <input
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    type="text"
                    placeholder="IT, HR, Operations"
                    className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-white placeholder:text-slate-400 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    disabled={loading}
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-200">Password</label>
                    <button
                      type="button"
                      className="text-xs font-medium text-indigo-300 hover:underline"
                      onClick={() => setShowPassword(s => !s)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-white placeholder:text-slate-400 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    disabled={loading}
                  />
                  {errors.password && <p className="mt-1 text-sm text-rose-400">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-200">Confirm Password</label>
                    <button
                      type="button"
                      className="text-xs font-medium text-indigo-300 hover:underline"
                      onClick={() => setShowConfirmPassword(s => !s)}
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-white placeholder:text-slate-400 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    disabled={loading}
                  />
                  {errors.confirmPassword && <p className="mt-1 text-sm text-rose-400">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg border border-slate-600 bg-slate-800/60 text-slate-300 hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-semibold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating...
                    </span>
                  ) : submitButtonText}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateStaffModal;
