import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const EmployeeWelcomePage: React.FC = () => {
  const navigate = useNavigate();

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

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-4xl text-center"
        >
          {/* Logo/Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8 flex justify-center"
          >
            <div className="relative">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-400/40 to-fuchsia-400/40 blur-xl" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 shadow-2xl">
                <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-6 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
          >
            Welcome to{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
              Employee Portal
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-12 text-xl text-slate-300 sm:text-2xl"
          >
            Manage reservations, view statistics, and oversee the CIBF reservation system
          </motion.p>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              { icon: '📊', title: 'Dashboard', desc: 'Real-time statistics' },
              { icon: '📋', title: 'Reservations', desc: 'Manage bookings' },
              { icon: '👥', title: 'Users', desc: 'View all users' },
              { icon: '🏪', title: 'Stalls', desc: 'Monitor availability' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl"
              >
                <div className="mb-3 text-4xl">{feature.icon}</div>
                <h3 className="mb-1 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/employee/login')}
              className="group relative inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-8 py-4 text-lg font-semibold text-white shadow-2xl outline-none transition focus-visible:ring-4 focus-visible:ring-indigo-500/50 sm:w-auto"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign In
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/employee/register')}
              className="group relative inline-flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-indigo-500/50 bg-slate-900/60 px-8 py-4 text-lg font-semibold text-white shadow-xl backdrop-blur-xl outline-none transition hover:border-indigo-400 hover:bg-slate-800/60 focus-visible:ring-4 focus-visible:ring-indigo-500/50 sm:w-auto"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Create Account
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </motion.button>
          </motion.div>

          {/* Footer Info */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-12 text-sm text-slate-400"
          >
            © {new Date().getFullYear()} CIBF Reservation System. Employee Portal.
          </motion.p>
        </motion.div>
      </div>

      {/* Local styles for blob animation */}
      <style>{`
        @keyframes blob { 
          0%, 100% { transform: translate(0,0) scale(1);} 
          33% { transform: translate(30px, -50px) scale(1.1);} 
          66% { transform: translate(-20px, 20px) scale(0.9);} 
        }
        .animate-blob { animation: blob 8s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default EmployeeWelcomePage;

