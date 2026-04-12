import React from 'react';
import { Lock } from 'lucide-react';
import { useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import { RootState } from '../store/store';
import { ROUTES } from '../utils/routes';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    authResolved,
  } = useSelector((state: RootState) => state.config);

  if (!authResolved) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto bg-surface border border-app rounded-2xl p-6 text-center space-y-3">
        <div className="h-12 w-12 mx-auto rounded-full bg-[color:var(--warning)]/20 flex items-center justify-center">
          <Lock size={20} />
        </div>
        <h1 className="text-xl font-black">Login Required</h1>
        <p className="text-sm text-subtle">This page contains user data. Please login and complete setup first.</p>
        <button onClick={() => navigate(ROUTES.setup)} className="px-4 py-2 rounded-lg bg-primary-app text-white font-semibold">
          Go to Login & Setup
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, authResolved } = useSelector((state: RootState) => state.config);

  if (!authResolved) return null;
  if (!isAuthenticated) return <Navigate to={ROUTES.admin} replace />;
  if (!isAdmin) return <Navigate to={ROUTES.home} replace />;
  return <>{children}</>;
};
