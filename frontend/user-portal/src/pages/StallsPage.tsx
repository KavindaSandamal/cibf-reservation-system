import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import StallMap from '../components/StallMap';
import { Stall } from '../types';

const StallsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedStalls, setSelectedStalls] = useState<Stall[]>([]);

  const handleStallsSelect = (stalls: Stall[]) => {
    setSelectedStalls(stalls);
  };

  const handleProceedToBooking = () => {
    if (selectedStalls.length === 0) {
      return;
    }
    // Store selected stalls in sessionStorage to pass to booking page
    sessionStorage.setItem('selectedStalls', JSON.stringify(selectedStalls));
    navigate('/book');
  };

  const totalAmount = selectedStalls.reduce((sum, stall) => sum + stall.price, 0);

  return (
    <Layout>
      <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        {/* Background decorative elements */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-1/4 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.slate.800)_1px,transparent_1px)] [background-size:18px_18px] opacity-40" />
          <div className="absolute -left-24 -top-24 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/30 blur-2xl" />
          <div className="animation-delay-2000 absolute -right-24 top-1/3 h-72 w-72 animate-blob rounded-full bg-amber-400/25 blur-2xl" />
          <div className="animation-delay-4000 absolute left-1/2 bottom-0 h-72 w-72 -translate-x-1/2 animate-blob rounded-full bg-cyan-400/25 blur-2xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            {/* Header Card */}
            <div className="relative overflow-hidden rounded-3xl border-[3px] border-indigo-500/80 bg-gradient-to-br from-slate-900/90 via-indigo-950/50 to-slate-900/90 p-8 shadow-2xl backdrop-blur-xl ring-2 ring-indigo-500/30">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-fuchsia-600/10" />
              
              {/* Decorative elements */}
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
              <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
              
              <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border-[3px] border-indigo-400/70 bg-indigo-500/20 px-4 py-1.5 text-xs font-semibold text-indigo-200 shadow-lg backdrop-blur-sm ring-1 ring-indigo-400/30">
                    <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
                    Browse Stalls • CIBF Reservation System
                  </div>
                  <h1 className="mb-3 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                    Browse{' '}
                    <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-purple-300 bg-clip-text text-transparent">
                      Available Stalls
                    </span>
                  </h1>
                  <p className="max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed">
                    Select up to 3 stalls for your reservation. Click on available stalls to add them to your selection.
                  </p>
                </div>

                {selectedStalls.length > 0 && (
                  <div className="flex flex-col items-start gap-4 sm:items-end">
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(99, 102, 241, 0.4)" }}
                      whileTap={{ scale: 0.96 }}
                      onClick={handleProceedToBooking}
                      className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-purple-500 px-6 py-3.5 text-sm font-bold text-white shadow-2xl transition-all hover:shadow-indigo-500/50"
                    >
                      <svg
                        className="h-5 w-5 transition-transform group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                      Proceed to Booking ({selectedStalls.length})
                    </motion.button>
                    
                    <div className="rounded-xl border-2 border-emerald-500/60 bg-emerald-500/10 px-4 py-2.5 backdrop-blur-sm ring-1 ring-emerald-500/30">
                      <p className="text-xs text-slate-400">
                        Total: <span className="font-bold text-white text-sm">${totalAmount.toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Stall Map Component */}
          <StallMap
            onStallsSelect={handleStallsSelect}
            selectedStallIds={selectedStalls.map((s) => s.id)}
            maxSelection={3}
          />

          {/* Selected Stalls Summary */}
          {selectedStalls.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-8 rounded-2xl border-[3px] border-slate-500/70 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl ring-2 ring-slate-500/30"
            >
              <h3 className="text-xl font-bold text-white mb-6">
                Selected Stalls ({selectedStalls.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {selectedStalls.map((stall) => (
                  <motion.div
                    key={stall.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl border-2 border-indigo-500/60 bg-slate-800/60 p-4 hover:border-indigo-400/80 hover:bg-slate-800/80 transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-white text-lg">{stall.stallNumber}</h4>
                        <p className="text-sm text-slate-300">{stall.stallName}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-bold rounded-lg ${
                        stall.size === 'SMALL' ? 'bg-blue-500 text-white' :
                        stall.size === 'MEDIUM' ? 'bg-purple-500 text-white' :
                        'bg-orange-500 text-white'
                      }`}>
                        {stall.size}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-400">{stall.location}</p>
                      <p className="text-xl font-bold text-indigo-300">${stall.price}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="pt-4 border-t-2 border-slate-700/50">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-slate-300">Total Amount:</span>
                  <span className="text-3xl font-black text-indigo-300">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Local styles for blob animation */}
        <style>{`
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }
          .animate-blob {
            animation: blob 8s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}</style>
      </div>
    </Layout>
  );
};

export default StallsPage;


