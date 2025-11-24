import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { employeeService } from '../services/employeeService';
import { useAdmin } from '../hooks/useAdmin';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const AdminSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const isAdmin = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not admin
    if (!isAdmin) {
      toast.error('Access denied. Admin role required.');
      navigate('/employee/dashboard');
      return;
    }

    loadSettings();
  }, [isAdmin, navigate]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeeService.getSettings();
      setSettings(data);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load settings';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent mb-2">
            Admin Settings
          </h1>
          <p className="text-slate-400">
            Manage system settings and configurations
          </p>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
            <p className="ml-4 text-slate-300">Loading settings...</p>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-red-500/30 bg-red-500/10 p-6"
          >
            <div className="flex items-center mb-4">
              <svg className="h-6 w-6 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-red-300">Error Loading Settings</h3>
            </div>
            <p className="text-red-200">{error}</p>
            <button
              onClick={loadSettings}
              className="mt-4 px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Settings Card */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">System Settings</h2>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Settings Status
                </label>
                <div className="rounded-lg border border-slate-600 bg-slate-900/50 p-4">
                  <p className="text-white">{settings || 'No settings available'}</p>
                </div>
              </div>

              {/* Configuration Options */}
              <div className="mt-6 space-y-4">
                <div className="border-t border-slate-700 pt-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Configuration Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* User Management */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/employee/users')}
                      className="rounded-lg border border-slate-700 bg-slate-800/40 p-4 cursor-pointer transition-all hover:border-indigo-500/50 hover:bg-slate-800/60"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-slate-300">User Management</h4>
                        <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <p className="text-xs text-slate-400">
                        Configure user registration, roles, and permissions
                      </p>
                    </motion.div>

                    {/* Reservation Settings */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/employee/reservations')}
                      className="rounded-lg border border-slate-700 bg-slate-800/40 p-4 cursor-pointer transition-all hover:border-indigo-500/50 hover:bg-slate-800/60"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-slate-300">Reservation Settings</h4>
                        <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <p className="text-xs text-slate-400">
                        Manage reservation policies and limits
                      </p>
                    </motion.div>

                    {/* Stall Management */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/employee/stalls')}
                      className="rounded-lg border border-slate-700 bg-slate-800/40 p-4 cursor-pointer transition-all hover:border-indigo-500/50 hover:bg-slate-800/60"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-slate-300">Stall Management</h4>
                        <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <p className="text-xs text-slate-400">
                        Configure stall availability and pricing
                      </p>
                    </motion.div>

                    {/* System Preferences */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        toast.info('System Preferences configuration coming soon!', { autoClose: 3000 });
                      }}
                      className="rounded-lg border border-slate-700 bg-slate-800/40 p-4 cursor-pointer transition-all hover:border-indigo-500/50 hover:bg-slate-800/60"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-slate-300">System Preferences</h4>
                        <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <p className="text-xs text-slate-400">
                        General system settings and preferences
                      </p>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-6">
              <div className="flex items-start">
                <svg className="h-6 w-6 text-indigo-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-indigo-300 mb-2">Admin Settings</h3>
                  <p className="text-indigo-200 text-sm">
                    Use this section to configure system-wide settings and manage administrative functions.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsPage;

