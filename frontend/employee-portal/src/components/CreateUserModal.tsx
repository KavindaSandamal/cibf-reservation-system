import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { userService } from '../services/userService';
import { toast } from 'react-toastify';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CreateUserFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  businessName: string;
  contactNumber: string;
  address: string;
}

// Simple email validation
const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreateUserFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    businessName: '',
    contactNumber: '',
    address: '',
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateUserFormData, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof CreateUserFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateUserFormData, string>> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!isValidEmail(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
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
      await userService.createUser({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        businessName: formData.businessName.trim() || undefined,
        contactNumber: formData.contactNumber.trim() || undefined,
        address: formData.address.trim() || undefined,
      });

      toast.success('User created successfully!');
      // Reset form
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        businessName: '',
        contactNumber: '',
        address: '',
      });
      setErrors({});
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        businessName: '',
        contactNumber: '',
        address: '',
      });
      setErrors({});
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
                <h2 className="text-2xl font-bold text-white">Create New User</h2>
                <p className="text-sm text-slate-400">Add a new user/vendor account</p>
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
                  <label htmlFor="username" className="block text-sm font-medium text-slate-200 mb-1">
                    Username (Email) *
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="email"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-white placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="user@example.com"
                    required
                  />
                  {errors.username && <p className="mt-1 text-sm text-rose-400">{errors.username}</p>}
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-1">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-white placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="user@example.com"
                    required
                  />
                  {errors.email && <p className="mt-1 text-sm text-rose-400">{errors.email}</p>}
                </div>

                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-200 mb-1">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-white placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="John"
                    required
                  />
                  {errors.firstName && <p className="mt-1 text-sm text-rose-400">{errors.firstName}</p>}
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-200 mb-1">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-white placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Doe"
                    required
                  />
                  {errors.lastName && <p className="mt-1 text-sm text-rose-400">{errors.lastName}</p>}
                </div>

                {/* Business Name */}
                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-slate-200 mb-1">
                    Business Name
                  </label>
                  <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    value={formData.businessName}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-white placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Business Name"
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label htmlFor="contactNumber" className="block text-sm font-medium text-slate-200 mb-1">
                    Contact Number
                  </label>
                  <input
                    id="contactNumber"
                    name="contactNumber"
                    type="tel"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-white placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="+1234567890"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-200">
                      Password *
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
                    className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-white placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="••••••••"
                    required
                  />
                  {errors.password && <p className="mt-1 text-sm text-rose-400">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-200">
                      Confirm Password *
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
                    className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-white placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="••••••••"
                    required
                  />
                  {errors.confirmPassword && <p className="mt-1 text-sm text-rose-400">{errors.confirmPassword}</p>}
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-slate-200 mb-1">
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-white placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                    placeholder="Street address, City, Country"
                  />
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
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    'Create User'
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateUserModal;