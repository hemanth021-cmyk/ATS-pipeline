import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { ApplicantStatus } from './pages/ApplicantStatus';
import { ApplyForJob } from './pages/ApplyForJob';
import { CompanyDashboard } from './pages/CompanyDashboard';
import { Login } from './pages/Login';

function Protected({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/status" element={<ApplicantStatus />} />
      <Route path="/apply/:jobId" element={<ApplyForJob />} />
      <Route
        path="/dashboard"
        element={
          <Protected>
            <CompanyDashboard />
          </Protected>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
