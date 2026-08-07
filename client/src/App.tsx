import { Suspense, lazy } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminLogin } from './pages/AdminLogin';
import { Unauthorized } from './pages/Unauthorized';
import './App.css';

const ApplicantDashboard = lazy(() => import('./pages/ApplicantDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ApplicationForm = lazy(() => import('./pages/ApplicationForm'));

function App() {
  return (
    <div className="min-h-screen bg-background text-white antialiased">
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
        <AuthProvider>
          <BrowserRouter>
            <Navbar />
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center pt-20 text-white">Loading...</div>}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/register" element={<Register />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Applicant Routes */}
                <Route element={<ProtectedRoute allowedRoles={['applicant']} />}>
                  <Route path="/dashboard" element={<ApplicantDashboard />} />
                  <Route path="/apply" element={<ApplicationForm />} />
                </Route>

                {/* Admin Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </GoogleOAuthProvider>
    </div>
  );
}

export default App;
