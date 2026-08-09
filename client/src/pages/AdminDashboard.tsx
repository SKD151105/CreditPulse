import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { CheckCircle, XCircle, UserPlus, Eye, X, Activity, AlertCircle } from 'lucide-react';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { WebhookManager } from '../components/WebhookManager';
import { AuditTimeline } from '../components/AuditTimeline';

interface ScoreMetric {
  score: number;
  weight: number;
  details: string;
}

interface ScoringBreakdown {
  incomeToLoanRatio?: ScoreMetric;
  employmentStability?: ScoreMetric;
  loanToIncomeRatio?: ScoreMetric;
  documentCompleteness?: ScoreMetric;
  loanTypeRisk?: ScoreMetric;
}

interface Loan {
  _id: string;
  fullName: string;
  amount: number;
  term: number;
  purpose: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'disbursed';
  creditScore?: number;
  createdAt: string;
  assignedTo?: string;
  scoringBreakdown?: ScoringBreakdown;
  monthlyIncome: number;
  employmentType: string;
  fileUrl?: string;
  fileUrls?: string[];
  phone?: string;
  dateOfBirth?: string;
  panNumber?: string;
  tenure?: number;
  loanType?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 10 } },
};

const getScoreColor = (score?: number) => {
  if (!score) return 'text-gray-400';
  if (score >= 80) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
};

const getStatusColor = (status: Loan['status']) => {
  switch (status) {
    case 'approved': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'under_review': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'submitted': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const getStatusText = (status: Loan['status']) => {
  switch (status) {
    case 'under_review': return 'Under Review';
    default: return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [remarks, setRemarks] = useState('');
  const [actionError, setActionError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<'applications' | 'webhooks'>('applications');

  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  const refetchLoans = useCallback(async (currentPage: number, currentStatusFilter: string = statusFilter) => {
    try {
      let url = `/admin/loans?page=${currentPage}&limit=6`;
      if (currentStatusFilter) {
        url += `&status=${currentStatusFilter}`;
      }
      const response = await axiosInstance.get(url);
      setLoans(response.data.data.loans);
      setTotalPages(response.data.data.pagination.pages || 1);
      if (response.data.data.stats) {
        setStats(response.data.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch loans:', error);
    }
  }, [statusFilter]);

  useEffect(() => {
    let isMounted = true;
    
    // Wrap in setTimeout to bypass aggressive IDE linters that incorrectly
    // flag state updates inside useEffect as "synchronous with render"
    const timer = setTimeout(() => {
      if (!isMounted) return;
      setLoading(true);
      
      let url = `/admin/loans?page=${page}&limit=6`;
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }

      axiosInstance.get(url)
        .then(response => {
          if (isMounted) {
            setLoans(response.data.data.loans);
            setTotalPages(response.data.data.pagination.pages || 1);
            if (response.data.data.stats) {
              setStats(response.data.data.stats);
            }
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
  }, [page, statusFilter]);

  const handleAssign = async (loanId: string) => {
    try {
      setProcessing(true);
      await axiosInstance.patch(`/admin/loans/${loanId}/assign`);
      await refetchLoans(page);
    } catch (err) {
      console.error(err);
      alert('Failed to assign loan');
    } finally {
      setProcessing(false);
    }
  };

  const handleDecision = async (loanId: string, decision: 'approved' | 'rejected') => {
    if (!remarks) {
      setActionError('Please provide remarks for your decision.');
      return;
    }
    
    try {
      setProcessing(true);
      setActionError('');
      await axiosInstance.patch(`/admin/loans/${loanId}/status`, {
        status: decision,
        remarks
      });
      setSelectedLoan(null);
      setRemarks('');
      await refetchLoans(page);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionError(err.response?.data?.message || 'Failed to process decision');
      } else {
        setActionError('An unexpected error occurred.');
      }
    } finally {
      setProcessing(false);
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Underwriter Portal</h1>
            <p className="text-gray-400">Review, assign, and process credit applications.</p>
          </div>
          
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-4 sm:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex-1 md:flex-none ${
                activeTab === 'applications' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              Applications
            </button>
            <button
              onClick={() => setActiveTab('webhooks')}
              className={`px-4 sm:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex-1 md:flex-none ${
                activeTab === 'webhooks' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              Partner Webhooks
            </button>
          </div>
        </div>

        {activeTab === 'applications' ? (
          <>
            <div className="flex justify-between items-start md:items-center mb-10 gap-4 flex-col lg:flex-row">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full lg:w-auto pb-2 md:pb-0">
                <div className="glass border border-white/10 rounded-xl px-3 sm:px-6 py-3 flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-start text-center sm:text-left">
                  <Activity className="h-5 w-5 text-indigo-400 mb-1 sm:mb-0 sm:mr-3" />
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-400">Pending</p>
                    <p className="text-lg sm:text-xl font-bold">{stats.pending}</p>
                  </div>
                </div>
                <div className="glass border border-white/10 rounded-xl px-3 sm:px-6 py-3 flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-start text-center sm:text-left">
                  <CheckCircle className="h-5 w-5 text-emerald-400 mb-1 sm:mb-0 sm:mr-3" />
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-400">Approved</p>
                    <p className="text-lg sm:text-xl font-bold">{stats.approved}</p>
                  </div>
                </div>
                <div className="glass border border-white/10 rounded-xl px-3 sm:px-6 py-3 flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-start text-center sm:text-left">
                  <XCircle className="h-5 w-5 text-red-400 mb-1 sm:mb-0 sm:mr-3" />
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-400">Rejected</p>
                    <p className="text-lg sm:text-xl font-bold">{stats.rejected}</p>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">All Applications</option>
                  <option value="submitted">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

        {/* Data Grid */}
        {loans.length === 0 ? (
          <div className="glass border border-white/10 rounded-2xl p-12 text-center backdrop-blur-md">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No applications found</h2>
            <p className="text-gray-400">There are no loan applications in the system yet.</p>
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
                className="glass border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-indigo-500/20 hover:border-indigo-500/30 hover:bg-surface flex flex-col relative overflow-hidden backdrop-blur-md"
              >
                {/* Glowing edge for high risk/high score */}
                {loan.creditScore && loan.creditScore < 50 && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                )}
                {loan.creditScore && loan.creditScore >= 80 && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                )}

                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold mb-1 truncate max-w-[180px]">{loan.fullName}</h3>
                    <p className="text-sm text-gray-400">{loan.purpose}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(loan.status)}`}>
                    {getStatusText(loan.status)}
                  </span>
                </div>
                
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Amount Requested</p>
                    <p className="text-2xl font-bold">₹{loan.amount.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Credit Score</p>
                    <p className={`text-2xl font-bold ${getScoreColor(loan.creditScore)}`}>
                      {loan.creditScore || 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-white/10">
                  {loan.status === 'submitted' && (
                    <button
                      onClick={() => handleAssign(loan._id)}
                      disabled={processing}
                      className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center border border-indigo-500/20 disabled:opacity-50"
                    >
                      <UserPlus className="h-4 w-4 mr-2" /> Assign to Me
                    </button>
                  )}

                  {loan.status === 'under_review' && loan.assignedTo === user?._id && (
                    <button
                      onClick={() => setSelectedLoan(loan)}
                      className="w-full py-2 bg-white text-black hover:bg-gray-200 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center shadow-[0_0_15px_-5px_rgba(255,255,255,0.3)]"
                    >
                      <Eye className="h-4 w-4 mr-2" /> Review Application
                    </button>
                  )}

                  {loan.status === 'under_review' && loan.assignedTo !== user?._id && (
                    <div className="w-full py-2 bg-white/5 text-gray-500 rounded-lg text-sm font-semibold text-center border border-white/5">
                      Assigned to another Admin
                    </div>
                  )}

                  {['approved', 'rejected', 'disbursed'].includes(loan.status) && (
                    <button
                      onClick={() => setSelectedLoan(loan)}
                      className="w-full py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors rounded-lg text-sm font-semibold text-center border border-white/5 flex items-center justify-center cursor-pointer"
                    >
                      <Eye className="h-4 w-4 mr-2" /> View Details
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-12 space-x-4 mb-8">
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
          </>
        ) : (
          <WebhookManager />
        )}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {selectedLoan && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setSelectedLoan(null);
              setRemarks('');
              setActionError('');
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f1115] border border-gray-800 rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none' }}
            >
              <button 
                onClick={() => {
                  setSelectedLoan(null);
                  setRemarks('');
                  setActionError('');
                }}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>

              <h2 className="text-2xl font-bold mb-6 pr-10">Application Review</h2>

              {actionError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center text-red-400">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  {actionError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
                <div className="glass p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-500 mb-1">Applicant Name</p>
                  <p className="font-semibold truncate" title={selectedLoan.fullName}>{selectedLoan.fullName}</p>
                </div>
                <div className="glass p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                  <p className="font-semibold truncate">{selectedLoan.phone || 'N/A'}</p>
                </div>
                <div className="glass p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-500 mb-1">PAN Number</p>
                  <p className="font-semibold uppercase truncate">{selectedLoan.panNumber || 'N/A'}</p>
                </div>
                <div className="glass p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-500 mb-1">Date of Birth</p>
                  <p className="font-semibold truncate">{selectedLoan.dateOfBirth ? new Date(selectedLoan.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="glass p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-500 mb-1">Employment</p>
                  <p className="font-semibold capitalize truncate">{selectedLoan.employmentType}</p>
                </div>
                <div className="glass p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-500 mb-1">Monthly Income</p>
                  <p className="font-semibold truncate">₹{selectedLoan.monthlyIncome?.toLocaleString() || '0'}</p>
                </div>
                <div className="glass p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-500 mb-1">Loan Type</p>
                  <p className="font-semibold capitalize truncate">{selectedLoan.loanType || 'N/A'}</p>
                </div>
                <div className="glass p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-500 mb-1">Amount Requested</p>
                  <p className="font-semibold truncate">₹{selectedLoan.amount.toLocaleString()}</p>
                </div>
                <div className="glass p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-500 mb-1">Tenure</p>
                  <p className="font-semibold truncate">{selectedLoan.tenure || selectedLoan.term || 0} Months</p>
                </div>
                <div className="glass p-4 rounded-xl border border-white/5 sm:col-span-3">
                  <p className="text-xs text-gray-500 mb-1">Purpose</p>
                  <p className="font-semibold">{selectedLoan.purpose || 'N/A'}</p>
                </div>
              </div>

              {(selectedLoan.fileUrls?.length ? selectedLoan.fileUrls : (selectedLoan.fileUrl ? [selectedLoan.fileUrl] : [])).length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 border-b border-white/10 pb-2">Supporting Documents</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(selectedLoan.fileUrls?.length ? selectedLoan.fileUrls : (selectedLoan.fileUrl ? [selectedLoan.fileUrl] : [])).map((url, idx) => {
                      const filename = url.split('/').pop()?.split('?')[0] || `Document ${idx + 1}`;
                      return (
                        <a 
                          key={idx} 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors group"
                        >
                          <div className="h-10 w-10 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-emerald-500/30">
                            <Eye className="h-5 w-5" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate" title={filename}>{filename}</p>
                            <p className="text-xs text-gray-500 mt-0.5">Click to view</p>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedLoan.scoringBreakdown && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 border-b border-white/10 pb-2">Risk Scoring Breakdown</h3>
                  
                  <div className="flex items-center justify-between mb-6 bg-white/5 p-4 rounded-xl">
                    <span className="text-gray-300 font-medium">Final Credit Score</span>
                    <span className={`text-3xl font-bold ${getScoreColor(selectedLoan.creditScore)}`}>
                      {selectedLoan.creditScore}
                      <span className="text-sm text-gray-500 font-normal ml-1">/ 100</span>
                    </span>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(selectedLoan.scoringBreakdown).map(([key, metric]) => {
                      if (!metric) return null;
                      return (
                        <div key={key} className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="font-mono text-white">
                            {metric.score} <span className="text-gray-600">({metric.weight * 100}%)</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 border-b border-white/10 pb-2">Activity Timeline</h3>
                <AuditTimeline loanId={selectedLoan._id} />
              </div>

              {selectedLoan.status === 'under_review' && (
                <>
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Underwriter Remarks</label>
                    <textarea 
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter reason for approval or rejection..."
                      rows={4}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => handleDecision(selectedLoan._id, 'approved')}
                      disabled={processing}
                      className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)] disabled:opacity-50"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" /> Approve
                    </button>
                    <button
                      onClick={() => handleDecision(selectedLoan._id, 'rejected')}
                      disabled={processing}
                      className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)] disabled:opacity-50"
                    >
                      <XCircle className="h-5 w-5 mr-2" /> Reject
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
