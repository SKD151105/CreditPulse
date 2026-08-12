import { Suspense, lazy, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminLogin } from './pages/AdminLogin';
import { Unauthorized } from './pages/Unauthorized';
import './App.css';

const ApplicantDashboard = lazy(() => import('./pages/ApplicantDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ApplicationForm = lazy(() => import('./pages/ApplicationForm'));
const AdminPromote = lazy(() => import('./pages/AdminPromote').then(m => ({ default: m.AdminPromote })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const HelpCenter = lazy(() => import('./pages/HelpCenter').then(m => ({ default: m.HelpCenter })));

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <div className="min-h-screen bg-background text-white antialiased flex flex-col">
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
        <AuthProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Navbar />
            <main className="flex-grow flex flex-col w-full relative">
              <Suspense fallback={<div className="flex-grow flex items-center justify-center pt-20 text-white">Loading...</div>}>
                <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/register" element={<Register />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/help" element={<HelpCenter />} />
                
                {/* Hidden setup routes */}
                <Route path="/hidden-admin-promote" element={<AdminPromote />} />

                {/* Applicant Routes */}
                <Route element={<ProtectedRoute allowedRoles={['applicant']} />}>
                  <Route path="/dashboard" element={<ApplicantDashboard />} />
                  <Route path="/apply" element={<ApplicationForm />} />
                </Route>

                {/* Admin Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                </Route>
                
                {/* Common Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['applicant', 'admin']} />}>
                  <Route path="/profile" element={<Profile />} />
                </Route>
              </Routes>
              </Suspense>
            </main>
            <Footer />
          </BrowserRouter>
        </AuthProvider>
      </GoogleOAuthProvider>
    </div>
  );
}

export default App;
