import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AlertTriangle, Shield } from 'lucide-react';
import { signInAdmin, signOutFirebase } from '../utils/firebase';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { ROUTES } from '../utils/routes';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useSelector((state: RootState) => state.config);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('admin@dxtoolz.com');
  const [password, setPassword] = useState('');

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const credential = await signInAdmin(email, password);
      const isAdminEmail = (credential.user.email || '').toLowerCase() === 'admin@dxtoolz.com';
      if (!isAdminEmail) {
        await signOutFirebase();
        setError('This route is only for admin account.');
        return;
      }
      navigate(ROUTES.userDashboard, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Admin login failed.');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated && isAdmin) {
    return <Navigate to={ROUTES.userDashboard} replace />;
  }

  return (
    <div className="max-w-md mx-auto bg-surface border border-app rounded-2xl p-6 space-y-4">
      <div className="inline-flex items-center gap-2 text-sm text-subtle">
        <Shield size={16} /> Protected Admin Login
      </div>
      <h1 className="text-2xl font-black">Admin Access</h1>
      <p className="text-sm text-subtle">Only admin with the configured admin password is allowed.</p>
      <form onSubmit={handleLogin} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Admin email"
          className="w-full border border-app rounded-lg px-3 py-2 bg-transparent opacity-80"
          readOnly
          required
        />
        <input
          type="password"
          value={password}
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-app rounded-lg px-3 py-2 bg-transparent"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 rounded-lg bg-primary-app text-white font-semibold disabled:opacity-60"
        >
          {loading ? 'Please wait...' : 'Login as Admin'}
        </button>
      </form>
      {error && (
        <div className="text-sm rounded-lg border border-[var(--danger)] bg-[color:var(--danger)]/10 p-3 inline-flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
        </div>
      )}
    </div>
  );
};

export default Admin;
