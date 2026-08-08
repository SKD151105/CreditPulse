import { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
import { formatDistanceToNow } from 'date-fns';
import { Activity, UserPlus, CheckCircle, XCircle, FileText, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

export interface AuditLogEntry {
  _id: string;
  action: string;
  userId?: { name: string; email: string; role: string };
  details?: Record<string, unknown> | null;
  createdAt: string;
}

const getActionIcon = (action: string, body?: Record<string, unknown> | null) => {
  switch (action) {
    case 'CREATE_LOAN': return <FileText className="h-4 w-4 text-gray-400" />;
    case 'SUBMIT_LOAN': return <Upload className="h-4 w-4 text-blue-400" />;
    case 'ASSIGN_LOAN': return <UserPlus className="h-4 w-4 text-indigo-400" />;
    case 'UPDATE_LOAN_STATUS': return body?.status === 'rejected' ? <XCircle className="h-4 w-4 text-red-400" /> : <CheckCircle className="h-4 w-4 text-emerald-400" />;
    default: return <Activity className="h-4 w-4 text-gray-400" />;
  }
};

const getActionColor = (action: string, body?: Record<string, unknown> | null) => {
  if (action === 'UPDATE_LOAN_STATUS' && body?.status === 'rejected') return 'bg-red-500/20 text-red-400 border-red-500/30';
  if (action === 'UPDATE_LOAN_STATUS' && body?.status === 'approved') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (action === 'SUBMIT_LOAN') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  if (action === 'ASSIGN_LOAN') return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
  return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
};

const getActionLabel = (action: string, body?: Record<string, unknown> | null) => {
  switch (action) {
    case 'CREATE_LOAN': return 'Draft Created';
    case 'SUBMIT_LOAN': return 'Application Submitted';
    case 'ASSIGN_LOAN': return 'Assigned to Underwriter';
    case 'UPDATE_LOAN_STATUS': return body?.status === 'approved' ? 'Application Approved' : 'Application Rejected';
    default: return action;
  }
};

export function AuditTimeline({ loanId }: { loanId: string }) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setTimeout(() => {
      if (isMounted) setLoading(true);
    }, 0);
    
    axiosInstance.get(`/admin/loans/${loanId}/audit-logs`)
      .then(res => {
        if(isMounted) setLogs(res.data.data);
      })
      .catch(console.error)
      .finally(() => {
        if(isMounted) setLoading(false);
      });
      
    return () => { isMounted = false; };
  }, [loanId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
         <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (logs.length === 0) {
    return <div className="text-center text-gray-500 text-sm py-4 border border-dashed border-gray-700 rounded-lg bg-white/5">No activity logs found.</div>;
  }

  return (
    <div className="space-y-4">
      {logs.map((log, index) => {
        const isLast = index === logs.length - 1;
        const details = log.details as Record<string, unknown>;
        const body = details?.body as Record<string, unknown> | undefined;

        return (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            key={log._id} 
            className="flex gap-4 relative"
          >
            {/* Vertical Line Connecting Timeline */}
            {!isLast && <div className="absolute top-8 left-[1.12rem] bottom-[-1.5rem] w-px bg-gray-700"></div>}

            <div className={`mt-1 h-9 w-9 rounded-full flex items-center justify-center shrink-0 border z-10 shadow-lg shadow-black/50 ${getActionColor(log.action, body)}`}>
              {getActionIcon(log.action, body)}
            </div>
            
            <div className="flex-1 bg-white/5 border border-white/5 rounded-xl p-4 shadow-sm hover:border-white/10 transition-colors">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {getActionLabel(log.action, body)}
                  </h4>
                  <p className="text-xs text-gray-400">
                    by <span className="font-medium text-gray-300">{log.userId?.name || 'Unknown User'}</span> <span className="text-[10px] uppercase opacity-75">({log.userId?.role || 'user'})</span>
                  </p>
                </div>
                <span className="text-[10px] font-mono text-gray-500 bg-gray-900/80 px-2.5 py-1 rounded-full shrink-0 border border-white/5">
                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                </span>
              </div>
              
              {body?.remarks && (
                <div className="mt-3 bg-black/40 border border-gray-800 rounded-lg p-3 text-xs text-gray-300 italic flex">
                  <div className="w-1 bg-indigo-500/50 rounded-full mr-3 shrink-0"></div>
                  "{body.remarks}"
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
