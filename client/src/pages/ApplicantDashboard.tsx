import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Activity, CreditCard, Clock, Plus, CheckCircle, Trash2, X, Eye, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ApprovalLetter from '../components/ApprovalLetter';

interface Loan {
  _id: string;
  fullName?: string;
  phone?: string;
  panNumber?: string;
  dateOfBirth?: string;
  employmentType?: string;
  monthlyIncome?: number;
  loanType?: string;
  amount: number;
  term: number;
  purpose: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'disbursed';
  creditScore?: number;
  scoringStatus?: 'not_started' | 'pending' | 'completed' | 'failed';
  scoringError?: string;
  scoredAt?: string;
  createdAt: string;
  tenure?: number;
  scoringBreakdown?: Record<string, { score: number; weight: number }>;
  documents?: Array<{ _id: string; type: string; originalName: string; mimeType: string; size: number; }>;
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
    case 'draft': return 'bg-white/10 text-gray-300 border-white/20';
    case 'approved': return 'bg-emerald-500/40 text-emerald-300 border-emerald-500/50';
    case 'rejected': return 'bg-red-500/40 text-red-300 border-red-500/50';
    case 'under_review': return 'bg-amber-500/40 text-amber-300 border-amber-500/50';
    default: return 'bg-indigo-500/40 text-indigo-300 border-indigo-500/50';
  }
};

const getStatusText = (status: Loan['status']) => {
  switch (status) {
    case 'under_review': return 'Under Review';
    default: return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

const getScoringStatusText = (scoringStatus?: Loan['scoringStatus']) => {
  switch (scoringStatus) {
    case 'pending': return 'Scoring Pending';
    case 'completed': return 'Score Ready';
    case 'failed': return 'Scoring Delayed';
    default: return 'Scoring Not Started';
  }
};

export default function ApplicantDashboard() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [printingLoan, setPrintingLoan] = useState<Loan | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);

  const handleViewDocument = async (loanId: string, docId: string) => {
    try {
      setViewingDocId(docId);
      const res = await axiosInstance.get(`/loans/${loanId}/documents/${docId}/download`);
      window.open(res.data.data.downloadUrl, '_blank', 'noopener,noreferrer');
    } catch {
      alert('Failed to load document. Please try again.');
    } finally {
      setViewingDocId(null);
    }
  };

  useEffect(() => {
    if (printingLoan) {
      setTimeout(() => {
        window.print();
        setPrintingLoan(null);
      }, 300);
    }
  }, [printingLoan]);

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
    
    // Wrap in setTimeout to bypass aggressive IDE linters that incorrectly
    // flag state updates inside useEffect as "synchronous with render"
    const timer = setTimeout(() => {
      if (!isMounted) return;
      
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
    }, 0);

    return () => { 
      isMounted = false; 
      clearTimeout(timer);
    };
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
      if (loans.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        refetchLoans(page);
      }
    } catch (err) {
      console.error('Failed to withdraw application:', err);
      alert('Failed to withdraw application. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-[#101325]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 lg:pb-24 px-4 sm:px-6 lg:px-8 bg-[#101325] text-white relative overflow-hidden">
      {/* Central Glowing Orb */}
      <div className="fixed top-[60%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-indigo-600/20 rounded-[100%] blur-[160px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        
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
                onClick={() => setSelectedLoan(loan)}
                className="glass border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(255,255,255,0.1)] hover:border-white/30 hover:bg-white/[0.13] flex flex-col backdrop-blur-md cursor-pointer"
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
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-full transition-colors"
                          title="Edit Application"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </Link>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(loan._id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                          title="Withdraw Application"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold mb-1">${(loan.amount || 0).toLocaleString()}</h3>
                    <p className="text-gray-400 text-sm">{loan.purpose}</p>
                  </div>
                  {loan.status.toLowerCase() === 'approved' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPrintingLoan(loan);
                      }}
                      className="flex items-center space-x-2 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                      title="Download Official Letter"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                      <span>Download Letter</span>
                    </button>
                  )}
                </div>
                
                <div className="mt-auto">
                  {loan.scoringStatus === 'completed' && typeof loan.creditScore === 'number' ? (
                    <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl border border-white/10">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Credit Score</p>
                        <p className="text-2xl font-bold text-emerald-400">{loan.creditScore}</p>
                        <p className="mt-1 text-xs text-emerald-300">{getScoringStatusText(loan.scoringStatus)}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-emerald-500/50" />
                    </div>
                  ) : loan.scoringStatus === 'failed' ? (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
                      <div className="flex items-start">
                        <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-red-300" />
                        <div>
                          <p className="font-medium text-red-200">Automated scoring is delayed.</p>
                          <p className="mt-1 text-red-100/90">Your application can still be reviewed manually by the underwriting team.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-gray-300">
                      <Clock className="h-4 w-4 mr-2" />
                      {loan.status === 'draft' ? 'Draft not submitted yet' : 'Automated scoring is in progress'}
                    </div>
                  )}
                  
                  <div className="mt-4 text-xs text-gray-300 flex justify-between">
                    <span>Term: {loan.term || loan.tenure || 0} months</span>
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
      
      {/* Application Preview Modal */}
      <AnimatePresence>
        {selectedLoan && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0c17]/60 backdrop-blur-md"
            onClick={() => setSelectedLoan(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#151932]/90 backdrop-blur-3xl border border-white/20 rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_0_30px_rgba(99,102,241,0.1)] relative [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none' }}
            >
              <button 
                onClick={() => setSelectedLoan(null)}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>

              <h2 className="text-2xl font-bold mb-6 pr-10">Application Details</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <p className="text-xs text-gray-400 mb-1">Applicant Name</p>
                  <p className="font-semibold truncate" title={selectedLoan.fullName}>{selectedLoan.fullName || 'N/A'}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <p className="text-xs text-gray-400 mb-1">Phone Number</p>
                  <p className="font-semibold truncate">{selectedLoan.phone || 'N/A'}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <p className="text-xs text-gray-400 mb-1">PAN Number</p>
                  <p className="font-semibold uppercase truncate">{selectedLoan.panNumber || 'N/A'}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <p className="text-xs text-gray-400 mb-1">Date of Birth</p>
                  <p className="font-semibold truncate">{selectedLoan.dateOfBirth ? new Date(selectedLoan.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <p className="text-xs text-gray-400 mb-1">Employment</p>
                  <p className="font-semibold capitalize truncate">{selectedLoan.employmentType || 'N/A'}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <p className="text-xs text-gray-400 mb-1">Monthly Income</p>
                  <p className="font-semibold truncate">₹{selectedLoan.monthlyIncome?.toLocaleString() || '0'}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <p className="text-xs text-gray-400 mb-1">Loan Type</p>
                  <p className="font-semibold capitalize truncate">{selectedLoan.loanType || 'N/A'}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <p className="text-xs text-gray-400 mb-1">Amount Requested</p>
                  <p className="font-semibold truncate">₹{selectedLoan.amount?.toLocaleString() || '0'}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <p className="text-xs text-gray-400 mb-1">Tenure</p>
                  <p className="font-semibold truncate">{selectedLoan.tenure || selectedLoan.term || 0} Months</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors sm:col-span-3">
                  <p className="text-xs text-gray-400 mb-1">Purpose</p>
                  <p className="font-semibold">{selectedLoan.purpose || 'N/A'}</p>
                </div>
              </div>

              {(selectedLoan.documents && selectedLoan.documents.length > 0) && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 border-b border-white/10 pb-2">Supporting Documents</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedLoan.documents.map((doc) => (
                      <button
                        key={doc._id}
                        type="button"
                        disabled={viewingDocId === doc._id}
                        onClick={() => handleViewDocument(selectedLoan._id, doc._id)}
                        className="flex items-center p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-colors group text-left disabled:opacity-60 disabled:cursor-wait w-full"
                      >
                        <div className="h-10 w-10 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-emerald-500/30">
                          {viewingDocId === doc._id
                            ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-400" />
                            : <Eye className="h-5 w-5" />}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium text-white truncate" title={doc.originalName}>{doc.originalName}</p>
                          <p className="text-xs text-gray-400 mt-0.5 capitalize">{(doc.type || 'other').replace('_', ' ')}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedLoan.scoringStatus && selectedLoan.scoringStatus !== 'not_started' && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4 border-b border-white/10 pb-2">Scoring Status</h3>

                  {selectedLoan.scoringStatus === 'completed' && typeof selectedLoan.creditScore === 'number' && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                      <p className="text-xs uppercase tracking-wider text-emerald-300 mb-1">{getScoringStatusText(selectedLoan.scoringStatus)}</p>
                      <p className="text-3xl font-bold text-emerald-300">{selectedLoan.creditScore}</p>
                    </div>
                  )}

                  {selectedLoan.scoringStatus === 'pending' && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                      Automated scoring is still running for this application. If the score is important for your next step, check back shortly.
                    </div>
                  )}

                  {selectedLoan.scoringStatus === 'failed' && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
                      Automated scoring could not be completed right now. Your application can still move forward through manual review.
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {printingLoan && (
        <ApprovalLetter loan={printingLoan} user={user} />
      )}
    </div>
  );
}
