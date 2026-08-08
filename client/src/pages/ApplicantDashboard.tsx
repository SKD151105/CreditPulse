import { useEffect, useState, useCallback } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Activity, CreditCard, Clock, Plus, CheckCircle, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface Loan {
  _id: string;
  amount: number;
  term: number;
  purpose: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'disbursed';
  creditScore?: number;
  createdAt: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 10 },
  },
};

const getStatusColor = (status: Loan['status']) => {
  switch (status) {
    case 'approved': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'under_review': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    default: return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
  }
};

const getStatusText = (status: Loan['status']) => {
  switch (status) {
    case 'under_review': return 'Under Review';
    default: return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

export default function ApplicantDashboard() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const refetchLoans = useCallback(async (currentPage: number) => {
    try {
      const response = await axiosInstance.get(`/loans?page=${currentPage}&limit=6`);
      setLoans(response.data.data.loans);
      setTotalPages(response.data.data.pagination.pages || 1);
    } catch (error) {
      console.error('Failed to fetch loans:', error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    
    axiosInstance.get(`/loans?page=${page}&limit=6`)
      .then(response => {
        if (isMounted) {
          setLoans(response.data.data.loans);
          setTotalPages(response.data.data.pagination.pages || 1);
        }
      })
      .catch(error => {
        console.error('Failed to fetch loans:', error);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [page]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    const sse = new EventSource(`${apiUrl}/notifications/stream?token=${token}`);
    
    sse.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type !== 'system') {
          // Refetch loans to update UI immediately
          refetchLoans(page);
        }
      } catch (err) {
        // Handle parsing errors or ignore raw text
        console.error('Error parsing SSE message:', err);
      }
    };
    
    return () => sse.close();
  }, [refetchLoans, page]);

  const handleDelete = async (loanId: string) => {
    if (!window.confirm('Are you sure you want to withdraw this application? This cannot be undone.')) return;
    try {
      await axiosInstance.delete(`/loans/${loanId}`);
      setLoans(loans.filter(l => l._id !== loanId));
    } catch (err) {
      console.error('Failed to withdraw application:', err);
      alert('Failed to withdraw application. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'Applicant'}</h1>
            <p className="text-gray-400">Manage your loan applications and track their status.</p>
          </div>
          <Link
            to="/apply"
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-semibold shadow-[0_0_20px_-5px_rgba(99,102,241,0.4)] transition-all flex items-center"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Application
          </Link>
        </div>

        {loans.length === 0 ? (
          <div className="glass border border-white/10 rounded-2xl p-12 text-center backdrop-blur-md">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
              <Activity className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold mb-3">No applications yet</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              You haven't submitted any loan applications. Apply now to get an instant credit decision.
            </p>
            <Link
              to="/apply"
              className="px-8 py-4 bg-white text-black hover:bg-gray-200 transition-colors rounded-lg font-semibold inline-flex items-center shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)]"
            >
              Start Application
            </Link>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {loans.map((loan) => (
              <motion.div
                key={loan._id}
                variants={itemVariants}
                className="glass border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-indigo-500/20 hover:border-indigo-500/30 hover:bg-surface flex flex-col backdrop-blur-md"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-white/5 rounded-lg text-indigo-400">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(loan.status)}`}>
                      {getStatusText(loan.status)}
                    </span>
                    {loan.status === 'draft' && (
                      <>
                        <Link 
                          to={`/apply?id=${loan._id}`}
                          className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-full transition-colors"
                          title="Edit Application"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </Link>
                        <button 
                          onClick={() => handleDelete(loan._id)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                          title="Withdraw Application"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-1">${loan.amount.toLocaleString()}</h3>
                <p className="text-gray-400 text-sm mb-6">{loan.purpose}</p>
                
                <div className="mt-auto">
                  {loan.creditScore ? (
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Credit Score</p>
                        <p className="text-2xl font-bold text-emerald-400">{loan.creditScore}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-emerald-500/50" />
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-2" />
                      Pending Evaluation
                    </div>
                  )}
                  
                  <div className="mt-4 text-xs text-gray-500 flex justify-between">
                    <span>Term: {loan.term} months</span>
                    <span>{new Date(loan.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-12 space-x-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Previous
            </button>
            <span className="text-gray-400 text-sm">
              Page <span className="text-white font-medium">{page}</span> of <span className="text-white font-medium">{totalPages}</span>
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
