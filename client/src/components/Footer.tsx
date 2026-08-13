import { useState } from 'react';
import { Mail, Phone, ExternalLink, ChevronRight, Zap, ChevronUp, Check, Github } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const Footer = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/admin';
  const showFullFooter = !isDashboard || isExpanded;

  const toggleFooter = () => {
    if (!isDashboard) return;
    const willExpand = !isExpanded;
    setIsExpanded(willExpand);
    
    if (willExpand) {
      // Keep scrolling to the bottom as the footer expands (animation is 300ms)
      const startTime = Date.now();
      const scrollInterval = setInterval(() => {
        window.scrollTo(0, document.body.scrollHeight);
        if (Date.now() - startTime > 350) {
          clearInterval(scrollInterval);
        }
      }, 15);
    }
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText('8369899530');
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  return (
    <footer className="bg-black/20 border-t border-white/10 mt-auto backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatePresence initial={false}>
          {showFullFooter && (
            <motion.div
              initial={isDashboard ? { height: 0, opacity: 0 } : false}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-16 pb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
          {/* About Us */}
          <div className="space-y-4 lg:pr-8">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-6 h-6 text-indigo-500" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                CreditPulse
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              We are revolutionizing the credit application process by providing a secure, 
              lightning-fast, and user-friendly platform for both applicants and administrators. 
              Experience the future of financial approvals today.
            </p>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-white mb-4">Support</h4>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={handleCopyPhone}
                  className="flex items-center gap-3 text-gray-400 hover:text-indigo-400 transition-colors group w-full text-left focus:outline-none"
                >
                  <span className="p-2 rounded-lg bg-white/5 group-hover:bg-indigo-500/10 border border-white/5 group-hover:border-indigo-500/20 transition-colors">
                    {copiedPhone ? <Check className="w-4 h-4 text-emerald-400" /> : <Phone className="w-4 h-4" />}
                  </span>
                  <span className="text-sm">
                    {copiedPhone ? <span className="text-emerald-400 font-medium">Copied to clipboard!</span> : '8369899530'}
                  </span>
                </button>
              </li>
              <li>
                <a href="mailto:skdcodes.dev@gmail.com" className="flex items-center gap-3 text-gray-400 hover:text-indigo-400 transition-colors group">
                  <span className="p-2 rounded-lg bg-white/5 group-hover:bg-indigo-500/10 border border-white/5 group-hover:border-indigo-500/20 transition-colors">
                    <Mail className="w-4 h-4" />
                  </span>
                  <span className="text-sm">skdcodes.dev@gmail.com</span>
                </a>
              </li>
              <li>
                <a href="mailto:skd1545passion@gmail.com" className="flex items-center gap-3 text-gray-400 hover:text-indigo-400 transition-colors group">
                  <span className="p-2 rounded-lg bg-white/5 group-hover:bg-indigo-500/10 border border-white/5 group-hover:border-indigo-500/20 transition-colors">
                    <Mail className="w-4 h-4" />
                  </span>
                  <span className="text-sm">skd1545passion@gmail.com</span>
                </a>
              </li>
            </ul>
          </div>

          {/* FAQs & Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-white mb-4">FAQs & Links</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/help" 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="flex items-center gap-2 text-gray-400 hover:text-indigo-400 transition-colors text-sm"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link 
                  to="/help" 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="flex items-center gap-2 text-gray-400 hover:text-indigo-400 transition-colors text-sm"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                  Application Process
                </Link>
              </li>
              <li>
                <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-indigo-400 transition-colors text-sm">
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Socials */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-white mb-4">Connect with us</h4>
            <div className="flex items-center gap-4">
              <a 
                href="https://www.linkedin.com/in/shubham-kumar-das/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-white/5 hover:bg-[#0A66C2]/10 border border-white/10 hover:border-[#0A66C2]/30 text-gray-400 hover:text-[#0A66C2] transition-all transform hover:-translate-y-1"
                aria-label="LinkedIn Profile"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
              {/* Added a placeholder for other potential socials just in case */}
            </div>
            <div className="pt-4">
              <h4 className="text-lg font-bold text-white mb-4">Documentation</h4>
              <a 
                href="https://github.com/SKD151105/CreditPulse" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 p-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-gray-400 hover:text-white transition-all transform hover:-translate-y-1"
                aria-label="GitHub Repository"
              >
                <Github className="w-5 h-5" />
                <span className="text-sm font-medium">GitHub Repo</span>
              </a>
            </div>
          </div>
        </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Bar */}
        <div 
          className={`py-6 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors ${
            showFullFooter ? 'border-t border-white/10' : ''
          } ${isDashboard ? 'cursor-pointer group' : ''}`}
          onClick={toggleFooter}
        >
          <p className="text-gray-500 text-sm group-hover:text-gray-400 transition-colors">
            &copy; {new Date().getFullYear()} CreditPulse. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
              <span>Designed with</span>
              <span className="text-purple-500 animate-pulse">❤</span>
              <span>for a better experience.</span>
            </div>
            {isDashboard && (
              <ChevronUp className={`w-4 h-4 text-gray-500 group-hover:text-white transition-all duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
