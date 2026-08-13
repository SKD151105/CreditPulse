import { useState } from 'react';
import axiosInstance from '../api/axios';
import axios from 'axios';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export const AdminPromote = () => {
  const [email, setEmail] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await axiosInstance.post('/auth/promote', { email, secretKey });
      if (response.data.success) {
        setMessage({ type: 'success', text: 'User successfully promoted to Admin! Redirecting to login...' });
        setTimeout(() => {
          // Clear current applicant session
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          // Force a full reload to clear any React state/context and go to admin login
          window.location.href = '/login';
        }, 2000);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage({
          type: 'error',
          text: err.response?.data?.message || 'Failed to promote user. Check the secret key and try again.',
        });
      } else {
        setMessage({
          type: 'error',
          text: 'An unexpected error occurred.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-background to-primary/20">
      <div className="w-full max-w-md space-y-8 glass p-10 rounded-2xl">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-white">
            Promote to Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Internal tool to bootstrap the first administrator
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handlePromote}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                User Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-white/20 bg-surface/50 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:z-10 sm:text-sm transition-all"
                placeholder="User Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="secretKey" className="sr-only">
                Super Admin Secret
              </label>
              <input
                id="secretKey"
                name="secretKey"
                type="password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-white/20 bg-surface/50 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:z-10 sm:text-sm transition-all"
                placeholder="SUPER_ADMIN_SECRET"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
              />
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500/20 border border-green-500/50 text-green-200' : 'bg-red-500/20 border border-red-500/50 text-red-200'}`}>
              {message.type === 'success' && <ShieldCheck className="w-5 h-5" />}
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Promoting...' : 'Promote User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
