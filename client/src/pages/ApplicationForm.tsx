import { useState, useRef, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { motion } from 'framer-motion';
import { Briefcase, CreditCard, User, AlertCircle, Loader2, Upload, FileText, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const applicationSchema = z.object({
  loanType: z.enum(['personal', 'business', 'education', 'home'], {
    required_error: "Please select a loan type"
  }),
  amount: z.coerce.number().min(10000, 'Minimum loan amount is 10,000').max(10000000),
  tenure: z.coerce.number().min(3, 'Minimum tenure is 3 months').max(360, 'Maximum tenure is 360 months'),
  purpose: z.string().min(10, 'Please provide a valid purpose (min 10 characters)'),
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Invalid phone number'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  panNumber: z.string().length(10, 'PAN must be exactly 10 characters').toUpperCase(),
  employmentType: z.enum(['salaried', 'self-employed', 'student'], {
    required_error: "Please select employment type"
  }),
  monthlyIncome: z.coerce.number().min(0, 'Income cannot be negative'),
  fileUrl: z.string().url().optional()
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

export default function ApplicationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const [draftId, setDraftId] = useState<string | null>(editId);

  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBack = () => {
    if (window.confirm("Are you sure you want to discard your application? All unsaved progress will be lost.")) {
      navigate('/dashboard');
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
  });

  useEffect(() => {
    if (editId) {
      axiosInstance.get(`/loans/${editId}`).then(res => {
        const data = res.data.data;
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
          fileUrl: data.fileUrl
        });
      }).catch(err => {
        console.error("Failed to fetch loan for editing", err);
      });
    }
  }, [editId, reset]);

  const fileUrl = useWatch({ control, name: 'fileUrl' });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadProgress(0);
    setError('');

    try {
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
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
          setUploadProgress(percentCompleted);
        }
      });

      setValue('fileUrl', finalFileUrl);
    } catch (err) {
      setError('Failed to upload file. Please try again.');
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
        fileUrl: data.fileUrl
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

  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#0a0a0a] text-white px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto glass border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl"
      >
        <div className="bg-white/5 p-8 border-b border-white/10">
          <button 
            type="button"
            onClick={handleBack}
            className="mb-6 text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold mb-2">Apply for a Loan</h1>
          <p className="text-gray-400">Complete this application to receive an instant credit decision.</p>
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Loan Type</label>
                <select 
                  {...register('loanType')}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount (₹)</label>
                <input 
                  type="number"
                  placeholder="Min. 10000"
                  {...register('amount')}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">Minimum loan amount is ₹10,000</p>
                {errors.amount && <p className="mt-1 text-sm text-red-400">{errors.amount.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tenure (Months)</label>
                <input 
                  type="number"
                  placeholder="e.g. 12"
                  {...register('tenure')}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">Between 3 and 360 months</p>
                {errors.tenure && <p className="mt-1 text-sm text-red-400">{errors.tenure.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Purpose</label>
                <input 
                  type="text"
                  placeholder="e.g. Medical emergency"
                  {...register('purpose')}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">Provide a brief description (min. 10 characters)</p>
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name (As per PAN)</label>
                <input 
                  type="text"
                  placeholder="John Doe"
                  {...register('fullName')}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {errors.fullName && <p className="mt-1 text-sm text-red-400">{errors.fullName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                <input 
                  type="tel"
                  placeholder="9876543210"
                  {...register('phone')}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">10-digit mobile number</p>
                {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth</label>
                <input 
                  type="date"
                  {...register('dateOfBirth')}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">Must be 18 years or older</p>
                {errors.dateOfBirth && <p className="mt-1 text-sm text-red-400">{errors.dateOfBirth.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">PAN Number</label>
                <input 
                  type="text"
                  placeholder="ABCDE1234F"
                  {...register('panNumber')}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                />
                <p className="mt-1 text-xs text-gray-500">Must be exactly 10 characters</p>
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Employment Type</label>
                <select 
                  {...register('employmentType')}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                >
                  <option value="">Select type...</option>
                  <option value="salaried">Salaried</option>
                  <option value="self-employed">Self-employed</option>
                  <option value="student">Student</option>
                </select>
                {errors.employmentType && <p className="mt-1 text-sm text-red-400">{errors.employmentType.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Monthly Income (₹)</label>
                <input 
                  type="number"
                  placeholder="e.g. 50000"
                  {...register('monthlyIncome')}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
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
            
            <div className="bg-gray-800/30 border border-gray-700 border-dashed rounded-xl p-8 text-center transition-all hover:bg-gray-800/50">
              {fileUrl ? (
                <div className="flex flex-col items-center justify-center">
                   <div className="h-16 w-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4">
                     <FileText className="h-8 w-8" />
                   </div>
                   <p className="text-emerald-400 font-medium mb-2">Document Uploaded Successfully</p>
                   <button 
                     type="button" 
                     onClick={() => setValue('fileUrl', undefined)}
                     className="text-sm text-gray-400 hover:text-white"
                   >
                     Remove & Upload Different File
                   </button>
                </div>
              ) : uploadingFile ? (
                <div className="flex flex-col items-center justify-center">
                   <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
                   <p className="text-white font-medium mb-2">Uploading Document...</p>
                   <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
                     <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                   </div>
                   <p className="text-xs text-gray-400 mt-2">{uploadProgress}% Complete</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                   <div className="h-16 w-16 bg-gray-800 text-gray-400 rounded-full flex items-center justify-center mb-4 cursor-pointer hover:text-white hover:bg-gray-700 transition-all" onClick={() => fileInputRef.current?.click()}>
                     <Upload className="h-8 w-8" />
                   </div>
                   <p className="text-white font-medium mb-1">Click to upload document</p>
                   <p className="text-sm text-gray-400">PDF, JPG, or PNG (Max 5MB)</p>
                   <input 
                     type="file" 
                     className="hidden" 
                     ref={fileInputRef} 
                     onChange={handleFileUpload} 
                     accept=".pdf,.jpg,.jpeg,.png"
                   />
                </div>
              )}
            </div>
          </section>

          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
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
            <p className="text-center text-xs text-gray-500 mt-4">
              By submitting this application, you authorize CreditPulse to access your credit report and process your data.
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
