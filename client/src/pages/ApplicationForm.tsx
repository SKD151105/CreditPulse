import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { motion } from 'framer-motion';
import { Briefcase, CreditCard, User, AlertCircle, Loader2 } from 'lucide-react';
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
  monthlyIncome: z.coerce.number().min(0, 'Income cannot be negative')
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

export default function ApplicationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
  });

  const onSubmit = async (data: ApplicationFormValues) => {
    setIsSubmitting(true);
    setError('');
    
    try {
      // Step 1: Create draft with initial loan details
      const draftRes = await axiosInstance.post('/loans', {
        loanType: data.loanType,
        amount: data.amount,
        tenure: data.tenure,
        purpose: data.purpose
      });
      
      const loanId = draftRes.data.data._id;
      
      // Step 2: Update draft with personal information
      await axiosInstance.patch(`/loans/${loanId}`, {
        fullName: data.fullName,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        panNumber: data.panNumber,
        employmentType: data.employmentType,
        monthlyIncome: data.monthlyIncome
      });
      
      // Step 3: Submit application for scoring
      await axiosInstance.post(`/loans/${loanId}/submit`);
      
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
