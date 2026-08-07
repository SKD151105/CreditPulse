import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const AdminLogin = () => {
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError('');
    try {
      const response = await axiosInstance.post('/auth/login', { ...data, adminOnly: true });
      const { accessToken, user } = response.data.data;
      login(accessToken, user);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to login');
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setError('');
    setIsGoogleLoading(true);
    try {
      const response = await axiosInstance.post('/auth/google', {
        credential: credentialResponse.credential,
        adminOnly: true,
      });
      const { accessToken, user: userData } = response.data.data;
      login(accessToken, userData);
      navigate(userData.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      console.error("Google Login Error:", err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to login with Google (Network/CORS error)');
      } else {
        setError('An unexpected error occurred during Google login');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background decoration - changed colors for admin */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute w-[500px] h-[500px] bg-red-500/20 rounded-full blur-[100px] -top-20 -left-20"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.2 }}
        className="absolute w-[400px] h-[400px] bg-orange-500/20 rounded-full blur-[100px] bottom-0 right-0"
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 glass rounded-2xl relative z-10 border border-red-500/20"
      >
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Admin Portal</h2>
          <p className="text-red-400 text-sm font-medium">Restricted Access</p>
        </div>
        
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-white placeholder-gray-500"
              placeholder="admin@example.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              {...register('password')}
              type="password"
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-white placeholder-gray-500"
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg font-medium shadow-lg hover:shadow-red-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In as Admin'}
          </button>
        </form>

        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-400" style={{ background: '#1c1c1e' }}>Or continue with</span>
          </div>
        </div>

        <div className="mt-6 flex justify-center opacity-90 hover:opacity-100 transition-opacity drop-shadow-md min-h-[40px]">
          {isGoogleLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-red-400 font-medium text-sm">Authenticating...</span>
            </div>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Sign-In failed')}
              theme="filled_black"
              shape="pill"
              width="320px"
            />
          )}
        </div>

        <p className="mt-6 text-center text-gray-400 text-sm">
          Not an admin?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
            Applicant Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
