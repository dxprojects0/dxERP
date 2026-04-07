export const ROUTES = {
  home: '/',
  setup: '/setup',
  admin: '/admin',
  adminAnalytics: '/admin/analytics',
  userDashboard: '/user/dashboard',
  userTasks: '/user/tasks',
  userBills: '/user/bills',
  userAnalytics: '/user/analytics',
  userProfile: '/user/profile',
  userTools: '/user/tools',
  userCustomTools: '/user/custom-tools',
  userToolBase: '/user/tool',
  userReportsMonthly: '/user/reports/monthly',
} as const;

export const buildUserToolRoute = (toolId: string) => `${ROUTES.userToolBase}/${toolId}`;
export const buildMonthlyReportRoute = (month: string) => `${ROUTES.userReportsMonthly}/${month}`;
