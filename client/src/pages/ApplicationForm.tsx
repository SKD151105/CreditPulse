import { useState, useRef, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, CreditCard, User, AlertCircle, Loader2, Upload, FileText, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import AmortizationCalculator from '../components/AmortizationCalculator';

const applicationSchema = z.object({
  loanType: z.enum(['personal', 'business', 'education', 'home'], {
    errorMap: () => ({ message: 'Please select a loan type' })
  }),
  amount: z.coerce.number().min(10000, 'Minimum loan amount is 10,000').max(10000000),
  tenure: z.coerce.number().min(3, 'Minimum tenure is 3 months').max(360, 'Maximum tenure is 360 months'),
  purpose: z.string().min(10, 'Please provide a valid purpose (min 10 characters)'),
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Invalid phone number'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  panNumber: z.string().length(10, 'PAN must be exactly 10 characters').toUpperCase(),
  employmentType: z.enum(['salaried', 'self-employed', 'student'], {
    errorMap: () => ({ message: 'Please select an employment type' })
  }),
  monthlyIncome: z.coerce.number({
    invalid_type_error: "Please enter a valid amount"
  }).min(1, 'Monthly income is required'),
  fileUrls: z.array(z.string().url()).optional()
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

export default function ApplicationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const [draftId, setDraftId] = useState<string | null>(editId);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    getValues,
    formState: { errors },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
  });

  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    (window as Window & { __checkApplicationDirty?: () => boolean }).__checkApplicationDirty = () => {
      if (isSubmitting || isSavingDraft) return false;
      const values = getValues();
      return !!(
        values.loanType || 
        values.amount > 0 || 
        values.tenure > 0 || 
        values.purpose || 
        values.fullName || 
        values.phone || 
        values.dateOfBirth || 
        values.panNumber || 
        values.employmentType || 
        values.monthlyIncome > 0 || 
        (values.fileUrls && values.fileUrls.length > 0)
      );
    };
    return () => {
      delete (window as Window & { __checkApplicationDirty?: () => boolean }).__checkApplicationDirty;
    };
  }, [getValues, isSubmitting, isSavingDraft]);

  useEffect(() => {
    const handleShowModal = () => setShowExitModal(true);
    window.addEventListener('requestExitModal', handleShowModal);
    return () => window.removeEventListener('requestExitModal', handleShowModal);
  }, []);

  const handleBack = () => {
    const isDirty = (window as Window & { __checkApplicationDirty?: () => boolean }).__checkApplicationDirty?.();
    if (isDirty) {
      setShowExitModal(true);
    } else {
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    if (editId) {
      axiosInstance.get(`/loans/${editId}`).then(res => {
        const data = res.data.data;
        
        if (data.status !== 'draft') {
          alert('This application has already been submitted and cannot be edited.');
          navigate('/dashboard', { replace: true });
          return;
        }

        const formattedDate = data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '';
        reset({
          loanType: data.loanType,
          amount: data.amount,
          tenure: data.tenure,
          purpose: data.purpose,
          fullName: data.fullName,
          phone: data.phone,
          dateOfBirth: formattedDate,
          panNumber: data.panNumber,
          employmentType: data.employmentType,
          monthlyIncome: data.monthlyIncome,
          fileUrls: data.fileUrls && data.fileUrls.length > 0 ? data.fileUrls : (data.fileUrl ? [data.fileUrl] : [])
        });
      }).catch(err => {
        console.error("Failed to fetch loan for editing", err);
      });
    }
  }, [editId, reset, navigate]);

  const fileUrls = useWatch({ control, name: 'fileUrls' }) || [];
  const watchedAmount = useWatch({ control, name: 'amount' });
  const watchedTenure = useWatch({ control, name: 'tenure' });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingFile(true);
    setUploadProgress(0);
    setError('');

    try {
      const newUrls: string[] = [];
      const totalFiles = files.length;
      let completedFiles = 0;

      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        const presignRes = await axiosInstance.get(`/loans/upload-url`, {
          params: {
            filename: file.name,
            fileType: file.type
          }
        });

        const { presignedUrl, fileUrl: finalFileUrl } = presignRes.data.data;

        await axios.put(presignedUrl, file, {
          headers: {
            'Content-Type': file.type
          },
          onUploadProgress: (progressEvent) => {
            const filePercent = (progressEvent.loaded * 100) / (progressEvent.total || file.size);
            const overallPercent = Math.round(((completedFiles * 100) + filePercent) / totalFiles);
            setUploadProgress(overallPercent);
          }
        });
        newUrls.push(finalFileUrl);
        completedFiles++;
      }

      setValue('fileUrls', [...(fileUrls || []), ...newUrls]);
    } catch (err) {
      setError('Failed to upload files. Please try again.');
      console.error(err);
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: ApplicationFormValues) => {
    setIsSubmitting(true);
    setError('');
    
    try {
      let currentLoanId = draftId;

      if (!currentLoanId) {
        // Step 1: Create draft with initial loan details
        const draftRes = await axiosInstance.post('/loans', {
          loanType: data.loanType,
          amount: data.amount,
          tenure: data.tenure,
          purpose: data.purpose
        });
        
        currentLoanId = draftRes.data.data._id;
        setDraftId(currentLoanId);
      }
      
      // Step 2: Update draft with personal information
      await axiosInstance.patch(`/loans/${currentLoanId}`, {
        fullName: data.fullName,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        panNumber: data.panNumber,
        employmentType: data.employmentType,
        monthlyIncome: data.monthlyIncome,
        fileUrls: data.fileUrls
      });
      
      // Step 3: Submit application for scoring
      await axiosInstance.post(`/loans/${currentLoanId}/submit`);
      
      // Clear draft ID after successful submission
      setDraftId(null);
      navigate('/dashboard');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to submit application. Please try again.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSaveDraft = async (data: Partial<ApplicationFormValues>) => {
    setIsSavingDraft(true);
    setError('');
    
    try {
      let currentLoanId = draftId;

      if (!currentLoanId) {
        const draftRes = await axiosInstance.post('/loans', {
          ...(data.loanType ? { loanType: data.loanType } : {}),
          ...((data.amount ?? 0) > 0 ? { amount: data.amount } : {}),
          ...((data.tenure ?? 0) > 0 ? { tenure: data.tenure } : {}),
          ...(data.purpose ? { purpose: data.purpose } : {})
        });
        currentLoanId = draftRes.data.data._id;
        setDraftId(currentLoanId);
      }
      
      await axiosInstance.patch(`/loans/${currentLoanId}`, {
        ...(data.fullName ? { fullName: data.fullName } : {}),
        ...(data.phone ? { phone: data.phone } : {}),
        ...(data.dateOfBirth ? { dateOfBirth: data.dateOfBirth } : {}),
        ...(data.panNumber ? { panNumber: data.panNumber } : {}),
        ...(data.employmentType ? { employmentType: data.employmentType } : {}),
        ...((data.monthlyIncome ?? 0) > 0 ? { monthlyIncome: data.monthlyIncome } : {}),
        ...(data.fileUrls && data.fileUrls.length > 0 ? { fileUrls: data.fileUrls } : {})
      });
      
      navigate('/dashboard');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to save draft. Please try again.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsSavingDraft(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#101325] text-white px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Central Glowing Orb */}
      <div className="fixed top-[60%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-indigo-600/20 rounded-[100%] blur-[160px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row gap-8 items-start">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 w-full glass border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl"
        >
        <div className="bg-white/5 p-8 border-b border-white/10">
          <button 
            type="button"
            onClick={handleBack}
            className="mb-6 text-gray-300 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold mb-2">Apply for a Loan</h1>
          <p className="text-gray-300">Complete this application to receive an instant credit decision.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-12">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center text-red-400">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* SECTION 1: Loan Details */}
          <section>
            <div className="flex items-center mb-6 text-indigo-400">
              <CreditCard className="h-6 w-6 mr-2" />
              <h2 className="text-xl font-semibold text-white">Loan Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-100 mb-2">Loan Type</label>
                <select 
                  {...register('loanType')}
                  className="w-full bg-white/5 border border-gray-500 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                >
                  <option value="">Select type...</option>
                  <option value="personal">Personal</option>
                  <option value="business">Business</option>
                  <option value="education">Education</option>
                  <option value="home">Home</option>
                </select>
                {errors.loanType && <p className="mt-1 text-sm text-red-400">{errors.loanType.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-100 mb-2">Amount (₹)</label>
                <input 
                  type="number"
                  placeholder="Min. 10000"
                  {...register('amount')}
                  className="w-full bg-white/5 border border-gray-500 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="mt-1 text-xs text-gray-300">Minimum loan amount is ₹10,000</p>
                {errors.amount && <p className="mt-1 text-sm text-red-400">{errors.amount.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-100 mb-2">Tenure (Months)</label>
                <input 
                  type="number"
                  placeholder="e.g. 12"
                  {...register('tenure')}
                  className="w-full bg-white/5 border border-gray-500 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="mt-1 text-xs text-gray-300">Between 3 and 360 months</p>
                {errors.tenure && <p className="mt-1 text-sm text-red-400">{errors.tenure.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-100 mb-2">Purpose</label>
                <input 
                  type="text"
                  placeholder="e.g. Medical emergency"
                  {...register('purpose')}
                  className="w-full bg-white/5 border border-gray-500 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="mt-1 text-xs text-gray-300">Provide a brief description (min. 10 characters)</p>
                {errors.purpose && <p className="mt-1 text-sm text-red-400">{errors.purpose.message}</p>}
              </div>
            </div>
          </section>

          <hr className="border-white/10" />

          {/* SECTION 2: Personal Information */}
          <section>
            <div className="flex items-center mb-6 text-purple-400">
              <User className="h-6 w-6 mr-2" />
              <h2 className="text-xl font-semibold text-white">Personal Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-100 mb-2">Full Name (As per PAN)</label>
                <input 
                  type="text"
                  placeholder="John Doe"
                  {...register('fullName')}
                  className="w-full bg-white/5 border border-gray-500 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {errors.fullName && <p className="mt-1 text-sm text-red-400">{errors.fullName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-100 mb-2">Phone Number</label>
                <input 
                  type="tel"
                  placeholder="9876543210"
                  {...register('phone')}
                  className="w-full bg-white/5 border border-gray-500 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="mt-1 text-xs text-gray-300">10-digit mobile number</p>
                {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-100 mb-2">Date of Birth</label>
                <input 
                  type="date"
                  {...register('dateOfBirth')}
                  className="w-full bg-white/5 border border-gray-500 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="mt-1 text-xs text-gray-300">Must be 18 years or older</p>
                {errors.dateOfBirth && <p className="mt-1 text-sm text-red-400">{errors.dateOfBirth.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-100 mb-2">PAN Number</label>
                <input 
                  type="text"
                  placeholder="ABCDE1234F"
                  {...register('panNumber')}
                  className="w-full bg-white/5 border border-gray-500 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                />
                <p className="mt-1 text-xs text-gray-300">Must be exactly 10 characters</p>
                {errors.panNumber && <p className="mt-1 text-sm text-red-400">{errors.panNumber.message}</p>}
              </div>
            </div>
          </section>

          <hr className="border-white/10" />

          {/* SECTION 3: Employment Details */}
          <section>
            <div className="flex items-center mb-6 text-pink-400">
              <Briefcase className="h-6 w-6 mr-2" />
              <h2 className="text-xl font-semibold text-white">Employment & Income</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-100 mb-2">Employment Type</label>
                <select 
                  {...register('employmentType')}
                  className="w-full bg-white/5 border border-gray-500 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                >
                  <option value="">Select type...</option>
                  <option value="salaried">Salaried</option>
                  <option value="self-employed">Self-employed</option>
                  <option value="student">Student</option>
                </select>
                {errors.employmentType && <p className="mt-1 text-sm text-red-400">{errors.employmentType.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-100 mb-2">Monthly Income (₹)</label>
                <input 
                  type="number"
                  placeholder="e.g. 50000"
                  {...register('monthlyIncome')}
                  className="w-full bg-white/5 border border-gray-500 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {errors.monthlyIncome && <p className="mt-1 text-sm text-red-400">{errors.monthlyIncome.message}</p>}
              </div>
            </div>
          </section>

          <hr className="border-white/10" />

          {/* SECTION 4: Documents */}
          <section>
            <div className="flex items-center mb-6 text-emerald-400">
              <FileText className="h-6 w-6 mr-2" />
              <h2 className="text-xl font-semibold text-white">Supporting Documents</h2>
            </div>
            
            <div className="bg-gray-800/30 border border-gray-500 border-dashed rounded-xl p-8 text-center transition-all hover:bg-white/5">
              {uploadingFile ? (
                <div className="flex flex-col items-center justify-center">
                   <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
                   <p className="text-white font-medium mb-2">Uploading Document(s)...</p>
                   <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
                     <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                   </div>
                   <p className="text-xs text-gray-300 mt-2">{uploadProgress}% Complete</p>
                </div>
              ) : (
                <div className="flex flex-col w-full">
                  {fileUrls && fileUrls.length > 0 && (
                    <div className="w-full mb-6">
                      <p className="text-left font-medium text-emerald-400 mb-4">Uploaded Documents ({fileUrls.length})</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {fileUrls.map((url, idx) => {
                          const filename = url.split('/').pop()?.split('?')[0] || `Document ${idx + 1}`;
                          return (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-gray-500">
                              <div className="flex items-center space-x-3 overflow-hidden">
                                <FileText className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                                <span className="text-sm text-gray-100 truncate" title={filename}>{filename}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setValue('fileUrls', fileUrls.filter((_, i) => i !== idx))}
                                className="text-xs text-red-400 hover:text-red-300 ml-2 flex-shrink-0"
                              >
                                Remove
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center justify-center border-t border-dashed border-gray-500 pt-6 mt-2">
                     <div className="h-16 w-16 bg-gray-800 text-gray-300 rounded-full flex items-center justify-center mb-4 cursor-pointer hover:text-white hover:bg-gray-700 transition-all" onClick={() => fileInputRef.current?.click()}>
                       <Upload className="h-8 w-8" />
                     </div>
                     <p className="text-white font-medium mb-1">Click to upload more documents</p>
                     <p className="text-sm text-gray-300">PDF, JPG, or PNG</p>
                     <input 
                       type="file" 
                       multiple
                       className="hidden" 
                       ref={fileInputRef} 
                       onChange={handleFileUpload} 
                       accept=".pdf,.jpg,.jpeg,.png"
                     />
                  </div>
                </div>
              )}
            </div>
          </section>

          <div className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => onSaveDraft(getValues())}
                disabled={isSubmitting || isSavingDraft}
                className="w-full sm:w-1/3 py-4 bg-gray-800 text-white border border-gray-500 font-semibold rounded-lg hover:bg-gray-700 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingDraft ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  'Save Draft'
                )}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isSavingDraft}
                className="w-full sm:w-2/3 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    Processing Application...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
            <p className="text-center text-xs text-gray-300 mt-4">
              By submitting this application, you authorize CreditPulse to access your credit report and process your data.
            </p>
          </div>
        </form>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full lg:w-[450px] shrink-0"
      >
        <AmortizationCalculator 
          initialAmount={watchedAmount || 100000} 
          initialTenure={watchedTenure || 12} 
        />
      </motion.div>
      </div>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative"
            >
              <h2 className="text-xl font-bold text-white mb-2">Unsaved Progress</h2>
              <p className="text-gray-300 text-sm mb-6">
                You have unsaved changes in your application. Would you like to save a draft to continue later, or discard your progress?
              </p>
              
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    setShowExitModal(false);
                    onSaveDraft(getValues());
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                  Save Draft & Exit
                </button>
                <button
                  onClick={() => {
                    setShowExitModal(false);
                    navigate('/dashboard');
                  }}
                  className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-lg transition-colors border border-red-500/20"
                >
                  Discard Progress
                </button>
                <button
                  onClick={() => setShowExitModal(false)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg transition-colors border border-white/5"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
