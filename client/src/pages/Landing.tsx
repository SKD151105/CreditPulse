import { motion, type Variants } from 'framer-motion';
import { ShieldCheck, Zap, BarChart3, ArrowRight, Server, Database, Code, CheckCircle2, Cloud, Activity } from 'lucide-react';
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
          className="text-4xl sm:text-5xl md:text-8xl font-extrabold tracking-tighter mb-8 max-w-5xl leading-tight"
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
          className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto px-4"
        >
          Algorithmic risk scoring, real-time webhooks, and instant decisions built for modern financial teams.
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

      {/* 1. Intelligent Underwriting Engine */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 border-t border-white/5 bg-gray-900/50">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              The Intelligent <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Underwriting Engine</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-400 mb-8 leading-relaxed">
              Say goodbye to manual reviews. Our algorithmic risk engine evaluates key financial data points instantly, including income-to-loan ratios, employment stability, and document completeness, to generate highly accurate risk profiles.
            </p>
            <ul className="space-y-4">
              {['Document Completeness Checks', 'Employment Stability Scoring', 'Debt-to-Income (DTI) Analysis'].map((item, i) => (
                <li key={i} className="flex items-center text-gray-300 text-base md:text-lg">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 mr-3 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-[100px] rounded-full" />
            <div className="glass border border-white/10 rounded-2xl p-8 relative shadow-2xl backdrop-blur-xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                <div>
                  <h4 className="text-white font-bold text-lg">Applicant: John Doe</h4>
                  <p className="text-gray-400 text-sm">ID: #APP-8492-X</p>
                </div>
                <div className="bg-emerald-400/10 text-emerald-400 px-4 py-1.5 rounded-full text-sm font-semibold border border-emerald-400/20">
                  Low Risk
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-900/50 rounded-xl p-4 border border-white/5">
                  <p className="text-gray-400 text-sm mb-1">Risk Score</p>
                  <p className="text-3xl font-bold text-white">845<span className="text-sm text-gray-500 font-normal">/1000</span></p>
                  <div className="w-full bg-gray-800 h-2 mt-3 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-[85%]" />
                  </div>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-4 border border-white/5">
                  <p className="text-gray-400 text-sm mb-1">DTI Ratio</p>
                  <p className="text-3xl font-bold text-white">24%</p>
                  <p className="text-emerald-400 text-xs mt-2 flex items-center"><Activity className="h-3 w-3 mr-1"/> Optimal</p>
                </div>
              </div>
              
              <div className="w-full bg-white/5 border border-white/10 text-white text-center font-medium py-3 rounded-xl cursor-default">
                View Full Analysis
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Real-time Infrastructure */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-2 lg:order-1 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-orange-500/20 blur-[100px] rounded-full" />
            
            {/* Terminal Window Mockup */}
            <div className="bg-[#1e2230] border border-white/5 rounded-2xl overflow-hidden relative shadow-2xl">
              <div className="bg-[#121620] px-4 py-3 flex items-center border-b border-white/5">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <p className="text-gray-500 text-xs ml-4 font-mono">webhook-listener.ts</p>
              </div>
              <div className="p-6 overflow-x-auto text-sm font-mono text-gray-300">
                <p className="text-purple-400">POST <span className="text-gray-300">/api/webhooks/receive</span></p>
                <p className="mt-4">{'{'}</p>
                <p className="ml-4">"event": <span className="text-green-400">"loan.approved"</span>,</p>
                <p className="ml-4">"payload": {'{'}</p>
                <p className="ml-8">"loanId": <span className="text-yellow-400">"65a2b...91"</span>,</p>
                <p className="ml-8">"amount": <span className="text-orange-400">50000</span>,</p>
                <p className="ml-8">"approvedBy": <span className="text-green-400">"Admin Team"</span></p>
                <p className="ml-4">{'}'}</p>
                <p>{'}'}</p>
                <div className="mt-4 flex items-center text-emerald-400 text-xs animate-pulse">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2" />
                  Status: 200 OK (12ms)
                </div>
              </div>
            </div>
            
            {/* Floating Toast Notification Mockup */}
            <div className="absolute -right-6 -bottom-6 bg-[#252a3a] border border-white/10 p-4 rounded-xl shadow-2xl flex items-center space-x-4 max-w-sm animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Webhook Dispatched</p>
                <p className="text-gray-400 text-xs">CRM synchronized successfully.</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              Instant Sync with <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-orange-400">Webhooks</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-400 mb-8 leading-relaxed">
              Built for modern financial stacks. Our event-driven architecture uses BullMQ and Server-Sent Events (SSE) to push updates instantly to your dashboard and external CRMs.
            </p>
            <div className="space-y-6">
              <div className="flex">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <Code className="h-5 w-5 text-indigo-400" />
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-white mb-1">Developer First API</h4>
                  <p className="text-gray-400">Register endpoints directly from the dashboard and receive HMAC SHA-256 signed JSON payloads.</p>
                </div>
              </div>
              <div className="flex">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                    <Zap className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-white mb-1">Server-Sent Events</h4>
                  <p className="text-gray-400">Admins see updates the millisecond they happen, with zero page refreshes required.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Bank-Grade Architecture */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 border-t border-white/5 bg-gray-900/50">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              Decoupled <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Architecture</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
              Our system is engineered for scale and resilience. Background tasks are offloaded to Redis workers, and large documents bypass our servers entirely via S3 pre-signed URLs.
            </p>
          </motion.div>
        </div>
        
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 mt-20 mb-24">
          {[
            { icon: Cloud, title: "Direct S3 Uploads", desc: "No server bottlenecks. Clients upload documents straight to AWS S3 using secure, short-lived signed URLs." },
            { icon: Database, title: "Redis Backed Queues", desc: "Heavy operations like scoring and webhook dispatch are queued in BullMQ to keep the main API thread ultra-fast." },
            { icon: Server, title: "Containerized Micro-services", desc: "API, Workers, and Redis run in isolated Docker containers, reducing IPC latency to <1ms." }
          ].map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="text-left bg-white/[0.02] border border-white/10 rounded-3xl p-10 hover:bg-white/[0.04] transition-colors"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-lg">
                <feature.icon className="h-7 w-7 text-blue-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">{feature.title}</h4>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto relative flex justify-center"
        >
          <img 
            src="/creditpulse_social_preview.png" 
            alt="System Architecture Diagram" 
            className="w-full h-auto drop-shadow-2xl hover:scale-[1.02] transition-transform duration-500"
          />
        </motion.div>
      </section>

      {/* 4. CTA */}
      <section className="pt-24 pb-32 px-4 sm:px-6 lg:px-8 relative z-10 border-t border-white/5 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent pointer-events-none" />
        
        {/* Massive glowing aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-r from-blue-600/20 to-purple-600/30 blur-[120px] pointer-events-none rounded-full" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto relative"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Transform Your Workflow?</h2>
          <p className="text-lg md:text-xl text-gray-400 mb-10">
            Experience the future of loan origination. Apply for a loan as a user, or explore the underwriter portal as an admin.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link
              to="/register"
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center"
            >
              Start Application
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto glass border border-white/10 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/5 transition-all flex items-center justify-center"
            >
              Admin Login
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};
