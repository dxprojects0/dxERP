import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { ToolFeature } from '../types';
import { PRESET_TOOLS, TOOL_DEFINITIONS } from '../utils/catalog';
import { ChevronRight } from 'lucide-react';
import { buildUserToolRoute, ROUTES } from '../utils/routes';
import { isPaidPlan } from '../utils/plans';

const toolRouteMap: Record<ToolFeature, string> = {
  billing: buildUserToolRoute('billing'),
  inventory: buildUserToolRoute('inventory'),
  ledger: buildUserToolRoute('ledger'),
  ordering: buildUserToolRoute('ordering'),
  reports: buildUserToolRoute('reports'),
  expiry: buildUserToolRoute('expiry'),
  appointments: buildUserToolRoute('appointments'),
  ehr: buildUserToolRoute('ehr'),
  kitchen: buildUserToolRoute('kitchen'),
  staff: buildUserToolRoute('staff'),
  repairTickets: buildUserToolRoute('repairTickets'),
  warranty: buildUserToolRoute('warranty'),
  jobBooking: buildUserToolRoute('jobBooking'),
  expenses: buildUserToolRoute('expenses'),
};

const ToolsView: React.FC = () => {
  const navigate = useNavigate();
  const { customTools, selectedProfessionId, plan, isAdmin } = useSelector((state: RootState) => state.config);

  if (!selectedProfessionId) {
    return <Navigate to={ROUTES.setup} replace />;
  }

  const presetTools = PRESET_TOOLS[selectedProfessionId] || [];
  const activeTools: ToolFeature[] = isAdmin
    ? ((customTools.length
      ? customTools
      : (TOOL_DEFINITIONS || []).map((item) => item.id as ToolFeature)) as ToolFeature[])
    : isPaidPlan(plan)
      ? Array.from(new Set([...(customTools || []), ...(presetTools || [])])) as ToolFeature[]
      : (presetTools || []) as ToolFeature[];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <button onClick={() => navigate(ROUTES.userDashboard)} className="text-subtle font-semibold text-xs hover:underline mb-2 block">Back to Dashboard</button>
          <h1 className="text-3xl font-black">Selected Apps</h1>
          <p className="text-subtle text-sm">Open any tool and start working.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-20">
        {(activeTools || []).map((tool) => {
          const def = (TOOL_DEFINITIONS || []).find((item) => item.id === tool);
          return (
            <button
              key={tool}
              onClick={() => navigate(toolRouteMap[tool])}
              className="bg-surface p-5 rounded-xl border border-app text-left hover:shadow-md transition-all"
            >
              <p className="text-xs uppercase tracking-wider text-subtle font-bold">{def?.category || 'Tool'}</p>
              <h3 className="font-black text-lg mt-1">{def?.label || tool}</h3>
              <p className="text-xs text-subtle mt-1">{def?.description || 'Business workflow module'}</p>
              <div className="flex items-center justify-end pt-4">
                <ChevronRight size={16} className="text-subtle" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ToolsView;
