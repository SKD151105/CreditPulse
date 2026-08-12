import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, FileText, CheckCircle, Clock, Shield, Search, ArrowRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HelpCenter = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is CreditPulse?",
      answer: "CreditPulse is a modern, secure, and lightning-fast platform designed to streamline the credit application and approval process for both applicants and financial administrators."
    },
    {
      question: "How long does the application review process take?",
      answer: "Most applications are reviewed within 1-2 business days. Administrators will automatically receive notifications when you submit your application, ensuring a prompt response."
    },
    {
      question: "Is my personal data secure?",
      answer: "Absolutely. We utilize industry-standard encryption, secure JWT authentication, and rigorous data protection protocols to ensure your financial and personal information is kept safe at all times."
    },
    {
      question: "Can I update my profile after submitting an application?",
      answer: "Yes, you can easily update your profile information, including your username, bio, and avatar, directly from your Profile page at any time."
    }
  ];

  const processSteps = [
    {
      icon: <Search className="w-6 h-6 text-indigo-400" />,
      title: "Step 1: Registration",
      description: "Sign up securely using your email or Google account to access the CreditPulse platform."
    },
    {
      icon: <FileText className="w-6 h-6 text-purple-400" />,
      title: "Step 2: Submit Application",
      description: "Navigate to the 'Apply' section and fill out our comprehensive and user-friendly credit application form."
    },
    {
      icon: <Clock className="w-6 h-6 text-orange-400" />,
      title: "Step 3: Administrative Review",
      description: "Our dedicated administrators will carefully review your submitted application details and credit history."
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-emerald-400" />,
      title: "Step 4: Final Decision",
      description: "Receive your final credit approval status instantly on your personal dashboard."
    }
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-6">
            <HelpCircle className="w-4 h-4" />
            Support Center
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            How can we help you?
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to know about navigating the CreditPulse platform and the credit application lifecycle.
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Application Process Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-8 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white">Application Process</h2>
          </div>
          
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:ml-[2.3rem] before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500/50 before:to-transparent">
            {processSteps.map((step, index) => (
              <div key={index} className="relative flex items-start gap-6">
                <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 border-2 border-indigo-500/30 shrink-0">
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* FAQs Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-8 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className="rounded-xl bg-white/5 border border-white/10 overflow-hidden transition-colors hover:bg-white/10">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <h3 className="text-lg font-bold text-white">{faq.question}</h3>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="px-5 pb-5 text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-6 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
            <Shield className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
            <h4 className="text-white font-bold mb-2">Still need help?</h4>
            <p className="text-gray-400 text-sm mb-4">Our support team is always ready to assist you with any inquiries.</p>
            <button 
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
              className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Contact Support <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
