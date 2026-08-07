import { motion, type Variants } from 'framer-motion';
import { ShieldCheck, Zap, BarChart3, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 10 },
  },
};

export const Landing = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white pt-16 relative overflow-hidden">
      {/* Background Glowing Orbs */}
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600 rounded-full blur-[120px] opacity-20 pointer-events-none"
      />
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 2.5 }}
        className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[120px] opacity-20 pointer-events-none"
      />

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 text-center mt-[7.5rem] mb-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <span className="border border-white/10 bg-white/5 rounded-full px-4 py-1 text-sm text-indigo-300 backdrop-blur-md">
            ✨ Introducing CreditPulse 2.0
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-8 max-w-5xl leading-tight"
        >
          The Future of <br className="hidden md:block" />
          <span className="bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Credit Underwriting
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto"
        >
          AI-powered risk scoring, real-time webhooks, and instant decisions built for modern financial teams.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
        >
          {user ? (
            user.role === 'admin' ? (
              <Link
                to="/admin"
                className="w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] flex items-center justify-center group"
              >
                View Loan Requests
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] flex items-center justify-center group"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/apply"
                  className="w-full sm:w-auto px-8 py-4 border border-white/10 hover:bg-white/5 text-gray-300 rounded-lg font-semibold transition-all flex items-center justify-center"
                >
                  New Application
                </Link>
              </>
            )
          ) : (
            <>
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] flex items-center justify-center group"
              >
                Apply for Loan
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 border border-white/10 hover:bg-white/5 text-gray-300 rounded-lg font-semibold transition-all flex items-center justify-center"
              >
                Admin Portal
              </Link>
            </>
          )}
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-10 relative">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Feature 1 */}
          <motion.div
            variants={itemVariants}
            className="bg-white/[0.02] border border-white/10 backdrop-blur-xl rounded-2xl p-8 hover:bg-white/[0.04] transition-colors"
          >
            <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400 mb-6 inline-block">
              <Zap className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Lightning Fast</h3>
            <p className="text-gray-400 leading-relaxed">
              Instant credit decisions powered by advanced algorithms. Don't wait weeks for an answer.
            </p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            variants={itemVariants}
            className="bg-white/[0.02] border border-white/10 backdrop-blur-xl rounded-2xl p-8 hover:bg-white/[0.04] transition-colors"
          >
            <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400 mb-6 inline-block">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Bank-Grade Security</h3>
            <p className="text-gray-400 leading-relaxed">
              Your data is encrypted at rest and in transit. We treat your privacy as our top priority.
            </p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            variants={itemVariants}
            className="bg-white/[0.02] border border-white/10 backdrop-blur-xl rounded-2xl p-8 hover:bg-white/[0.04] transition-colors"
          >
            <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400 mb-6 inline-block">
              <BarChart3 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Smart Analytics</h3>
            <p className="text-gray-400 leading-relaxed">
              Real-time insights and transparent scoring breakdowns help you understand your credit profile.
            </p>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
};
