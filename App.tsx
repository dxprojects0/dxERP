import React, { Suspense, lazy } from 'react';
import './styles.css';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import Layout from './components/Layout';
import AppRuntime from './components/AppRuntime';
import { AdminRoute, ProtectedRoute } from './components/RouteGuards';
import { ROUTES } from './utils/routes';

const Home = lazy(() => import('./pages/Home'));
const Setup = lazy(() => import('./pages/Setup'));
const Admin = lazy(() => import('./pages/Admin'));
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'));
const CustomTools = lazy(() => import('./pages/CustomTools'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Bills = lazy(() => import('./pages/Bills'));
const Analytics = lazy(() => import('./pages/Analytics'));
const ToolsView = lazy(() => import('./pages/ToolsView'));
const Profile = lazy(() => import('./pages/Profile'));
const Tasks = lazy(() => import('./pages/Tasks'));
const POS = lazy(() => import('./pages/POS'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Ledger = lazy(() => import('./pages/Ledger'));
const SupplierOrders = lazy(() => import('./pages/SupplierOrders'));
const DailyReports = lazy(() => import('./pages/DailyReports'));
const ExpiryTracking = lazy(() => import('./pages/ExpiryTracking'));
const Appointments = lazy(() => import('./pages/Appointments'));
const HealthRecords = lazy(() => import('./pages/HealthRecords'));
const KitchenDisplay = lazy(() => import('./pages/KitchenDisplay'));
const StaffRoster = lazy(() => import('./pages/StaffRoster'));
const RepairJobs = lazy(() => import('./pages/RepairJobs'));
const WarrantyLogs = lazy(() => import('./pages/WarrantyLogs'));
const InstantBooking = lazy(() => import('./pages/InstantBooking'));
const ExpenseLog = lazy(() => import('./pages/ExpenseLog'));
const MonthlyReports = lazy(() => import('./pages/MonthlyReports'));

const PageLoader = () => null;

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppRuntime />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="setup" element={<Setup />} />
            <Route path="admin" element={<Admin />} />
            <Route path="admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
            <Route path="user/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="user/bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
            <Route path="user/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="user/custom-tools" element={<ProtectedRoute><CustomTools /></ProtectedRoute>} />
            <Route path="user/tools" element={<ProtectedRoute><ToolsView /></ProtectedRoute>} />
            <Route path="user/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="user/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="user/reports/monthly/:month" element={<ProtectedRoute><MonthlyReports /></ProtectedRoute>} />

            <Route path="user/tool/billing" element={<ProtectedRoute><POS /></ProtectedRoute>} />
            <Route path="user/tool/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="user/tool/ledger" element={<ProtectedRoute><Ledger /></ProtectedRoute>} />
            <Route path="user/tool/ordering" element={<ProtectedRoute><SupplierOrders /></ProtectedRoute>} />
            <Route path="user/tool/reports" element={<ProtectedRoute><DailyReports /></ProtectedRoute>} />
            <Route path="user/tool/expiry" element={<ProtectedRoute><ExpiryTracking /></ProtectedRoute>} />
            <Route path="user/tool/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
            <Route path="user/tool/ehr" element={<ProtectedRoute><HealthRecords /></ProtectedRoute>} />
            <Route path="user/tool/kitchen" element={<ProtectedRoute><KitchenDisplay /></ProtectedRoute>} />
            <Route path="user/tool/staff" element={<ProtectedRoute><StaffRoster /></ProtectedRoute>} />
            <Route path="user/tool/repairTickets" element={<ProtectedRoute><RepairJobs /></ProtectedRoute>} />
            <Route path="user/tool/warranty" element={<ProtectedRoute><WarrantyLogs /></ProtectedRoute>} />
            <Route path="user/tool/jobBooking" element={<ProtectedRoute><InstantBooking /></ProtectedRoute>} />
            <Route path="user/tool/expenses" element={<ProtectedRoute><ExpenseLog /></ProtectedRoute>} />

            <Route
              path="user/tool/:toolId"
              element={
                <ProtectedRoute>
                  <div className="h-full flex flex-col items-center justify-center space-y-4">
                    <div className="p-8 bg-slate-100 rounded-full text-slate-600 animate-pulse"><Wrench size={48} /></div>
                    <h2 className="text-2xl font-black text-slate-800">Module not found</h2>
                    <p className="text-slate-500 font-medium max-w-sm text-center">This tool ID is unknown. Use Tools screen to launch valid modules.</p>
                    <button onClick={() => window.history.back()} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold">Go Back</button>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route path="dashboard/:professionId" element={<Navigate to={ROUTES.userDashboard} replace />} />
            <Route path="custom" element={<Navigate to={ROUTES.userCustomTools} replace />} />
            <Route path="tools/:professionId" element={<Navigate to={ROUTES.userTools} replace />} />
            <Route path="tasks" element={<Navigate to={ROUTES.userTasks} replace />} />
            <Route path="profile" element={<Navigate to={ROUTES.userProfile} replace />} />
            <Route path="tool/:toolId" element={<Navigate to={ROUTES.userTools} replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
};

export default App;
