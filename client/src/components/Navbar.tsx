import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Zap } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === '/admin' || location.pathname === '/dashboard';

  const shouldBlockNavigation = () =>
    (window as Window & { __checkApplicationDirty?: () => boolean }).__checkApplicationDirty?.() ?? false;

  const handleDirtyNavigation = (e: React.MouseEvent) => {
    if (shouldBlockNavigation()) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('requestExitModal'));
    }
  };

  return (
    <nav className="fixed w-full z-50 backdrop-blur-md bg-gray-900/80 border-b border-white/10 shadow-sm shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link 
            to="/" 
            className="flex items-center space-x-1 sm:space-x-2"
            onClick={handleDirtyNavigation}
          >
            <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-500" />
            <span className="max-[410px]:hidden text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              CreditPulse
            </span>
          </Link>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-all shadow-lg hover:shadow-indigo-500/25"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-6">
                <Link to="/profile" onClick={handleDirtyNavigation} className="flex items-center space-x-2 group">
                  <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold overflow-hidden ring-2 ring-transparent group-hover:ring-indigo-400 transition-all">
                    {user.avatar ? (
                      <img src={user.avatar} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'
                    )}
                  </div>
                  <span className="text-gray-200 text-sm font-medium hidden sm:block group-hover:text-white transition-colors">
                    {user.name || 'Admin'}
                  </span>
                </Link>
                
                {!isDashboard && (
                  <Link
                    to={user.role === 'admin' ? '/admin' : '/dashboard'}
                    onClick={handleDirtyNavigation}
                    className="text-gray-300 hover:text-white text-sm font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                )}

                <button
                  onClick={(e) => {
                    if (shouldBlockNavigation()) {
                      e.preventDefault();
                      window.dispatchEvent(new CustomEvent('requestExitModal'));
                      return;
                    }
                    logout();
                    navigate('/login');
                  }}
                  className="flex items-center space-x-1 text-gray-400 hover:text-red-400 text-sm font-medium transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
